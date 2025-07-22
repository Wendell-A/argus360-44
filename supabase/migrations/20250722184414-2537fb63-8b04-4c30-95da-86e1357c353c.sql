
-- Criar tabela de interações com clientes
CREATE TABLE public.client_interactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  client_id UUID NOT NULL,
  seller_id UUID NOT NULL,
  interaction_type VARCHAR NOT NULL CHECK (interaction_type IN ('call', 'whatsapp', 'email', 'meeting', 'visit', 'proposal_sent', 'follow_up')),
  status VARCHAR NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'scheduled', 'cancelled')),
  title TEXT NOT NULL,
  description TEXT,
  scheduled_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  next_action TEXT,
  next_action_date DATE,
  priority VARCHAR NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  outcome VARCHAR CHECK (outcome IN ('positive', 'neutral', 'negative')),
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de fases do funil de vendas
CREATE TABLE public.sales_funnel_stages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL,
  color TEXT NOT NULL DEFAULT '#3b82f6',
  automated_tasks JSONB DEFAULT '[]',
  conversion_goals JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tenant_id, order_index)
);

-- Criar tabela de posição do cliente no funil
CREATE TABLE public.client_funnel_position (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  client_id UUID NOT NULL,
  stage_id UUID NOT NULL,
  entered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  estimated_close_date DATE,
  probability NUMERIC DEFAULT 0 CHECK (probability >= 0 AND probability <= 100),
  expected_value NUMERIC DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(client_id, tenant_id)
);

-- Criar tabela de templates de mensagem
CREATE TABLE public.message_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  name TEXT NOT NULL,
  category VARCHAR NOT NULL CHECK (category IN ('whatsapp', 'email', 'sms')),
  stage_id UUID,
  template_text TEXT NOT NULL,
  variables JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de tarefas automatizadas
CREATE TABLE public.automated_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  client_id UUID NOT NULL,
  seller_id UUID NOT NULL,
  task_type VARCHAR NOT NULL CHECK (task_type IN ('follow_up', 'send_proposal', 'schedule_meeting', 'send_contract', 'call_client', 'send_whatsapp')),
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE NOT NULL,
  priority VARCHAR NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status VARCHAR NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  trigger_stage_id UUID,
  template_id UUID,
  completed_at TIMESTAMP WITH TIME ZONE,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adicionar triggers para updated_at
CREATE TRIGGER trigger_update_timestamp_client_interactions
    BEFORE UPDATE ON public.client_interactions
    FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER trigger_update_timestamp_sales_funnel_stages
    BEFORE UPDATE ON public.sales_funnel_stages
    FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER trigger_update_timestamp_client_funnel_position
    BEFORE UPDATE ON public.client_funnel_position
    FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER trigger_update_timestamp_message_templates
    BEFORE UPDATE ON public.message_templates
    FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER trigger_update_timestamp_automated_tasks
    BEFORE UPDATE ON public.automated_tasks
    FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.client_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_funnel_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_funnel_position ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automated_tasks ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para client_interactions
CREATE POLICY "Users can manage client interactions in their tenants" 
  ON public.client_interactions FOR ALL 
  USING (tenant_id = ANY(get_user_tenant_ids(auth.uid())));

-- Políticas RLS para sales_funnel_stages
CREATE POLICY "Admins can manage funnel stages" 
  ON public.sales_funnel_stages FOR ALL 
  USING (get_user_role_in_tenant(auth.uid(), tenant_id) = ANY(ARRAY['owner'::user_role, 'admin'::user_role, 'manager'::user_role]));

CREATE POLICY "Users can view funnel stages in their tenants" 
  ON public.sales_funnel_stages FOR SELECT 
  USING (tenant_id = ANY(get_user_tenant_ids(auth.uid())));

-- Políticas RLS para client_funnel_position
CREATE POLICY "Users can manage client funnel positions in their tenants" 
  ON public.client_funnel_position FOR ALL 
  USING (tenant_id = ANY(get_user_tenant_ids(auth.uid())));

-- Políticas RLS para message_templates
CREATE POLICY "Admins can manage message templates" 
  ON public.message_templates FOR ALL 
  USING (get_user_role_in_tenant(auth.uid(), tenant_id) = ANY(ARRAY['owner'::user_role, 'admin'::user_role, 'manager'::user_role]));

CREATE POLICY "Users can view message templates in their tenants" 
  ON public.message_templates FOR SELECT 
  USING (tenant_id = ANY(get_user_tenant_ids(auth.uid())));

-- Políticas RLS para automated_tasks
CREATE POLICY "Users can manage automated tasks in their tenants" 
  ON public.automated_tasks FOR ALL 
  USING (tenant_id = ANY(get_user_tenant_ids(auth.uid())));

-- Inserir fases padrão do funil de vendas para todos os tenants existentes
INSERT INTO public.sales_funnel_stages (tenant_id, name, description, order_index, color)
SELECT 
  t.id as tenant_id,
  stage_data.name,
  stage_data.description,
  stage_data.order_index,
  stage_data.color
FROM public.tenants t
CROSS JOIN (
  VALUES 
    ('Lead', 'Cliente em potencial identificado', 1, '#ef4444'),
    ('Qualificado', 'Cliente com necessidade confirmada', 2, '#f59e0b'),
    ('Proposta', 'Proposta de consórcio enviada', 3, '#3b82f6'),
    ('Negociação', 'Em processo de negociação', 4, '#8b5cf6'),
    ('Fechamento', 'Pronto para assinatura do contrato', 5, '#10b981'),
    ('Pós-venda', 'Cliente ativo - acompanhamento', 6, '#6b7280')
) AS stage_data(name, description, order_index, color);

-- Inserir templates de mensagem padrão
INSERT INTO public.message_templates (tenant_id, name, category, template_text, variables)
SELECT 
  t.id as tenant_id,
  template_data.name,
  template_data.category,
  template_data.template_text,
  template_data.variables::jsonb
FROM public.tenants t
CROSS JOIN (
  VALUES 
    ('Primeiro Contato', 'whatsapp', 'Olá {cliente_nome}! Obrigado pelo interesse em nossos consórcios. Sou {vendedor_nome} e vou ajudá-lo a encontrar a melhor opção. Quando podemos conversar?', '["cliente_nome", "vendedor_nome"]'),
    ('Proposta Enviada', 'whatsapp', 'Oi {cliente_nome}! Preparei uma simulação personalizada para você. Valor do bem: R$ {valor_bem}. Parcelas: {num_parcelas}x de R$ {valor_parcela}. Vamos conversar sobre os detalhes?', '["cliente_nome", "valor_bem", "num_parcelas", "valor_parcela"]'),
    ('Follow-up Proposta', 'whatsapp', 'Olá {cliente_nome}! Vi que não conseguimos finalizar nossa conversa sobre o consórcio. Alguma dúvida que posso esclarecer? Estou aqui para ajudar!', '["cliente_nome"]'),
    ('Pós-venda Check', 'whatsapp', 'Oi {cliente_nome}! Como está sua experiência com o consórcio? Se tiver alguma dúvida ou precisar de suporte, pode contar comigo!', '["cliente_nome"]')
) AS template_data(name, category, template_text, variables);
