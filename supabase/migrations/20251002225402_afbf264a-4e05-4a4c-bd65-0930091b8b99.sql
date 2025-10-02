-- ============================================
-- VIEWS MASCARADAS PARA PROFILES (VENDEDORES)
-- Data: 02/10/2025
-- ============================================

-- Criar view mascarada para profiles (vendedores/usuários)
CREATE OR REPLACE VIEW public.profiles_masked AS
SELECT 
  p.id,
  p.full_name,
  -- Mascarar email se não for o próprio usuário ou se não tiver permissão completa
  CASE 
    WHEN p.id = auth.uid() THEN p.email
    WHEN EXISTS (
      SELECT 1 FROM public.tenant_users tu
      WHERE tu.user_id = auth.uid() 
        AND tu.role IN ('owner', 'admin')
        AND tu.active = true
    ) THEN p.email
    ELSE public.mask_email(p.email)
  END as email,
  -- Mascarar telefone
  CASE 
    WHEN p.id = auth.uid() THEN p.phone
    WHEN EXISTS (
      SELECT 1 FROM public.tenant_users tu
      WHERE tu.user_id = auth.uid() 
        AND tu.role IN ('owner', 'admin')
        AND tu.active = true
    ) THEN p.phone
    ELSE public.mask_phone(p.phone)
  END as phone,
  p.avatar_url,
  p.position,
  p.department,
  p.position_id,
  p.department_id,
  p.hierarchical_level,
  p.hire_date,
  p.settings,
  p.created_at,
  p.updated_at,
  -- Flag indicando se dados estão mascarados
  CASE 
    WHEN p.id = auth.uid() THEN false
    WHEN EXISTS (
      SELECT 1 FROM public.tenant_users tu
      WHERE tu.user_id = auth.uid() 
        AND tu.role IN ('owner', 'admin')
        AND tu.active = true
    ) THEN false
    ELSE true
  END as data_masked
FROM public.profiles p;

COMMENT ON VIEW public.profiles_masked IS 
'View mascarada de perfis - aplica mascaramento de email e telefone baseado em permissões.
- Próprio usuário: dados completos
- Owner/Admin: dados completos
- Outros: dados mascarados';

-- Criar view mascarada para tenant_users com informações de perfil
CREATE OR REPLACE VIEW public.tenant_users_masked AS
SELECT 
  tu.id,
  tu.user_id,
  tu.tenant_id,
  tu.role,
  tu.office_id,
  tu.department_id,
  tu.team_id,
  tu.active,
  tu.joined_at,
  tu.created_at,
  tu.updated_at,
  pm.full_name,
  pm.email,
  pm.phone,
  pm.avatar_url,
  pm.data_masked
FROM public.tenant_users tu
LEFT JOIN public.profiles_masked pm ON pm.id = tu.user_id;

COMMENT ON VIEW public.tenant_users_masked IS 
'View que combina tenant_users com profiles_masked, fornecendo dados de usuários com mascaramento apropriado';