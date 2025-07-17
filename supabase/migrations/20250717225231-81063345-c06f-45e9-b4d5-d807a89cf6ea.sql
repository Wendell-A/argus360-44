
-- Corrigir precisão das colunas numéricas na tabela consortium_products
-- Alterando de NUMERIC(5,4) para NUMERIC(6,2) para permitir valores percentuais realistas

ALTER TABLE public.consortium_products 
ALTER COLUMN administration_fee TYPE NUMERIC(6,2),
ALTER COLUMN commission_rate TYPE NUMERIC(6,2);

-- Verificar e ajustar outras colunas numéricas se necessário
ALTER TABLE public.consortium_products 
ALTER COLUMN advance_fee_rate TYPE NUMERIC(6,2),
ALTER COLUMN reserve_fund_rate TYPE NUMERIC(6,2),
ALTER COLUMN embedded_bid_rate TYPE NUMERIC(6,2);

-- Verificar colunas de valores monetários
ALTER TABLE public.consortium_products 
ALTER COLUMN min_admin_fee TYPE NUMERIC(12,2),
ALTER COLUMN max_admin_fee TYPE NUMERIC(12,2),
ALTER COLUMN min_credit_value TYPE NUMERIC(12,2),
ALTER COLUMN max_credit_value TYPE NUMERIC(12,2),
ALTER COLUMN min_down_payment TYPE NUMERIC(12,2);
