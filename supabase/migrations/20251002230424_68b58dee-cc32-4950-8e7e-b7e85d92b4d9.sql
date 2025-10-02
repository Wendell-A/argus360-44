-- CORREÇÃO CRÍTICA: Mascaramento obrigatório em listagens (v2)
-- Data: 02/10/2025
-- Problema: clients_masked estava mostrando dados completos para owners/admins
-- Solução: Aplicar mascaramento SEMPRE nas views de listagem

-- 1. Recriar clients_masked com mascaramento obrigatório
DROP VIEW IF EXISTS public.clients_masked CASCADE;

CREATE VIEW public.clients_masked 
WITH (security_invoker = true)
AS
SELECT 
  c.id,
  c.tenant_id,
  c.office_id,
  c.responsible_user_id,
  c.name, -- Nome NÃO é mascarado conforme especificação
  c.type,
  c.classification,
  c.status,
  c.source,
  c.occupation,
  c.birth_date,
  c.monthly_income,
  c.address,
  c.notes,
  c.settings,
  c.created_at,
  c.updated_at,
  
  -- SEMPRE MASCARAR dados sensíveis em listagens (LGPD)
  public.mask_document(c.document) as document,
  public.mask_email(c.email) as email,
  public.mask_phone(c.phone) as phone,
  public.mask_phone(c.secondary_phone) as secondary_phone,
  
  -- Flag indicando que dados estão mascarados
  true as data_masked
  
FROM public.clients c;

COMMENT ON VIEW public.clients_masked IS 
'View com dados de clientes SEMPRE mascarados para listagens (LGPD compliant). 
Dados completos só devem ser acessados via tabela clients diretamente em contextos específicos (edição).';

-- 2. Recriar profiles_masked com mascaramento obrigatório
DROP VIEW IF EXISTS public.profiles_masked CASCADE;

CREATE VIEW public.profiles_masked AS
SELECT 
  p.id,
  p.full_name,
  
  -- SEMPRE MASCARAR email e telefone em listagens
  public.mask_email(p.email) as email,
  public.mask_phone(p.phone) as phone,
  
  p.avatar_url,
  p.position,
  p.department,
  p.position_id,
  p.department_id,
  p.hire_date,
  p.hierarchical_level,
  p.created_at,
  p.updated_at,
  
  -- Flag indicando mascaramento
  true as data_masked
  
FROM public.profiles p;

COMMENT ON VIEW public.profiles_masked IS 
'View com dados de perfis SEMPRE mascarados para listagens (LGPD compliant).';

-- 3. Recriar tenant_users_masked sem duplicação de colunas
DROP VIEW IF EXISTS public.tenant_users_masked CASCADE;

CREATE VIEW public.tenant_users_masked AS
SELECT 
  tu.id,
  tu.tenant_id,
  tu.user_id,
  tu.role,
  tu.office_id,
  tu.department_id,
  tu.team_id,
  tu.profile_id,
  tu.active,
  tu.context_level,
  tu.permissions,
  tu.invited_at,
  tu.joined_at,
  tu.created_at,
  tu.updated_at,
  
  -- Dados mascarados do profile (sem duplicar colunas do tenant_users)
  pm.full_name,
  pm.email,
  pm.phone,
  pm.avatar_url,
  pm.position,
  pm.department,
  pm.position_id as profile_position_id,
  pm.hire_date,
  pm.hierarchical_level,
  pm.data_masked

FROM public.tenant_users tu
LEFT JOIN public.profiles_masked pm ON pm.id = tu.user_id;

COMMENT ON VIEW public.tenant_users_masked IS 
'View combinando tenant_users com profiles mascarados para listagens seguras.';