
-- ETAPA 1.1: Adicionar novos campos à tabela consortium_products
ALTER TABLE public.consortium_products 
ADD COLUMN min_credit_value numeric,
ADD COLUMN max_credit_value numeric,
ADD COLUMN advance_fee_rate numeric DEFAULT 0,
ADD COLUMN min_admin_fee numeric,
ADD COLUMN max_admin_fee numeric,
ADD COLUMN reserve_fund_rate numeric DEFAULT 0,
ADD COLUMN embedded_bid_rate numeric DEFAULT 0,
ADD COLUMN adjustment_index varchar(50) DEFAULT 'INCC',
ADD COLUMN contemplation_modes jsonb DEFAULT '[]'::jsonb;

-- ETAPA 1.2: Criar tabela para gestão de pagamentos de comissão parcelados
CREATE TABLE public.commission_payment_schedules (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL,
  product_id uuid NOT NULL,
  installment_number integer NOT NULL,
  percentage numeric NOT NULL,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT fk_commission_schedule_product FOREIGN KEY (product_id) REFERENCES public.consortium_products(id) ON DELETE CASCADE,
  CONSTRAINT fk_commission_schedule_tenant FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE
);

-- ETAPA 1.3: Criar tabela para gestão de estornos por produto
CREATE TABLE public.product_chargeback_schedules (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL,
  product_id uuid NOT NULL,
  percentage numeric NOT NULL,
  max_payment_number integer NOT NULL,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT fk_chargeback_schedule_product FOREIGN KEY (product_id) REFERENCES public.consortium_products(id) ON DELETE CASCADE,
  CONSTRAINT fk_chargeback_schedule_tenant FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE
);

-- Adicionar RLS policies para commission_payment_schedules
ALTER TABLE public.commission_payment_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view commission schedules in their tenants" 
ON public.commission_payment_schedules 
FOR SELECT 
USING (tenant_id = ANY (get_user_tenant_ids(auth.uid())));

CREATE POLICY "Admins can manage commission schedules" 
ON public.commission_payment_schedules 
FOR ALL 
USING (get_user_role_in_tenant(auth.uid(), tenant_id) = ANY (ARRAY['owner'::user_role, 'admin'::user_role, 'manager'::user_role]));

-- Adicionar RLS policies para product_chargeback_schedules
ALTER TABLE public.product_chargeback_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view chargeback schedules in their tenants" 
ON public.product_chargeback_schedules 
FOR SELECT 
USING (tenant_id = ANY (get_user_tenant_ids(auth.uid())));

CREATE POLICY "Admins can manage chargeback schedules" 
ON public.product_chargeback_schedules 
FOR ALL 
USING (get_user_role_in_tenant(auth.uid(), tenant_id) = ANY (ARRAY['owner'::user_role, 'admin'::user_role, 'manager'::user_role]));

-- Adicionar triggers para updated_at
CREATE TRIGGER update_commission_payment_schedules_updated_at
  BEFORE UPDATE ON public.commission_payment_schedules
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_product_chargeback_schedules_updated_at
  BEFORE UPDATE ON public.product_chargeback_schedules
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
