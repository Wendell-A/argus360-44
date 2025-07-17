
-- Criar tabela para configurações de simulação
CREATE TABLE public.simulation_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  setting_type varchar NOT NULL, -- 'interest_rates', 'consortium_config', etc
  setting_key varchar NOT NULL,
  setting_value jsonb NOT NULL DEFAULT '{}',
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  UNIQUE(tenant_id, setting_type, setting_key)
);

-- Habilitar RLS
ALTER TABLE public.simulation_settings ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view simulation settings in their tenants" 
  ON public.simulation_settings 
  FOR SELECT 
  USING (tenant_id = ANY (get_user_tenant_ids(auth.uid())));

CREATE POLICY "Admins can manage simulation settings" 
  ON public.simulation_settings 
  FOR ALL 
  USING (get_user_role_in_tenant(auth.uid(), tenant_id) = ANY (ARRAY['owner'::user_role, 'admin'::user_role, 'manager'::user_role]));

-- Inserir configurações padrão de taxas de juros (exemplo para um tenant)
-- Estas serão inseridas via código quando necessário

-- Trigger para updated_at
CREATE TRIGGER simulation_settings_updated_at
    BEFORE UPDATE ON public.simulation_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
