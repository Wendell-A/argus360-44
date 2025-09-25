-- Criar função RPC para obter interações contextuais
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
SET search_path TO 'public'
AS $function$
DECLARE
  user_role_val user_role;
  accessible_offices uuid[];
BEGIN
  -- Obter role e escritórios acessíveis do usuário
  SELECT public.get_user_role_in_tenant(user_uuid, tenant_uuid) INTO user_role_val;
  SELECT public.get_user_context_offices(user_uuid, tenant_uuid) INTO accessible_offices;
  
  -- Retornar interações baseadas no contexto do usuário
  RETURN QUERY
  SELECT ci.*
  FROM public.client_interactions ci
  JOIN public.clients c ON c.id = ci.client_id
  WHERE ci.tenant_id = tenant_uuid
    AND (
      -- Owner/Admin: Todas as interações do tenant
      user_role_val IN ('owner', 'admin')
      OR
      -- Manager: Interações de clientes do seu escritório ou onde é responsável
      (user_role_val = 'manager' AND (
        c.office_id = ANY(accessible_offices) 
        OR c.responsible_user_id = user_uuid 
        OR ci.seller_id = user_uuid
      ))
      OR
      -- User/Viewer: Apenas interações de clientes onde é responsável ou vendedor da interação
      (user_role_val IN ('user', 'viewer') AND (
        c.responsible_user_id = user_uuid 
        OR ci.seller_id = user_uuid
      ))
    );
END;
$function$;

-- Atualizar política RLS da tabela client_interactions para ser mais restritiva
DROP POLICY IF EXISTS "Users can manage client interactions in their tenants" ON public.client_interactions;

CREATE POLICY "Users can view interactions based on context"
ON public.client_interactions
FOR SELECT
USING (
  tenant_id = ANY(get_user_tenant_ids(auth.uid()))
  AND (
    -- Owner/Admin: Todas as interações do tenant
    get_user_role_in_tenant(auth.uid(), tenant_id) IN ('owner', 'admin')
    OR
    -- Manager: Interações de clientes do seu contexto
    (get_user_role_in_tenant(auth.uid(), tenant_id) = 'manager' AND (
      EXISTS (
        SELECT 1 FROM public.clients c 
        WHERE c.id = client_interactions.client_id 
          AND (
            c.office_id = ANY(get_user_context_offices(auth.uid(), tenant_id))
            OR c.responsible_user_id = auth.uid()
            OR client_interactions.seller_id = auth.uid()
          )
      )
    ))
    OR
    -- User/Viewer: Apenas suas próprias interações ou de clientes responsáveis
    (get_user_role_in_tenant(auth.uid(), tenant_id) IN ('user', 'viewer') AND (
      seller_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.clients c 
        WHERE c.id = client_interactions.client_id 
          AND c.responsible_user_id = auth.uid()
      )
    ))
  )
);

CREATE POLICY "Users can manage interactions based on context"
ON public.client_interactions
FOR ALL
USING (
  tenant_id = ANY(get_user_tenant_ids(auth.uid()))
  AND (
    -- Owner/Admin: Podem gerenciar todas as interações
    get_user_role_in_tenant(auth.uid(), tenant_id) IN ('owner', 'admin')
    OR
    -- Manager: Podem gerenciar interações do seu contexto
    (get_user_role_in_tenant(auth.uid(), tenant_id) = 'manager' AND (
      EXISTS (
        SELECT 1 FROM public.clients c 
        WHERE c.id = client_interactions.client_id 
          AND (
            c.office_id = ANY(get_user_context_offices(auth.uid(), tenant_id))
            OR c.responsible_user_id = auth.uid()
          )
      )
      OR seller_id = auth.uid()
    ))
    OR
    -- User: Podem gerenciar apenas suas próprias interações
    (get_user_role_in_tenant(auth.uid(), tenant_id) = 'user' AND (
      seller_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.clients c 
        WHERE c.id = client_interactions.client_id 
          AND c.responsible_user_id = auth.uid()
      )
    ))
  )
);