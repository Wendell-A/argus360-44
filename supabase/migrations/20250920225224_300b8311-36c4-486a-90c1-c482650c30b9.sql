-- Corrigir ambiguidade de referencia a session_token nas funções de autenticação de super admins
-- Data: 2025-09-20 22:55

-- 1) Atualizar authenticate_super_admin com variável distinta e colunas qualificadas
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
  v_session_token TEXT;
BEGIN
  SELECT * INTO admin_record
  FROM public.super_admins sa
  WHERE sa.email = p_email AND sa.is_active = true;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Credenciais inválidas'
    );
  END IF;

  -- Verificar senha usando chamada explícita
  IF admin_record.password_hash = extensions.crypt(p_password, admin_record.password_hash) THEN
    -- Gerar token de sessão
    v_session_token := public.generate_super_admin_token();
    
    -- Atualizar último login e token (colunas qualificadas e variável distinta)
    UPDATE public.super_admins sa
    SET last_login = now(),
        session_token = v_session_token,
        session_expires_at = now() + INTERVAL '8 hours'
    WHERE sa.id = admin_record.id;

    RETURN jsonb_build_object(
      'success', true,
      'token', v_session_token,
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

-- 2) Atualizar validate_super_admin_session com alias e colunas qualificadas
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
  FROM public.super_admins sa
  WHERE sa.session_token = p_token 
    AND sa.is_active = true
    AND sa.session_expires_at > now();

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Token inválido ou expirado'
    );
  END IF;

  -- Renovar sessão se ainda válida
  UPDATE public.super_admins sa
  SET session_expires_at = now() + INTERVAL '8 hours'
  WHERE sa.id = admin_record.id;

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