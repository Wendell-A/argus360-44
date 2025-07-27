-- Corrigir a função accept_public_invitation
CREATE OR REPLACE FUNCTION accept_public_invitation(
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
  validation_result JSONB;
  link_record public.public_invitation_links%ROWTYPE;
  result JSONB;
BEGIN
  -- Validar token primeiro
  SELECT validate_public_invitation_token(p_token) INTO validation_result;

  -- Verificar se token é válido
  IF NOT (validation_result->>'valid')::BOOLEAN THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', validation_result->>'error'
    );
  END IF;

  -- Buscar dados do link diretamente da tabela
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

  -- Verificar se usuário já está no tenant
  IF EXISTS(SELECT 1 FROM public.tenant_users WHERE user_id = p_user_id AND tenant_id = link_record.tenant_id) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Usuário já faz parte desta organização'
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
  );

  -- Incrementar contador de usos
  UPDATE public.public_invitation_links
  SET current_uses = current_uses + 1,
      updated_at = now()
  WHERE id = link_record.id;

  RETURN jsonb_build_object(
    'success', true,
    'tenant_id', link_record.tenant_id,
    'role', link_record.role,
    'message', 'Cadastro realizado com sucesso'
  );
END;
$$;