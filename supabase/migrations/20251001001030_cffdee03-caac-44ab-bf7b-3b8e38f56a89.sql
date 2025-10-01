-- Corrigir função RPC get_user_profile_complete
-- Remove referência a position_id que não existe na tabela tenant_users

DROP FUNCTION IF EXISTS public.get_user_profile_complete(UUID);

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

  -- Verificar se o usuário existe
  IF user_email IS NULL THEN
    RETURN jsonb_build_object(
      'error', 'Usuário não encontrado'
    );
  END IF;

  -- Montar objeto JSON com dados completos (SEM position_id)
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
      'department_name', d.name
    )
  ) INTO result
  FROM public.profiles p
  LEFT JOIN public.tenant_users tu ON tu.user_id = p.id AND tu.active = true
  LEFT JOIN public.tenants t ON t.id = tu.tenant_id
  LEFT JOIN public.offices o ON o.id = tu.office_id AND o.active = true
  LEFT JOIN public.departments d ON d.id = tu.department_id
  WHERE p.id = user_uuid
  LIMIT 1;

  -- Retornar resultado ou objeto vazio se não encontrado
  RETURN COALESCE(result, jsonb_build_object(
    'profile', jsonb_build_object(
      'id', user_uuid,
      'email', user_email,
      'full_name', NULL,
      'avatar_url', NULL,
      'phone', NULL
    ),
    'organization', jsonb_build_object(
      'tenant_id', NULL,
      'tenant_name', NULL,
      'office_id', NULL,
      'office_name', NULL,
      'role', NULL,
      'department_id', NULL,
      'department_name', NULL
    )
  ));
END;
$$;

-- Conceder permissão de execução para usuários autenticados
GRANT EXECUTE ON FUNCTION public.get_user_profile_complete(UUID) TO authenticated;

COMMENT ON FUNCTION public.get_user_profile_complete(UUID) IS 'Retorna dados completos do perfil do usuário incluindo informações de organização. Corrigido para não incluir position_id.';