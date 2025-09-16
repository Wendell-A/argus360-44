-- Garantir que a extensão pgcrypto esteja instalada
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Atualizar função: authenticate_super_admin para incluir o schema 'extensions' no search_path
CREATE OR REPLACE FUNCTION public.authenticate_super_admin(p_email character varying, p_password character varying)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public, extensions'
AS $function$
DECLARE
  admin_record public.super_admins%ROWTYPE;
  session_token varchar;
  result jsonb;
BEGIN
  -- Find active super admin
  SELECT * INTO admin_record
  FROM public.super_admins
  WHERE email = p_email
    AND is_active = true;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Credenciais inválidas'
    );
  END IF;

  -- Verify password using pgcrypto's crypt
  IF admin_record.password_hash != crypt(p_password, admin_record.password_hash) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Credenciais inválidas'
    );
  END IF;

  -- Generate session token (pgcrypto gen_random_bytes)
  session_token := encode(gen_random_bytes(32), 'base64');

  -- Create session
  INSERT INTO public.super_admin_sessions (
    super_admin_id,
    token_hash,
    expires_at,
    ip_address,
    user_agent
  ) VALUES (
    admin_record.id,
    crypt(session_token, gen_salt('bf')),
    now() + INTERVAL '8 hours',
    inet_client_addr(),
    current_setting('request.headers', true)::json->>'user-agent'
  );

  -- Update last login
  UPDATE public.super_admins
  SET last_login = now()
  WHERE id = admin_record.id;

  RETURN jsonb_build_object(
    'success', true,
    'token', session_token,
    'admin', jsonb_build_object(
      'id', admin_record.id,
      'email', admin_record.email,
      'full_name', admin_record.full_name
    )
  );
END;
$function$;

-- Atualizar função: validate_super_admin_session para incluir o schema 'extensions' no search_path
CREATE OR REPLACE FUNCTION public.validate_super_admin_session(p_token character varying)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public, extensions'
AS $function$
DECLARE
  session_record record;
  admin_record public.super_admins%ROWTYPE;
BEGIN
  -- Find valid session
  SELECT s.*, sa.*
  INTO session_record
  FROM public.super_admin_sessions s
  JOIN public.super_admins sa ON sa.id = s.super_admin_id
  WHERE s.token_hash = crypt(p_token, s.token_hash)
    AND s.expires_at > now()
    AND sa.is_active = true;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Sessão inválida ou expirada'
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'admin', jsonb_build_object(
      'id', session_record.id,
      'email', session_record.email,
      'full_name', session_record.full_name
    )
  );
END;
$function$;

-- Atualizar função: create_super_admin para incluir o schema 'extensions' no search_path
CREATE OR REPLACE FUNCTION public.create_super_admin(p_email character varying, p_password character varying, p_full_name character varying)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public, extensions'
AS $function$
DECLARE 
  result jsonb;
BEGIN
  -- Verificar se email já existe
  IF EXISTS (SELECT 1 FROM public.super_admins WHERE email = p_email) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Email já está em uso'
    );
  END IF;

  -- Inserir novo super admin com hash seguro
  INSERT INTO public.super_admins (
    email, 
    password_hash, 
    full_name
  ) VALUES (
    p_email,
    crypt(p_password, gen_salt('bf')),
    p_full_name
  );

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Super administrador criado com sucesso'
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$function$;