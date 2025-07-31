-- ETAPA 1: Correção SQL Injection Prevention - Search Path
-- Data: 29 de Janeiro de 2025, 14:00 UTC
-- Objetivo: Corrigir vulnerabilidades de search_path em funções críticas

-- 1. Corrigir get_user_role_in_tenant
CREATE OR REPLACE FUNCTION public.get_user_role_in_tenant(user_uuid uuid, tenant_uuid uuid)
RETURNS user_role
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'  -- SEGURANÇA: Evita SQL injection
AS $$
DECLARE
  user_role_result user_role;
BEGIN
  SELECT role INTO user_role_result
  FROM public.tenant_users 
  WHERE user_id = user_uuid 
    AND tenant_id = tenant_uuid 
    AND active = true;
  
  RETURN COALESCE(user_role_result, 'viewer'::user_role);
END;
$$;

-- 2. Corrigir get_user_context_offices
CREATE OR REPLACE FUNCTION public.get_user_context_offices(user_uuid uuid, tenant_uuid uuid)
RETURNS uuid[]
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  user_role_val user_role;
  office_ids uuid[];
BEGIN
  -- Obter role do usuário no tenant
  SELECT public.get_user_role_in_tenant(user_uuid, tenant_uuid) INTO user_role_val;
  
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
$$;

-- 3. Corrigir can_access_user_data
CREATE OR REPLACE FUNCTION public.can_access_user_data(accessing_user_id uuid, target_user_id uuid, tenant_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
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
  SELECT public.get_user_role_in_tenant(accessing_user_id, tenant_uuid) INTO accessing_role;
  
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
    SELECT public.get_user_context_offices(accessing_user_id, tenant_uuid) INTO accessing_offices;
    
    -- Verificar se o escritório do target está na lista do manager
    IF target_office_id = ANY(accessing_offices) THEN
      RETURN true;
    END IF;
  END IF;
  
  RETURN false;
END;
$$;

-- 4. Corrigir get_user_full_context
CREATE OR REPLACE FUNCTION public.get_user_full_context(user_uuid uuid, tenant_uuid uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  user_context jsonb;
  user_role_val user_role;
  office_ids uuid[];
  department_ids uuid[];
  team_ids uuid[];
BEGIN
  -- Obter role do usuário
  SELECT public.get_user_role_in_tenant(user_uuid, tenant_uuid) INTO user_role_val;
  
  -- Obter escritórios acessíveis
  SELECT public.get_user_context_offices(user_uuid, tenant_uuid) INTO office_ids;
  
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
$$;

-- 5. Corrigir can_user_perform_action
CREATE OR REPLACE FUNCTION public.can_user_perform_action(user_uuid uuid, tenant_uuid uuid, action_type text, resource_type text, resource_id uuid DEFAULT NULL::uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  user_role_val user_role;
  user_offices uuid[];
  can_perform boolean := false;
BEGIN
  -- Obter role e contexto do usuário
  SELECT public.get_user_role_in_tenant(user_uuid, tenant_uuid) INTO user_role_val;
  SELECT public.get_user_context_offices(user_uuid, tenant_uuid) INTO user_offices;
  
  -- Owner e Admin podem fazer tudo
  IF user_role_val IN ('owner', 'admin') THEN
    RETURN true;
  END IF;
  
  -- Verificações específicas por tipo de recurso
  CASE resource_type
    WHEN 'client' THEN
      IF action_type IN ('read', 'create', 'update', 'delete') THEN
        -- Manager pode gerenciar clientes dos escritórios acessíveis
        IF user_role_val = 'manager' THEN
          -- Se resource_id fornecido, verificar se cliente está em escritório acessível
          IF resource_id IS NOT NULL THEN
            SELECT EXISTS(
              SELECT 1 FROM public.clients 
              WHERE id = resource_id 
              AND office_id = ANY(user_offices)
            ) INTO can_perform;
          ELSE
            can_perform := true; -- Pode criar/listar dentro do contexto
          END IF;
        -- User pode gerenciar apenas clientes sob responsabilidade
        ELSIF user_role_val = 'user' AND action_type != 'delete' THEN
          IF resource_id IS NOT NULL THEN
            SELECT EXISTS(
              SELECT 1 FROM public.clients 
              WHERE id = resource_id 
              AND responsible_user_id = user_uuid
            ) INTO can_perform;
          ELSE
            can_perform := true; -- Pode criar/listar próprios clientes
          END IF;
        END IF;
      END IF;
      
    WHEN 'sale' THEN
      IF action_type IN ('read', 'create', 'update') THEN
        -- Manager pode gerenciar vendas dos escritórios acessíveis
        IF user_role_val = 'manager' THEN
          IF resource_id IS NOT NULL THEN
            SELECT EXISTS(
              SELECT 1 FROM public.sales 
              WHERE id = resource_id 
              AND office_id = ANY(user_offices)
            ) INTO can_perform;
          ELSE
            can_perform := true;
          END IF;
        -- User pode gerenciar apenas próprias vendas
        ELSIF user_role_val = 'user' THEN
          IF resource_id IS NOT NULL THEN
            SELECT EXISTS(
              SELECT 1 FROM public.sales 
              WHERE id = resource_id 
              AND seller_id = user_uuid
            ) INTO can_perform;
          ELSE
            can_perform := true;
          END IF;
        END IF;
      END IF;
      
    WHEN 'commission' THEN
      IF action_type = 'read' THEN
        -- Manager pode ver comissões dos escritórios acessíveis
        IF user_role_val = 'manager' THEN
          can_perform := true; -- RLS já filtra
        -- User pode ver apenas próprias comissões
        ELSIF user_role_val = 'user' THEN
          can_perform := true; -- RLS já filtra
        END IF;
      -- Apenas Manager+ podem gerenciar comissões
      ELSIF action_type IN ('create', 'update', 'delete') AND user_role_val = 'manager' THEN
        can_perform := true;
      END IF;
      
    ELSE
      -- Para outros recursos, usar lógica padrão de role
      can_perform := user_role_val IN ('manager', 'user') AND action_type IN ('read', 'create', 'update');
  END CASE;
  
  RETURN can_perform;
END;
$$;