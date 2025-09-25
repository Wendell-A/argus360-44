-- Criar tabela para histórico de repasses de clientes
CREATE TABLE public.client_transfers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  client_id UUID NOT NULL,
  from_user_id UUID NOT NULL,
  to_user_id UUID NOT NULL,
  reason TEXT,
  notes TEXT,
  status VARCHAR NOT NULL DEFAULT 'completed',
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.client_transfers ENABLE ROW LEVEL SECURITY;

-- Criar política para visualização baseada no contexto do usuário
CREATE POLICY "Users can view client transfers based on context" 
ON public.client_transfers 
FOR SELECT 
USING (
  tenant_id = ANY(get_user_tenant_ids(auth.uid())) AND (
    -- Owner/Admin podem ver todos os repasses
    get_user_role_in_tenant(auth.uid(), tenant_id) IN ('owner', 'admin') OR
    -- Manager pode ver repasses envolvendo clientes do seu escritório
    (get_user_role_in_tenant(auth.uid(), tenant_id) = 'manager' AND (
      EXISTS (
        SELECT 1 FROM public.clients c 
        WHERE c.id = client_transfers.client_id 
        AND c.office_id = ANY(get_user_context_offices(auth.uid(), c.tenant_id))
      )
    )) OR
    -- User pode ver repasses onde foi envolvido (doou ou recebeu)
    (get_user_role_in_tenant(auth.uid(), tenant_id) IN ('user', 'viewer') AND (
      from_user_id = auth.uid() OR to_user_id = auth.uid()
    ))
  )
);

-- Criar política para inserção (apenas admin/owner podem criar repasses)
CREATE POLICY "Admins can create client transfers" 
ON public.client_transfers 
FOR INSERT 
WITH CHECK (
  tenant_id = ANY(get_user_tenant_ids(auth.uid())) AND
  get_user_role_in_tenant(auth.uid(), tenant_id) IN ('owner', 'admin', 'manager') AND
  created_by = auth.uid()
);

-- Criar trigger para atualizar updated_at
CREATE TRIGGER update_client_transfers_updated_at
BEFORE UPDATE ON public.client_transfers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Criar índices para performance
CREATE INDEX idx_client_transfers_tenant_id ON public.client_transfers(tenant_id);
CREATE INDEX idx_client_transfers_client_id ON public.client_transfers(client_id);
CREATE INDEX idx_client_transfers_from_user_id ON public.client_transfers(from_user_id);
CREATE INDEX idx_client_transfers_to_user_id ON public.client_transfers(to_user_id);