
-- Corrigir a função generate_invitation_token que está quebrada
-- Substituindo gen_random_bytes(32) por uma solução funcional no PostgreSQL do Supabase
CREATE OR REPLACE FUNCTION public.generate_invitation_token()
RETURNS character varying
LANGUAGE plpgsql
AS $function$
BEGIN
  -- Usar md5 com uuid e timestamp para gerar token único de 32 caracteres
  RETURN md5(gen_random_uuid()::text || now()::text);
END;
$function$;
