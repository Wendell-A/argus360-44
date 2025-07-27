-- Corrigir função accept_public_invitation para criar office_users corretamente
CREATE OR REPLACE FUNCTION public.accept_public_invitation(
  p_token VARCHAR, 
  p_user_id UUID, 
  p_email VARCHAR,
  p_full_name VARCHAR
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  link_record record;
  result jsonb;
BEGIN
  -- Buscar link válido
  SELECT * INTO link_record
  FROM public.public_invitation_links
  WHERE token = p_token
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > now())
    AND (max_uses IS NULL OR current_uses < max_uses);

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Link de convite inválido ou expirado'
    );
  END IF;

  -- Criar ou atualizar perfil
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (p_user_id, p_email, p_full_name)
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name;

  -- Criar associação tenant_user
  INSERT INTO public.tenant_users (
    user_id,
    tenant_id,
    role,
    office_id,
    department_id,
    team_id,
    active,
    joined_at
  ) VALUES (
    p_user_id,
    link_record.tenant_id,
    link_record.role,
    link_record.office_id,
    link_record.department_id,
    link_record.team_id,
    true,
    now()
  ) ON CONFLICT (user_id, tenant_id) DO UPDATE SET
    role = EXCLUDED.role,
    office_id = COALESCE(EXCLUDED.office_id, tenant_users.office_id),
    department_id = COALESCE(EXCLUDED.department_id, tenant_users.department_id),
    team_id = COALESCE(EXCLUDED.team_id, tenant_users.team_id),
    active = true,
    joined_at = now();

  -- Criar associação office_users SE office_id estiver presente
  IF link_record.office_id IS NOT NULL THEN
    INSERT INTO public.office_users (
      user_id,
      tenant_id,
      office_id,
      role,
      active
    ) VALUES (
      p_user_id,
      link_record.tenant_id,
      link_record.office_id,
      link_record.role,
      true
    ) ON CONFLICT (user_id, office_id, tenant_id) DO UPDATE SET
      role = EXCLUDED.role,
      active = true,
      updated_at = now();
  END IF;

  -- Incrementar contador de uso
  UPDATE public.public_invitation_links
  SET current_uses = current_uses + 1,
      updated_at = now()
  WHERE id = link_record.id;

  RETURN jsonb_build_object(
    'success', true,
    'tenant_id', link_record.tenant_id,
    'office_id', link_record.office_id,
    'role', link_record.role,
    'message', 'Convite aceito com sucesso'
  );
END;
$$;