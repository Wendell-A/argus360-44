-- Criar função RPC para buscar dados completos do perfil do usuário
CREATE OR REPLACE FUNCTION public.get_user_profile_complete(user_uuid UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSONB;
  user_email TEXT;
BEGIN
  -- Buscar email do auth.users
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = user_uuid;

  -- Montar objeto JSON com dados completos
  SELECT jsonb_build_object(
    'profile', jsonb_build_object(
      'id', p.id,
      'email', user_email,
      'full_name', p.full_name,
      'avatar_url', p.avatar_url,
      'phone', p.phone
    ),
    'organization', jsonb_build_object(
      'tenant_id', tu.tenant_id,
      'tenant_name', t.name,
      'office_id', tu.office_id,
      'office_name', o.name,
      'role', tu.role,
      'department_id', tu.department_id,
      'department_name', d.name,
      'position_id', tu.position_id,
      'position_name', pos.name
    )
  ) INTO result
  FROM public.profiles p
  LEFT JOIN public.tenant_users tu ON tu.user_id = p.id AND tu.active = true
  LEFT JOIN public.tenants t ON t.id = tu.tenant_id
  LEFT JOIN public.offices o ON o.id = tu.office_id
  LEFT JOIN public.departments d ON d.id = tu.department_id
  LEFT JOIN public.positions pos ON pos.id = tu.position_id
  WHERE p.id = user_uuid
  LIMIT 1;

  RETURN COALESCE(result, '{}'::jsonb);
END;
$$;

-- Conceder permissão de execução para usuários autenticados
GRANT EXECUTE ON FUNCTION public.get_user_profile_complete(UUID) TO authenticated;