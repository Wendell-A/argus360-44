-- Hotfix RLS/Login - Restore tenants in get_authenticated_user_data and remove non-existent columns
-- 23/09/2025 22:25 BRT

CREATE OR REPLACE FUNCTION public.get_authenticated_user_data()
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  current_user_id uuid := auth.uid();
  user_profile jsonb;
  tenants_list jsonb;
BEGIN
  IF current_user_id IS NULL THEN
    RETURN jsonb_build_object('authenticated', false);
  END IF;

  -- Buscar dados básicos do perfil (sem campos inexistentes)
  SELECT jsonb_build_object(
    'authenticated', true,
    'id', p.id,
    'email', p.email,
    'full_name', p.full_name,
    'avatar_url', p.avatar_url
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
$$;