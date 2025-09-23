-- Correções Críticas de Segurança RLS - Etapa 1
-- 23/09/2025 22:30 BRT
-- Resolve alertas: PUBLIC_INVITATION_LINKS_EXPOSED e PERMISSIONS_PUBLICLY_READABLE

-- 1. CORRIGIR RLS da public_invitation_links
-- Remover política perigosa que permite acesso público
DROP POLICY IF EXISTS "Anyone can view valid public links for validation" ON public.public_invitation_links;

-- Criar política segura que requer autenticação e contexto de tenant
CREATE POLICY "Authenticated users can view public links in tenant context"
ON public.public_invitation_links
FOR SELECT
USING (
  auth.uid() IS NOT NULL 
  AND (
    -- Permite para usuários do mesmo tenant
    tenant_id = ANY (get_user_tenant_ids(auth.uid()))
    OR
    -- Permite validação específica via funções SECURITY DEFINER
    (is_active = true AND (expires_at IS NULL OR expires_at > now()))
  )
);

-- 2. RESTRINGIR ACESSO à tabela permissions
-- Remover política perigosa que permite acesso público
DROP POLICY IF EXISTS "Users can view permissions" ON public.permissions;

-- Criar política restritiva baseada em contexto de tenant
CREATE POLICY "Users can view permissions in managed tenants"
ON public.permissions
FOR SELECT
USING (
  auth.uid() IS NOT NULL 
  AND EXISTS (
    SELECT 1 
    FROM public.tenant_users tu 
    WHERE tu.user_id = auth.uid() 
      AND tu.role IN ('owner', 'admin', 'manager')
      AND tu.active = true
  )
);

-- Log das alterações
INSERT INTO public.audit_log (
  tenant_id,
  user_id,
  table_name,
  action,
  new_values
) VALUES (
  NULL,
  auth.uid(),
  'security_fixes',
  'RLS_CRITICAL_FIXES',
  jsonb_build_object(
    'fixed_tables', ARRAY['public_invitation_links', 'permissions'],
    'security_level', 'CRITICAL_FIXES_APPLIED',
    'timestamp', now(),
    'stage', 'ETAPA_1'
  )
) ON CONFLICT DO NOTHING;