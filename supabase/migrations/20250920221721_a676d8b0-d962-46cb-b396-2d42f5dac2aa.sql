-- Verificar se a extensão pgcrypto está instalada e acessível
SELECT * FROM pg_extension WHERE extname = 'pgcrypto';

-- Verificar se as funções crypt e gen_salt estão disponíveis
SELECT proname, pronamespace::regnamespace as schema 
FROM pg_proc 
WHERE proname IN ('crypt', 'gen_salt');

-- Recriar a função create_super_admin com chamadas explícitas para o schema extensions
DROP FUNCTION IF EXISTS public.create_super_admin(character varying, character varying, character varying);

CREATE OR REPLACE FUNCTION public.create_super_admin(
  p_email character varying, 
  p_password character varying, 
  p_full_name character varying
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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

  -- Inserir novo super admin com hash seguro usando chamadas explícitas
  INSERT INTO public.super_admins (
    email, 
    password_hash, 
    full_name
  ) VALUES (
    p_email,
    extensions.crypt(p_password, extensions.gen_salt('bf')),
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

-- Também atualizar a função de autenticação para usar chamadas explícitas
DROP FUNCTION IF EXISTS public.authenticate_super_admin(character varying, character varying);

CREATE OR REPLACE FUNCTION public.authenticate_super_admin(
  p_email character varying, 
  p_password character varying
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  admin_record public.super_admins%ROWTYPE;
BEGIN
  SELECT * INTO admin_record
  FROM public.super_admins
  WHERE email = p_email AND active = true;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Credenciais inválidas'
    );
  END IF;

  -- Verificar senha usando chamada explícita
  IF admin_record.password_hash = extensions.crypt(p_password, admin_record.password_hash) THEN
    -- Atualizar último login
    UPDATE public.super_admins 
    SET last_login = now() 
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
  ELSE
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Credenciais inválidas'
    );
  END IF;
END;
$function$;