
-- Criar trigger para gerar comissões automaticamente quando uma venda for aprovada
CREATE OR REPLACE FUNCTION create_automatic_commissions()
RETURNS TRIGGER AS $$
BEGIN
  -- Só criar comissões quando a venda for aprovada
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    -- Comissão do vendedor
    INSERT INTO public.commissions (
      tenant_id,
      sale_id,
      recipient_id,
      recipient_type,
      base_amount,
      commission_rate,
      commission_amount,
      due_date,
      status
    ) VALUES (
      NEW.tenant_id,
      NEW.id,
      NEW.seller_id,
      'seller',
      NEW.sale_value,
      NEW.commission_rate,
      NEW.commission_amount,
      COALESCE(NEW.approval_date, CURRENT_DATE) + INTERVAL '30 days',
      'pending'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar o trigger
DROP TRIGGER IF EXISTS trigger_create_commissions ON public.sales;
CREATE TRIGGER trigger_create_commissions
  AFTER UPDATE ON public.sales
  FOR EACH ROW
  EXECUTE FUNCTION create_automatic_commissions();
