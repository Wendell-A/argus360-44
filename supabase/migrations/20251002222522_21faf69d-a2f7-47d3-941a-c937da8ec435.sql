-- FASE 1: CORREÇÃO CRÍTICA - SEPARAÇÃO DE ROLES (CORRIGIDO)
-- Data: 02/10/2025
-- Descrição: Move roles de tenant_users para tabela dedicada user_roles
-- Previne: Privilege Escalation Attacks
-- Usa o enum user_role existente

-- 1. Criar tabela user_roles dedicada usando enum existente
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  tenant_id uuid NOT NULL,
  role user_role NOT NULL,
  granted_by uuid,
  granted_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE (user_id, tenant_id, role)
);

-- Habilitar RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 2. Criar função Security Definer para verificar role
CREATE OR REPLACE FUNCTION public.has_role_in_tenant(_user_id uuid, _tenant_id uuid, _role user_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND tenant_id = _tenant_id
      AND role = _role
  )
$$;

-- 3. Criar políticas RLS para user_roles
CREATE POLICY "Admins can manage roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (
  public.has_role_in_tenant(auth.uid(), tenant_id, 'admin'::user_role) OR
  public.has_role_in_tenant(auth.uid(), tenant_id, 'owner'::user_role)
);

CREATE POLICY "Users can view roles in their tenant"
ON public.user_roles
FOR SELECT
TO authenticated
USING (
  tenant_id IN (
    SELECT tenant_id 
    FROM public.tenant_users 
    WHERE user_id = auth.uid() AND active = true
  )
);

-- 4. Migrar roles existentes de tenant_users para user_roles
INSERT INTO public.user_roles (user_id, tenant_id, role, granted_at)
SELECT 
  user_id, 
  tenant_id, 
  role,
  joined_at
FROM public.tenant_users
WHERE role IS NOT NULL
ON CONFLICT (user_id, tenant_id, role) DO NOTHING;

-- 5. Atualizar função get_user_role_in_tenant para usar nova tabela
CREATE OR REPLACE FUNCTION public.get_user_role_in_tenant(user_uuid uuid, tenant_uuid uuid)
RETURNS user_role
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role_val user_role;
BEGIN
  SELECT role INTO user_role_val
  FROM public.user_roles
  WHERE user_id = user_uuid 
    AND tenant_id = tenant_uuid
  ORDER BY 
    CASE role
      WHEN 'owner' THEN 1
      WHEN 'admin' THEN 2
      WHEN 'manager' THEN 3
      WHEN 'user' THEN 4
      WHEN 'viewer' THEN 5
    END
  LIMIT 1;
  
  RETURN COALESCE(user_role_val, 'viewer'::user_role);
END;
$$;

-- 6. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_user_roles_user_tenant ON public.user_roles(user_id, tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_tenant ON public.user_roles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);

-- 7. Criar função para verificar múltiplos roles
CREATE OR REPLACE FUNCTION public.has_any_role_in_tenant(_user_id uuid, _tenant_id uuid, _roles user_role[])
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND tenant_id = _tenant_id
      AND role = ANY(_roles)
  )
$$;

-- 8. Criar trigger para auditoria de mudanças de role
CREATE OR REPLACE FUNCTION public.audit_role_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_log (
      tenant_id, user_id, table_name, record_id, action, new_values, ip_address, user_agent
    ) VALUES (
      NEW.tenant_id, auth.uid(), 'user_roles', NEW.id, 'ROLE_GRANTED',
      jsonb_build_object('target_user', NEW.user_id, 'role', NEW.role, 'granted_by', NEW.granted_by),
      inet_client_addr(),
      current_setting('request.headers', true)::json->>'user-agent'
    );
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_log (
      tenant_id, user_id, table_name, record_id, action, old_values, ip_address, user_agent
    ) VALUES (
      OLD.tenant_id, auth.uid(), 'user_roles', OLD.id, 'ROLE_REVOKED',
      jsonb_build_object('target_user', OLD.user_id, 'role', OLD.role),
      inet_client_addr(),
      current_setting('request.headers', true)::json->>'user-agent'
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER audit_role_changes_trigger
AFTER INSERT OR DELETE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.audit_role_changes();

-- 9. Comentários para documentação
COMMENT ON TABLE public.user_roles IS 'Tabela dedicada para roles de usuários - previne privilege escalation';
COMMENT ON FUNCTION public.has_role_in_tenant IS 'Verifica se usuário tem role específico no tenant - SECURITY DEFINER para evitar recursão RLS';
COMMENT ON FUNCTION public.get_user_role_in_tenant IS 'Retorna o role de maior privilégio do usuário no tenant';