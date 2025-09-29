-- Criar tabela para configurações personalizadas do dashboard
CREATE TABLE public.dashboard_configurations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  user_id UUID,
  config_name VARCHAR(50) NOT NULL CHECK (config_name IN ('A', 'B', 'C')),
  is_default BOOLEAN DEFAULT false,
  widget_configs JSONB NOT NULL DEFAULT '{}',
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, config_name),
  CONSTRAINT max_3_configs_per_tenant CHECK (config_name IN ('A', 'B', 'C'))
);

-- Enable RLS
ALTER TABLE public.dashboard_configurations ENABLE ROW LEVEL SECURITY;

-- Política para visualização baseada no contexto
CREATE POLICY "Users can view dashboard configs in their tenants"
ON public.dashboard_configurations
FOR SELECT
USING (tenant_id = ANY(get_user_tenant_ids(auth.uid())));

-- Política para criação/edição (apenas admin/owner)
CREATE POLICY "Admins can manage dashboard configs"
ON public.dashboard_configurations
FOR ALL
USING (
  tenant_id = ANY(get_user_tenant_ids(auth.uid())) 
  AND get_user_role_in_tenant(auth.uid(), tenant_id) = ANY(ARRAY['owner'::user_role, 'admin'::user_role])
)
WITH CHECK (
  tenant_id = ANY(get_user_tenant_ids(auth.uid())) 
  AND get_user_role_in_tenant(auth.uid(), tenant_id) = ANY(ARRAY['owner'::user_role, 'admin'::user_role])
  AND created_by = auth.uid()
);

-- Trigger para updated_at
CREATE TRIGGER update_dashboard_configurations_updated_at
  BEFORE UPDATE ON public.dashboard_configurations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_support_tickets_updated_at();

-- Índices para performance
CREATE INDEX idx_dashboard_configurations_tenant_id ON public.dashboard_configurations(tenant_id);
CREATE INDEX idx_dashboard_configurations_tenant_config ON public.dashboard_configurations(tenant_id, config_name);