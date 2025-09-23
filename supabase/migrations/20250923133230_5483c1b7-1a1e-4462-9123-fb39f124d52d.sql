-- Permitir seller_id nulo para comissões padrão por produto
ALTER TABLE seller_commissions 
ALTER COLUMN seller_id DROP NOT NULL;

-- Adicionar campo para indicar se é comissão padrão
ALTER TABLE seller_commissions 
ADD COLUMN is_default_rate BOOLEAN DEFAULT false;

-- Adicionar índice único para evitar múltiplas comissões padrão por produto
CREATE UNIQUE INDEX idx_unique_default_commission_per_product 
ON seller_commissions (tenant_id, product_id) 
WHERE seller_id IS NULL AND is_default_rate = true;

-- Adicionar índice único para evitar múltiplas comissões específicas por vendedor/produto
CREATE UNIQUE INDEX idx_unique_seller_commission_per_product 
ON seller_commissions (tenant_id, seller_id, product_id) 
WHERE seller_id IS NOT NULL;

-- Adicionar comentários para documentação
COMMENT ON COLUMN seller_commissions.seller_id IS 'ID do vendedor. NULL para comissões padrão por produto';
COMMENT ON COLUMN seller_commissions.is_default_rate IS 'Indica se esta é uma comissão padrão para o produto (sem vendedor específico)';

-- Atualizar função de validação para considerar comissões padrão
CREATE OR REPLACE FUNCTION validate_commission_hierarchy()
RETURNS TRIGGER AS $$
BEGIN
  -- Se é uma comissão específica de vendedor, desativar a comissão padrão do mesmo produto
  IF NEW.seller_id IS NOT NULL AND NEW.is_active = true THEN
    UPDATE seller_commissions 
    SET is_active = false 
    WHERE tenant_id = NEW.tenant_id 
      AND product_id = NEW.product_id 
      AND seller_id IS NULL 
      AND is_default_rate = true
      AND is_active = true;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para validação automática
CREATE TRIGGER trigger_validate_commission_hierarchy
    AFTER INSERT OR UPDATE ON seller_commissions
    FOR EACH ROW
    EXECUTE FUNCTION validate_commission_hierarchy();