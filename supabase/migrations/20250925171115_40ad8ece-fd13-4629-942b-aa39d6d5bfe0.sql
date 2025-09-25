-- ETAPA 1: CORREÇÃO CRÍTICA - RLS para Owner visualizar TODO o funil de vendas

-- Remover política existente restritiva
DROP POLICY IF EXISTS "Users can manage client funnel positions in their tenants" ON public.client_funnel_position;

-- Criar política específica para Owner/Admin com acesso total ao tenant
CREATE POLICY "Owners and admins can view all client funnel positions in their tenant" 
ON public.client_funnel_position
FOR SELECT 
USING (
  tenant_id = ANY (get_user_tenant_ids(auth.uid())) 
  AND (
    -- Owner e Admin têm acesso total ao tenant
    get_user_role_in_tenant(auth.uid(), tenant_id) IN ('owner', 'admin')
    OR
    -- Manager tem acesso limitado ao seu contexto de escritório
    (
      get_user_role_in_tenant(auth.uid(), tenant_id) = 'manager' 
      AND EXISTS (
        SELECT 1 FROM public.clients c 
        WHERE c.id = client_funnel_position.client_id 
          AND c.office_id = ANY (get_user_context_offices(auth.uid(), tenant_id))
      )
    )
    OR
    -- User/Viewer têm acesso apenas a clientes sob sua responsabilidade
    (
      get_user_role_in_tenant(auth.uid(), tenant_id) IN ('user', 'viewer')
      AND EXISTS (
        SELECT 1 FROM public.clients c 
        WHERE c.id = client_funnel_position.client_id 
          AND c.responsible_user_id = auth.uid()
      )
    )
  )
);

-- Política para inserção e atualização (operações de gestão)
CREATE POLICY "Users can manage client funnel positions based on role context"
ON public.client_funnel_position
FOR ALL
USING (
  tenant_id = ANY (get_user_tenant_ids(auth.uid()))
  AND (
    -- Owner/Admin podem gerenciar todas as posições
    get_user_role_in_tenant(auth.uid(), tenant_id) IN ('owner', 'admin')
    OR
    -- Manager pode gerenciar posições de clientes do seu contexto
    (
      get_user_role_in_tenant(auth.uid(), tenant_id) = 'manager'
      AND EXISTS (
        SELECT 1 FROM public.clients c 
        WHERE c.id = client_funnel_position.client_id 
          AND c.office_id = ANY (get_user_context_offices(auth.uid(), tenant_id))
      )
    )
    OR
    -- User pode gerenciar posições apenas de seus clientes
    (
      get_user_role_in_tenant(auth.uid(), tenant_id) = 'user'
      AND EXISTS (
        SELECT 1 FROM public.clients c 
        WHERE c.id = client_funnel_position.client_id 
          AND c.responsible_user_id = auth.uid()
      )
    )
  )
);

-- Comentário explicativo
COMMENT ON POLICY "Owners and admins can view all client funnel positions in their tenant" ON public.client_funnel_position IS 
'Permite que Owners e Admins visualizem TODAS as posições do funil de vendas no tenant, independente de escritório ou responsável. Managers têm acesso ao contexto de seus escritórios, e Users apenas aos seus clientes.';

-- Log para debug
DO $$
BEGIN
  RAISE NOTICE 'RLS atualizado para client_funnel_position - Owners agora podem ver todo o funil de vendas';
END
$$;