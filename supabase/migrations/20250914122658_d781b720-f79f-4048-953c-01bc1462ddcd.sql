-- Criar tabelas para sistema de chamados/tickets de suporte

-- Enum para status dos tickets
CREATE TYPE support_ticket_status AS ENUM ('open', 'in_progress', 'pending_user', 'resolved', 'closed');

-- Enum para prioridade dos tickets  
CREATE TYPE support_ticket_priority AS ENUM ('low', 'normal', 'high', 'urgent');

-- Enum para categoria dos tickets
CREATE TYPE support_ticket_category AS ENUM ('bug', 'feature_request', 'technical_support', 'account', 'billing', 'training', 'other');

-- Tabela principal de tickets de suporte
CREATE TABLE public.support_tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  user_id UUID NOT NULL,
  assigned_to UUID NULL,
  
  -- Informações do ticket
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category support_ticket_category NOT NULL DEFAULT 'technical_support',
  priority support_ticket_priority NOT NULL DEFAULT 'normal',
  status support_ticket_status NOT NULL DEFAULT 'open',
  
  -- Metadados
  resolution TEXT NULL,
  resolved_at TIMESTAMP WITH TIME ZONE NULL,
  closed_at TIMESTAMP WITH TIME ZONE NULL,
  
  -- Campos de auditoria
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Configurações extras
  settings JSONB DEFAULT '{}',
  
  -- Índices
  CONSTRAINT fk_support_tickets_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_support_tickets_user FOREIGN KEY (user_id) REFERENCES profiles(id),
  CONSTRAINT fk_support_tickets_assigned FOREIGN KEY (assigned_to) REFERENCES profiles(id)
);

-- Tabela para comentários/respostas dos tickets
CREATE TABLE public.support_ticket_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL,
  user_id UUID NOT NULL,
  
  -- Conteúdo do comentário
  content TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false, -- Para comentários internos da equipe
  
  -- Anexos (opcional)
  attachments JSONB DEFAULT '[]',
  
  -- Auditoria
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  CONSTRAINT fk_support_comments_ticket FOREIGN KEY (ticket_id) REFERENCES support_tickets(id) ON DELETE CASCADE,
  CONSTRAINT fk_support_comments_user FOREIGN KEY (user_id) REFERENCES profiles(id)
);

-- Habilitar RLS
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_ticket_comments ENABLE ROW LEVEL SECURITY;

-- Políticas para tickets - usuários só podem ver tickets do próprio tenant
CREATE POLICY "Users can view tickets from their tenant" 
ON public.support_tickets 
FOR SELECT 
USING (tenant_id = ANY(get_user_tenant_ids(auth.uid())));

-- Usuários podem criar tickets no próprio tenant
CREATE POLICY "Users can create tickets in their tenant" 
ON public.support_tickets 
FOR INSERT 
WITH CHECK (
  tenant_id = ANY(get_user_tenant_ids(auth.uid())) 
  AND user_id = auth.uid()
);

-- Usuários podem editar apenas seus próprios tickets (e admins todos)
CREATE POLICY "Users can edit their own tickets" 
ON public.support_tickets 
FOR UPDATE 
USING (
  tenant_id = ANY(get_user_tenant_ids(auth.uid())) 
  AND (
    user_id = auth.uid() 
    OR get_user_role_in_tenant(auth.uid(), tenant_id) IN ('owner', 'admin')
  )
);

-- Políticas para comentários
CREATE POLICY "Users can view comments from tickets in their tenant" 
ON public.support_ticket_comments 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM support_tickets st 
    WHERE st.id = ticket_id 
    AND st.tenant_id = ANY(get_user_tenant_ids(auth.uid()))
  )
);

CREATE POLICY "Users can create comments on tickets in their tenant" 
ON public.support_ticket_comments 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM support_tickets st 
    WHERE st.id = ticket_id 
    AND st.tenant_id = ANY(get_user_tenant_ids(auth.uid()))
  )
  AND user_id = auth.uid()
);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_support_tickets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_support_tickets_updated_at
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_support_tickets_updated_at();

CREATE TRIGGER update_support_ticket_comments_updated_at
  BEFORE UPDATE ON public.support_ticket_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_support_tickets_updated_at();

-- Índices para performance
CREATE INDEX idx_support_tickets_tenant_id ON public.support_tickets(tenant_id);
CREATE INDEX idx_support_tickets_user_id ON public.support_tickets(user_id);
CREATE INDEX idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX idx_support_tickets_created_at ON public.support_tickets(created_at DESC);
CREATE INDEX idx_support_ticket_comments_ticket_id ON public.support_ticket_comments(ticket_id);
CREATE INDEX idx_support_ticket_comments_created_at ON public.support_ticket_comments(created_at DESC);