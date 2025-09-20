-- Corrigir função de autenticação com nome correto da coluna
CREATE OR REPLACE FUNCTION public.authenticate_super_admin(
  p_email VARCHAR,
  p_password VARCHAR
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  admin_record public.super_admins%ROWTYPE;
  session_token TEXT;
BEGIN
  SELECT * INTO admin_record
  FROM public.super_admins
  WHERE email = p_email AND is_active = true;  -- Corrigido: is_active em vez de active

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Credenciais inválidas'
    );
  END IF;

  -- Verificar senha usando chamada explícita
  IF admin_record.password_hash = extensions.crypt(p_password, admin_record.password_hash) THEN
    -- Gerar token de sessão
    session_token := public.generate_super_admin_token();
    
    -- Atualizar último login e token
    UPDATE public.super_admins 
    SET last_login = now(),
        session_token = session_token,
        session_expires_at = now() + INTERVAL '8 hours'
    WHERE id = admin_record.id;

    RETURN jsonb_build_object(
      'success', true,
      'token', session_token,
      'admin', jsonb_build_object(
        'id', admin_record.id,
        'email', admin_record.email,
        'full_name', admin_record.full_name,
        'created_at', admin_record.created_at
      )
    );
  ELSE
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Credenciais inválidas'
    );
  END IF;
END;
$$;

-- Também corrigir a função de validação de sessão
CREATE OR REPLACE FUNCTION public.validate_super_admin_session(p_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  admin_record public.super_admins%ROWTYPE;
BEGIN
  SELECT * INTO admin_record
  FROM public.super_admins
  WHERE session_token = p_token 
    AND is_active = true  -- Corrigido: is_active em vez de active
    AND session_expires_at > now();

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Token inválido ou expirado'
    );
  END IF;

  -- Renovar sessão se ainda válida
  UPDATE public.super_admins 
  SET session_expires_at = now() + INTERVAL '8 hours'
  WHERE id = admin_record.id;

  RETURN jsonb_build_object(
    'success', true,
    'admin', jsonb_build_object(
      'id', admin_record.id,
      'email', admin_record.email,
      'full_name', admin_record.full_name,
      'created_at', admin_record.created_at
    )
  );
END;
$$;