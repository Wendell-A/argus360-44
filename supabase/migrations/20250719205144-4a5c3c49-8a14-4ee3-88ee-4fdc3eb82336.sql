
-- Criar tabela para comissões de vendedores por produto
CREATE TABLE public.seller_commissions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL,
  seller_id uuid NOT NULL,
  product_id uuid NOT NULL,
  commission_rate numeric(6,2) NOT NULL,
  min_sale_value numeric(12,2),
  max_sale_value numeric(12,2),
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT fk_seller_commissions_tenant FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE,
  CONSTRAINT fk_seller_commissions_product FOREIGN KEY (product_id) REFERENCES public.consortium_products(id) ON DELETE CASCADE,
  CONSTRAINT uk_seller_commissions_unique UNIQUE(tenant_id, seller_id, product_id)
);

-- Adicionar novos campos à tabela commissions para suportar hierarquia
ALTER TABLE public.commissions 
ADD COLUMN commission_type varchar(20) DEFAULT 'office',
ADD COLUMN parent_commission_id uuid,
ADD COLUMN installment_number integer DEFAULT 1,
ADD COLUMN total_installments integer DEFAULT 1,
ADD COLUMN installment_amount numeric(12,2),
ADD CONSTRAINT fk_commissions_parent FOREIGN KEY (parent_commission_id) REFERENCES public.commissions(id) ON DELETE CASCADE;

-- Adicionar comentários para documentação
COMMENT ON COLUMN public.commissions.commission_type IS 'Tipo de comissão: office (escritório) ou seller (vendedor)';
COMMENT ON COLUMN public.commissions.parent_commission_id IS 'ID da comissão pai (para comissões de vendedor)';
COMMENT ON COLUMN public.commissions.installment_number IS 'Número da parcela atual';
COMMENT ON COLUMN public.commissions.total_installments IS 'Total de parcelas da comissão';
COMMENT ON COLUMN public.commissions.installment_amount IS 'Valor da parcela individual';

-- Adicionar RLS policies para seller_commissions
ALTER TABLE public.seller_commissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view seller commissions in their tenants" 
ON public.seller_commissions 
FOR SELECT 
USING (tenant_id = ANY (get_user_tenant_ids(auth.uid())));

CREATE POLICY "Admins can manage seller commissions" 
ON public.seller_commissions 
FOR ALL 
USING (get_user_role_in_tenant(auth.uid(), tenant_id) = ANY (ARRAY['owner'::user_role, 'admin'::user_role, 'manager'::user_role]));

-- Adicionar trigger para updated_at
CREATE TRIGGER update_seller_commissions_updated_at
  BEFORE UPDATE ON public.seller_commissions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Atualizar função de criação automática de comissões
CREATE OR REPLACE FUNCTION public.create_automatic_commissions()
RETURNS TRIGGER AS $$
DECLARE
  schedule_record RECORD;
  seller_commission_rate NUMERIC;
  office_commission_amount NUMERIC;
  seller_commission_amount NUMERIC;
  installment_due_date DATE;
BEGIN
  -- Só criar comissões quando a venda for aprovada
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    
    -- Primeiro, criar comissões do escritório baseadas no cronograma do produto
    FOR schedule_record IN 
      SELECT * FROM public.commission_payment_schedules 
      WHERE product_id = NEW.product_id 
      ORDER BY installment_number
    LOOP
      -- Calcular data de vencimento baseada no número da parcela
      installment_due_date := COALESCE(NEW.approval_date, CURRENT_DATE) + (schedule_record.installment_number * INTERVAL '30 days');
      
      -- Calcular valor da comissão do escritório para esta parcela
      office_commission_amount := NEW.sale_value * (schedule_record.percentage / 100);
      
      -- Inserir comissão do escritório
      INSERT INTO public.commissions (
        tenant_id,
        sale_id,
        recipient_id,
        recipient_type,
        commission_type,
        base_amount,
        commission_rate,
        commission_amount,
        installment_number,
        total_installments,
        installment_amount,
        due_date,
        status
      ) VALUES (
        NEW.tenant_id,
        NEW.id,
        NEW.office_id, -- Comissão vai para o escritório
        'office',
        'office',
        NEW.sale_value,
        schedule_record.percentage,
        office_commission_amount,
        schedule_record.installment_number,
        (SELECT COUNT(*) FROM public.commission_payment_schedules WHERE product_id = NEW.product_id),
        office_commission_amount,
        installment_due_date,
        'pending'
      );
    END LOOP;

    -- Se não houver cronograma, criar comissão única do escritório
    IF NOT EXISTS (SELECT 1 FROM public.commission_payment_schedules WHERE product_id = NEW.product_id) THEN
      INSERT INTO public.commissions (
        tenant_id,
        sale_id,
        recipient_id,
        recipient_type,
        commission_type,
        base_amount,
        commission_rate,
        commission_amount,
        due_date,
        status
      ) VALUES (
        NEW.tenant_id,
        NEW.id,
        NEW.office_id,
        'office',
        'office',
        NEW.sale_value,
        NEW.commission_rate,
        NEW.commission_amount,
        COALESCE(NEW.approval_date, CURRENT_DATE) + INTERVAL '30 days',
        'pending'
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Função para criar comissões de vendedor quando comissão do escritório for aprovada
CREATE OR REPLACE FUNCTION public.create_seller_commission_on_office_approval()
RETURNS TRIGGER AS $$
DECLARE
  seller_rate NUMERIC;
  seller_amount NUMERIC;
  sale_seller_id UUID;
BEGIN
  -- Só processar quando comissão do escritório for aprovada
  IF NEW.status = 'approved' AND NEW.commission_type = 'office' AND 
     (OLD.status IS NULL OR OLD.status != 'approved') THEN
    
    -- Buscar o vendedor da venda
    SELECT seller_id INTO sale_seller_id 
    FROM public.sales 
    WHERE id = NEW.sale_id;
    
    -- Buscar taxa de comissão do vendedor para este produto
    SELECT commission_rate INTO seller_rate
    FROM public.seller_commissions
    WHERE tenant_id = NEW.tenant_id 
      AND seller_id = sale_seller_id
      AND product_id = (SELECT product_id FROM public.sales WHERE id = NEW.sale_id)
      AND is_active = true;
    
    -- Se encontrou configuração, criar comissão do vendedor
    IF seller_rate IS NOT NULL THEN
      seller_amount := NEW.commission_amount * (seller_rate / 100);
      
      INSERT INTO public.commissions (
        tenant_id,
        sale_id,
        recipient_id,
        recipient_type,
        commission_type,
        parent_commission_id,
        base_amount,
        commission_rate,
        commission_amount,
        installment_number,
        total_installments,
        installment_amount,
        due_date,
        status
      ) VALUES (
        NEW.tenant_id,
        NEW.sale_id,
        sale_seller_id,
        'seller',
        'seller',
        NEW.id,
        NEW.commission_amount, -- Base é a comissão do escritório
        seller_rate,
        seller_amount,
        NEW.installment_number,
        NEW.total_installments,
        seller_amount,
        NEW.due_date,
        'pending'
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para gerar comissões de vendedor
CREATE TRIGGER trigger_create_seller_commissions
  AFTER UPDATE ON public.commissions
  FOR EACH ROW
  EXECUTE FUNCTION public.create_seller_commission_on_office_approval();
