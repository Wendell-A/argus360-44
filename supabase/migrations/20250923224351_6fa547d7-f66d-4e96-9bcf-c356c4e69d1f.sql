-- Correção Crítica: Remover Security Definer View
-- 23/09/2025 22:50 BRT
-- OBJETIVO: Resolver alerta ERROR "Security Definer View"

-- Remover a view problemática que causou o alerta de segurança
DROP VIEW IF EXISTS public.clients_secure;

-- Remover a função trigger não utilizada
DROP FUNCTION IF EXISTS public.audit_client_access();

-- Log da correção
INSERT INTO public.audit_log (
  tenant_id,
  user_id,
  table_name,
  action,
  new_values
) VALUES (
  NULL,
  auth.uid(),
  'security_view_fix',
  'SECURITY_DEFINER_VIEW_REMOVED',
  jsonb_build_object(
    'removed_items', ARRAY['clients_secure_view', 'audit_client_access_trigger'],
    'security_level', 'ERROR_FIXED',
    'timestamp', now(),
    'stage', 'ETAPA_2_CORRECAO'
  )
) ON CONFLICT DO NOTHING;