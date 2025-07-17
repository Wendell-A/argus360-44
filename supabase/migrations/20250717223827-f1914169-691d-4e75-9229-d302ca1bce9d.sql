
-- ETAPA 1: Remover colunas obsoletas da tabela consortium_products
ALTER TABLE public.consortium_products 
DROP COLUMN IF EXISTS asset_value,
DROP COLUMN IF EXISTS monthly_fee;
