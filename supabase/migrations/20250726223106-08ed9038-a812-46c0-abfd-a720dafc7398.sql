-- ETAPA 1: FUNDAÇÃO DE CONTEXTOS - PLANO RBAC
-- Data: 26/01/2025 16:05
-- Objetivo: Criar infraestrutura de dados para controle hierárquico

-- 1.1 Criar tabela de contextos de permissão
CREATE TABLE public.permission_contexts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  context_type varchar(20) NOT NULL CHECK (context_type IN ('office', 'department', 'team', 'global')),
  context_id uuid, -- Pode ser NULL para contexto global
  granted_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  is_active boolean DEFAULT true,
  CONSTRAINT uk_user_context UNIQUE(tenant_id, user_id, context_type, context_id)
);

-- Habilitar RLS na tabela permission_contexts
ALTER TABLE public.permission_contexts ENABLE ROW LEVEL SECURITY;

-- Política RLS para permission_contexts
CREATE POLICY "Admins can manage permission contexts" 
ON public.permission_contexts 
FOR ALL 
USING (get_user_role_in_tenant(auth.uid(), tenant_id) = ANY (ARRAY['owner'::user_role, 'admin'::user_role, 'manager'::user_role]));

CREATE POLICY "Users can view permission contexts in their tenants" 
ON public.permission_contexts 
FOR SELECT 
USING (tenant_id = ANY (get_user_tenant_ids(auth.uid())));

-- 1.2 Atualizar tenant_users com campos contextuais
ALTER TABLE public.tenant_users 
ADD COLUMN IF NOT EXISTS office_id uuid REFERENCES public.offices(id),
ADD COLUMN IF NOT EXISTS department_id uuid REFERENCES public.departments(id),
ADD COLUMN IF NOT EXISTS team_id uuid REFERENCES public.teams(id),
ADD COLUMN IF NOT EXISTS context_level integer DEFAULT 1; -- 1=Global, 2=Office, 3=Team, 4=Individual

-- Comentário sobre os níveis de contexto
COMMENT ON COLUMN public.tenant_users.context_level IS 'Nível de contexto: 1=Global, 2=Office, 3=Team, 4=Individual';

-- 1.3 Funções de Contexto

-- Função para obter escritórios que o usuário pode acessar
CREATE OR REPLACE FUNCTION public.get_user_context_offices(user_uuid uuid, tenant_uuid uuid)
RETURNS uuid[] 
LANGUAGE plpgsql STABLE SECURITY DEFINER
AS $function$
DECLARE
  user_role_val user_role;
  office_ids uuid[];
BEGIN
  -- Obter role do usuário no tenant
  SELECT get_user_role_in_tenant(user_uuid, tenant_uuid) INTO user_role_val;
  
  -- Se é owner ou admin, pode acessar todos os escritórios
  IF user_role_val IN ('owner', 'admin') THEN
    SELECT ARRAY(
      SELECT id FROM public.offices 
      WHERE tenant_id = tenant_uuid AND active = true
    ) INTO office_ids;
    
  -- Se é manager, pode acessar escritórios onde tem contexto
  ELSIF user_role_val = 'manager' THEN
    SELECT ARRAY(
      SELECT DISTINCT COALESCE(tu.office_id, pc.context_id)
      FROM public.tenant_users tu
      LEFT JOIN public.permission_contexts pc ON pc.user_id = tu.user_id 
        AND pc.tenant_id = tu.tenant_id 
        AND pc.context_type = 'office' 
        AND pc.is_active = true
      WHERE tu.user_id = user_uuid 
        AND tu.tenant_id = tenant_uuid 
        AND tu.active = true
        AND (tu.office_id IS NOT NULL OR pc.context_id IS NOT NULL)
    ) INTO office_ids;
    
  -- Se é user ou viewer, apenas seu próprio escritório
  ELSE
    SELECT ARRAY(
      SELECT office_id 
      FROM public.tenant_users 
      WHERE user_id = user_uuid 
        AND tenant_id = tenant_uuid 
        AND active = true 
        AND office_id IS NOT NULL
    ) INTO office_ids;
  END IF;
  
  RETURN COALESCE(office_ids, ARRAY[]::uuid[]);
END;
$function$;

-- Função para verificar acesso a dados de outro usuário
CREATE OR REPLACE FUNCTION public.can_access_user_data(accessing_user_id uuid, target_user_id uuid, tenant_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER
AS $function$
DECLARE
  accessing_role user_role;
  target_office_id uuid;
  accessing_offices uuid[];
  can_access boolean := false;
BEGIN
  -- Se está tentando acessar seus próprios dados, sempre pode
  IF accessing_user_id = target_user_id THEN
    RETURN true;
  END IF;
  
  -- Obter role do usuário que está tentando acessar
  SELECT get_user_role_in_tenant(accessing_user_id, tenant_uuid) INTO accessing_role;
  
  -- Owner e Admin podem acessar dados de qualquer usuário
  IF accessing_role IN ('owner', 'admin') THEN
    RETURN true;
  END IF;
  
  -- Manager pode acessar dados de usuários do mesmo escritório ou contexto
  IF accessing_role = 'manager' THEN
    -- Obter escritório do usuário target
    SELECT office_id INTO target_office_id
    FROM public.tenant_users 
    WHERE user_id = target_user_id 
      AND tenant_id = tenant_uuid 
      AND active = true;
    
    -- Obter escritórios que o manager pode acessar
    SELECT get_user_context_offices(accessing_user_id, tenant_uuid) INTO accessing_offices;
    
    -- Verificar se o escritório do target está na lista do manager
    IF target_office_id = ANY(accessing_offices) THEN
      RETURN true;
    END IF;
  END IF;
  
  RETURN false;
END;
$function$;

-- Função para obter contexto completo do usuário
CREATE OR REPLACE FUNCTION public.get_user_full_context(user_uuid uuid, tenant_uuid uuid)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER
AS $function$
DECLARE
  user_context jsonb;
  user_role_val user_role;
  office_ids uuid[];
  department_ids uuid[];
  team_ids uuid[];
BEGIN
  -- Obter role do usuário
  SELECT get_user_role_in_tenant(user_uuid, tenant_uuid) INTO user_role_val;
  
  -- Obter escritórios acessíveis
  SELECT get_user_context_offices(user_uuid, tenant_uuid) INTO office_ids;
  
  -- Obter departamentos acessíveis baseado no role
  IF user_role_val IN ('owner', 'admin') THEN
    SELECT ARRAY(
      SELECT id FROM public.departments 
      WHERE tenant_id = tenant_uuid
    ) INTO department_ids;
  ELSE
    SELECT ARRAY(
      SELECT DISTINCT COALESCE(tu.department_id, pc.context_id)
      FROM public.tenant_users tu
      LEFT JOIN public.permission_contexts pc ON pc.user_id = tu.user_id 
        AND pc.tenant_id = tu.tenant_id 
        AND pc.context_type = 'department' 
        AND pc.is_active = true
      WHERE tu.user_id = user_uuid 
        AND tu.tenant_id = tenant_uuid 
        AND tu.active = true
        AND (tu.department_id IS NOT NULL OR pc.context_id IS NOT NULL)
    ) INTO department_ids;
  END IF;
  
  -- Obter teams acessíveis baseado no role
  IF user_role_val IN ('owner', 'admin') THEN
    SELECT ARRAY(
      SELECT id FROM public.teams 
      WHERE tenant_id = tenant_uuid AND active = true
    ) INTO team_ids;
  ELSE
    SELECT ARRAY(
      SELECT DISTINCT COALESCE(tu.team_id, pc.context_id)
      FROM public.tenant_users tu
      LEFT JOIN public.permission_contexts pc ON pc.user_id = tu.user_id 
        AND pc.tenant_id = tu.tenant_id 
        AND pc.context_type = 'team' 
        AND pc.is_active = true
      WHERE tu.user_id = user_uuid 
        AND tu.tenant_id = tenant_uuid 
        AND tu.active = true
        AND (tu.team_id IS NOT NULL OR pc.context_id IS NOT NULL)
    ) INTO team_ids;
  END IF;
  
  -- Montar objeto de contexto
  user_context := jsonb_build_object(
    'user_id', user_uuid,
    'tenant_id', tenant_uuid,
    'role', user_role_val,
    'accessible_offices', office_ids,
    'accessible_departments', COALESCE(department_ids, ARRAY[]::uuid[]),
    'accessible_teams', COALESCE(team_ids, ARRAY[]::uuid[]),
    'is_owner_or_admin', user_role_val IN ('owner', 'admin'),
    'is_manager', user_role_val = 'manager',
    'is_user', user_role_val IN ('user', 'viewer'),
    'context_level', CASE 
      WHEN user_role_val IN ('owner', 'admin') THEN 1
      WHEN user_role_val = 'manager' THEN 2
      ELSE 4
    END
  );
  
  RETURN user_context;
END;
$function$;

-- Trigger para atualizar updated_at em permission_contexts
CREATE TRIGGER update_permission_contexts_updated_at
  BEFORE UPDATE ON public.permission_contexts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();