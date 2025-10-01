-- LGPD: Adicionar campos de consentimento à tabela profiles
-- Data: 2025-10-01
-- Objetivo: Registrar aceitação dos Termos de Uso e Política de Privacidade

-- Tarefa 1: Adicionar colunas de consentimento LGPD
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS lgpd_accepted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS lgpd_version_accepted TEXT;

-- Adicionar índice para consultas de verificação de consentimento
CREATE INDEX IF NOT EXISTS idx_profiles_lgpd_accepted 
ON public.profiles(lgpd_accepted_at) 
WHERE lgpd_accepted_at IS NULL;

-- Comentários de documentação
COMMENT ON COLUMN public.profiles.lgpd_accepted_at IS 
'Data e hora em que o usuário aceitou os Termos de Uso e Política de Privacidade';
COMMENT ON COLUMN public.profiles.lgpd_version_accepted IS 
'Versão dos termos aceitos pelo usuário (ex: 1.0.0)';

-- Tarefa 2: Criar RPC para salvar consentimento
CREATE OR REPLACE FUNCTION public.accept_lgpd_terms(terms_version TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validar se usuário está autenticado
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  -- Atualizar perfil com dados do consentimento
  UPDATE public.profiles
  SET 
    lgpd_accepted_at = now(),
    lgpd_version_accepted = terms_version,
    updated_at = now()
  WHERE id = auth.uid();

  -- Verificar se update foi bem-sucedido
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Perfil do usuário não encontrado';
  END IF;

  RETURN TRUE;
END;
$$;

COMMENT ON FUNCTION public.accept_lgpd_terms(TEXT) IS 
'Registra o consentimento do usuário aos Termos de Uso e Política de Privacidade';

-- Tarefa 3: Atualizar função get_authenticated_user_data para incluir campos LGPD
CREATE OR REPLACE FUNCTION public.get_authenticated_user_data()
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  current_user_id uuid := auth.uid();
  user_profile jsonb;
  tenants_list jsonb;
BEGIN
  IF current_user_id IS NULL THEN
    RETURN jsonb_build_object('authenticated', false);
  END IF;

  -- Buscar dados básicos do perfil (INCLUINDO campos LGPD)
  SELECT jsonb_build_object(
    'authenticated', true,
    'id', p.id,
    'email', p.email,
    'full_name', p.full_name,
    'avatar_url', p.avatar_url,
    'lgpd_accepted_at', p.lgpd_accepted_at,
    'lgpd_version_accepted', p.lgpd_version_accepted
  )
  INTO user_profile
  FROM public.profiles p
  WHERE p.id = current_user_id;

  -- Montar lista de tenants do usuário (apenas onde está ativo)
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'tenant_id', t.id,
        'tenant_name', t.name,
        'tenant_slug', t.slug,
        'tenant_status', t.status,
        'user_role', tu.role,
        'active', tu.active
      )
      ORDER BY t.created_at DESC
    ), '[]'::jsonb
  )
  INTO tenants_list
  FROM public.tenant_users tu
  JOIN public.tenants t ON t.id = tu.tenant_id
  WHERE tu.user_id = current_user_id
    AND tu.active = true;

  IF user_profile IS NULL THEN
    user_profile := jsonb_build_object('authenticated', true, 'id', current_user_id);
  END IF;

  RETURN user_profile || jsonb_build_object('tenants', tenants_list);
END;
$function$;