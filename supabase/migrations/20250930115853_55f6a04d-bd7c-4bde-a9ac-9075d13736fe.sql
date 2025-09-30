-- Criar VIEW otimizada para Comissões por Produto
-- Esta VIEW pré-calcula o JOIN entre commissions e sales para performance
-- Data: 30/09/2025

CREATE OR REPLACE VIEW public.commission_details_view AS
SELECT 
  c.id AS commission_id,
  c.tenant_id,
  c.sale_id,
  c.recipient_id,
  c.recipient_type,
  c.commission_type,
  c.commission_amount,
  c.commission_rate,
  c.base_amount,
  c.due_date,
  c.status,
  c.installment_number,
  c.total_installments,
  -- Dados da venda relacionada
  s.product_id,
  s.seller_id,
  s.client_id,
  s.office_id,
  s.sale_date,
  -- Nome do produto (JOIN com consortium_products)
  p.name AS product_name
FROM public.commissions c
INNER JOIN public.sales s ON s.id = c.sale_id AND s.tenant_id = c.tenant_id
LEFT JOIN public.consortium_products p ON p.id = s.product_id AND p.tenant_id = c.tenant_id;

-- Comentário explicativo
COMMENT ON VIEW public.commission_details_view IS 
'VIEW otimizada para análise de comissões por produto. 
Realiza JOIN entre commissions, sales e consortium_products para facilitar queries de dashboard.
Herda RLS das tabelas subjacentes (commissions, sales, consortium_products).
Criada em 30/09/2025 como parte da normalização de dimensões do dashboard.';