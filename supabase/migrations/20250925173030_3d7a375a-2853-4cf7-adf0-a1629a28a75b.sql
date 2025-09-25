-- ETAPA 1: Correção Crítica RLS - client_funnel_position
-- Garantir que Owners/Admins tenham acesso total ao funil de vendas

-- Remover políticas existentes que podem estar restritivas
DROP POLICY IF EXISTS "Owners and admins can view all client funnel positions in their" ON public.client_funnel_position;
DROP POLICY IF EXISTS "Users can manage client funnel positions based on role context" ON public.client_funnel_position;

-- Criar nova política SELECT para Owners/Admins com acesso total
CREATE POLICY "Owner and admin full access to tenant funnel positions"
ON public.client_funnel_position
FOR SELECT
USING (
  tenant_id = ANY (get_user_tenant_ids(auth.uid())) 
  AND (
    -- Owner/Admin: Acesso total ao tenant (SEM restrições de escritório)
    get_user_role_in_tenant(auth.uid(), tenant_id) IN ('owner', 'admin')
    OR
    -- Manager: Acesso limitado ao contexto de escritório
    (get_user_role_in_tenant(auth.uid(), tenant_id) = 'manager' 
     AND EXISTS (
       SELECT 1 FROM public.clients c 
       WHERE c.id = client_funnel_position.client_id 
       AND c.office_id = ANY (get_user_context_offices(auth.uid(), tenant_id))
     ))
    OR
    -- User/Viewer: Acesso apenas a clientes próprios
    (get_user_role_in_tenant(auth.uid(), tenant_id) IN ('user', 'viewer')
     AND EXISTS (
       SELECT 1 FROM public.clients c 
       WHERE c.id = client_funnel_position.client_id 
       AND c.responsible_user_id = auth.uid()
     ))
  )
);

-- Criar política ALL para operações CRUD
CREATE POLICY "Users can manage funnel positions based on role"
ON public.client_funnel_position
FOR ALL
USING (
  tenant_id = ANY (get_user_tenant_ids(auth.uid())) 
  AND (
    -- Owner/Admin: Gerenciamento total
    get_user_role_in_tenant(auth.uid(), tenant_id) IN ('owner', 'admin')
    OR
    -- Manager: Gerenciamento no contexto de escritório
    (get_user_role_in_tenant(auth.uid(), tenant_id) = 'manager' 
     AND EXISTS (
       SELECT 1 FROM public.clients c 
       WHERE c.id = client_funnel_position.client_id 
       AND c.office_id = ANY (get_user_context_offices(auth.uid(), tenant_id))
     ))
    OR
    -- User: Gerenciamento apenas de clientes próprios
    (get_user_role_in_tenant(auth.uid(), tenant_id) = 'user'
     AND EXISTS (
       SELECT 1 FROM public.clients c 
       WHERE c.id = client_funnel_position.client_id 
       AND c.responsible_user_id = auth.uid()
     ))
  )
);

-- ETAPA 2: Correção da função get_contextual_interactions
-- Resolver erro RPC 42804 e garantir retorno correto

CREATE OR REPLACE FUNCTION public.get_contextual_interactions(user_uuid uuid, tenant_uuid uuid)
RETURNS TABLE(
  id uuid, 
  tenant_id uuid, 
  client_id uuid, 
  seller_id uuid, 
  status character varying, 
  title text, 
  description text, 
  interaction_type character varying, 
  outcome character varying, 
  priority character varying, 
  next_action text, 
  scheduled_at timestamp with time zone, 
  completed_at timestamp with time zone, 
  next_action_date date, 
  settings jsonb, 
  created_at timestamp with time zone, 
  updated_at timestamp with time zone
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  user_role_val user_role;
  accessible_offices uuid[];
BEGIN
  -- Obter role e escritórios acessíveis do usuário
  SELECT public.get_user_role_in_tenant(user_uuid, tenant_uuid) INTO user_role_val;
  SELECT public.get_user_context_offices(user_uuid, tenant_uuid) INTO accessible_offices;
  
  -- Log para debug (temporário)
  RAISE LOG 'get_contextual_interactions: user=%, tenant=%, role=%, offices=%', 
    user_uuid, tenant_uuid, user_role_val, accessible_offices;
  
  -- Retornar interações baseadas no contexto do usuário
  RETURN QUERY
  SELECT 
    ci.id,
    ci.tenant_id,
    ci.client_id,
    ci.seller_id,
    ci.status,
    ci.title,
    ci.description,
    ci.interaction_type,
    ci.outcome,
    ci.priority,
    ci.next_action,
    ci.scheduled_at,
    ci.completed_at,
    ci.next_action_date,
    ci.settings,
    ci.created_at,
    ci.updated_at
  FROM public.client_interactions ci
  JOIN public.clients c ON c.id = ci.client_id
  WHERE ci.tenant_id = tenant_uuid
    AND (
      -- Owner/Admin: Todas as interações do tenant
      user_role_val IN ('owner', 'admin')
      OR
      -- Manager: Interações de clientes do seu contexto de escritório  
      (user_role_val = 'manager' AND (
        c.office_id = ANY(accessible_offices) 
        OR c.responsible_user_id = user_uuid 
        OR ci.seller_id = user_uuid
      ))
      OR
      -- User/Viewer: Apenas interações de clientes onde é responsável ou vendedor
      (user_role_val IN ('user', 'viewer') AND (
        c.responsible_user_id = user_uuid 
        OR ci.seller_id = user_uuid
      ))
    )
  ORDER BY ci.created_at DESC;
END;
$$;