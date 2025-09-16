-- Criar função para criar super admin
CREATE OR REPLACE FUNCTION public.create_super_admin(
  p_email varchar,
  p_password varchar,
  p_full_name varchar
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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

  -- Inserir novo super admin
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
$$;