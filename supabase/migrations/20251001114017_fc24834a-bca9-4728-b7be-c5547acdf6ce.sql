-- ============================================================================
-- CORREÇÃO COMPLEMENTAR: DEFINIR SECURITY INVOKER NAS VIEWS
-- ============================================================================
-- Data: 2025-10-01
-- Objetivo: Garantir que as views executem com privilégios do invocador (RLS aplicado)
-- Contexto: Linter ainda sinaliza SECURITY DEFINER nas views após recriação
-- Ação: ALTER VIEW ... SET (security_invoker = true)
-- ============================================================================

-- Ajusta proposals_with_client_info para SECURITY INVOKER
ALTER VIEW IF EXISTS public.proposals_with_client_info
  SET (security_invoker = true);

COMMENT ON VIEW public.proposals_with_client_info IS 
'View executa com privilégios do invocador (security_invoker=true); RLS das tabelas base é respeitada.';

-- Ajusta commission_details_view para SECURITY INVOKER
ALTER VIEW IF EXISTS public.commission_details_view
  SET (security_invoker = true);

COMMENT ON VIEW public.commission_details_view IS 
'View executa com privilégios do invocador (security_invoker=true); RLS das tabelas base é respeitada.';

-- ============================================================================
-- RESULTADO ESPERADO:
-- ✅ Linter deixa de reportar security_definer_view para ambas as views
-- ✅ Consultas passam a respeitar RLS do usuário autenticado
-- ============================================================================