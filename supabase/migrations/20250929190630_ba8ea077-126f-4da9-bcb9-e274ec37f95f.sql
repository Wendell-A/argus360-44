-- Criar tabela proposals (orçamentos)
CREATE TABLE public.proposals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  office_id UUID NOT NULL REFERENCES public.offices(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  product_id UUID NOT NULL,
  valor_da_simulacao NUMERIC NOT NULL,
  valor_da_parcela NUMERIC NOT NULL,
  prazo INTEGER NOT NULL,
  data_da_simulacao DATE NOT NULL,
  taxa_comissao_escritorio NUMERIC NOT NULL,
  taxa_comissao_vendedor NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;

-- Política de SELECT: usuários podem ver orçamentos do seu tenant baseado no contexto
CREATE POLICY "Users can view proposals based on context"
ON public.proposals
FOR SELECT
USING (
  tenant_id = ANY(get_user_tenant_ids(auth.uid()))
  AND (
    -- Owner/Admin: todos os orçamentos
    get_user_role_in_tenant(auth.uid(), tenant_id) IN ('owner', 'admin')
    OR
    -- Manager: orçamentos dos escritórios acessíveis
    (
      get_user_role_in_tenant(auth.uid(), tenant_id) = 'manager'
      AND office_id = ANY(get_user_context_offices(auth.uid(), tenant_id))
    )
    OR
    -- User/Viewer: orçamentos de clientes onde é responsável
    (
      get_user_role_in_tenant(auth.uid(), tenant_id) IN ('user', 'viewer')
      AND EXISTS (
        SELECT 1 FROM public.clients c
        WHERE c.id = proposals.client_id
        AND c.responsible_user_id = auth.uid()
      )
    )
  )
);

-- Política de INSERT: usuários podem criar orçamentos dentro do seu contexto
CREATE POLICY "Users can create proposals within their context"
ON public.proposals
FOR INSERT
WITH CHECK (
  tenant_id = ANY(get_user_tenant_ids(auth.uid()))
  AND (
    -- Owner/Admin: podem criar em qualquer escritório
    get_user_role_in_tenant(auth.uid(), tenant_id) IN ('owner', 'admin')
    OR
    -- Manager: podem criar nos escritórios acessíveis
    (
      get_user_role_in_tenant(auth.uid(), tenant_id) = 'manager'
      AND office_id = ANY(get_user_context_offices(auth.uid(), tenant_id))
    )
    OR
    -- User: podem criar no seu escritório
    (
      get_user_role_in_tenant(auth.uid(), tenant_id) = 'user'
      AND office_id = ANY(get_user_context_offices(auth.uid(), tenant_id))
    )
  )
);

-- Política de UPDATE: apenas admins e managers podem atualizar
CREATE POLICY "Admins and managers can update proposals"
ON public.proposals
FOR UPDATE
USING (
  tenant_id = ANY(get_user_tenant_ids(auth.uid()))
  AND get_user_role_in_tenant(auth.uid(), tenant_id) IN ('owner', 'admin', 'manager')
)
WITH CHECK (
  tenant_id = ANY(get_user_tenant_ids(auth.uid()))
  AND get_user_role_in_tenant(auth.uid(), tenant_id) IN ('owner', 'admin', 'manager')
);

-- Índices para otimização de queries
CREATE INDEX idx_proposals_tenant_id ON public.proposals(tenant_id);
CREATE INDEX idx_proposals_client_id ON public.proposals(client_id);
CREATE INDEX idx_proposals_office_id ON public.proposals(office_id);
CREATE INDEX idx_proposals_product_id ON public.proposals(product_id);
CREATE INDEX idx_proposals_data_simulacao ON public.proposals(data_da_simulacao);
CREATE INDEX idx_proposals_created_at ON public.proposals(created_at);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_proposals_updated_at
BEFORE UPDATE ON public.proposals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();