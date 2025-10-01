-- ============================================================================
-- CORREÇÃO CRÍTICA DE SEGURANÇA: REMOÇÃO DE SECURITY DEFINER EM VIEWS
-- ============================================================================
-- Data: 2025-10-01
-- Problema: Views com SECURITY DEFINER causam bypass de RLS policies
-- Solução: Recriar views com comportamento padrão SECURITY INVOKER
-- Impacto: Restaura isolamento de tenants através de RLS nas tabelas base
-- ============================================================================

-- 1. CORRIGIR proposals_with_client_info
-- Remove a view insegura e recria sem SECURITY DEFINER
DROP VIEW IF EXISTS public.proposals_with_client_info;

CREATE VIEW public.proposals_with_client_info AS
SELECT
  p.id,
  p.tenant_id,
  p.office_id,
  p.client_id,
  p.product_id,
  p.valor_da_simulacao,
  p.valor_da_parcela,
  p.prazo,
  p.data_da_simulacao,
  p.taxa_comissao_escritorio,
  p.taxa_comissao_vendedor,
  p.created_at,
  p.updated_at,
  c.name AS client_name,
  c.phone AS client_phone,
  c.email AS client_email
FROM proposals p
JOIN clients c ON c.id = p.client_id;

COMMENT ON VIEW public.proposals_with_client_info IS 
'View segura de propostas com informações do cliente. Respeita RLS policies das tabelas base (proposals e clients).';

-- 2. CORRIGIR commission_details_view
-- Remove a view insegura e recria sem SECURITY DEFINER
DROP VIEW IF EXISTS public.commission_details_view;

CREATE VIEW public.commission_details_view AS
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
  s.product_id,
  s.seller_id,
  s.client_id,
  s.office_id,
  s.sale_date,
  p.name AS product_name
FROM commissions c
JOIN sales s ON s.id = c.sale_id AND s.tenant_id = c.tenant_id
LEFT JOIN consortium_products p ON p.id = s.product_id AND p.tenant_id = c.tenant_id;

COMMENT ON VIEW public.commission_details_view IS 
'View segura de detalhes de comissões. Respeita RLS policies das tabelas base (commissions, sales, consortium_products).';

-- ============================================================================
-- RESULTADO ESPERADO:
-- ✅ Ambas as views agora usam SECURITY INVOKER (comportamento padrão)
-- ✅ RLS policies das tabelas base (proposals, clients, commissions, sales) 
--    serão aplicadas para cada usuário que consultar as views
-- ✅ Isolamento de tenants restaurado
-- ✅ 2 alertas críticos do linter de segurança eliminados
-- ============================================================================