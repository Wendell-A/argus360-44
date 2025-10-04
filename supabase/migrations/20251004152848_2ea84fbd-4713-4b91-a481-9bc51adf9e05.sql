-- Atualizar função get_user_context_offices para buscar de tenant_users
-- Esta função estava buscando de office_users (legada) ao invés de tenant_users (atual)

CREATE OR REPLACE FUNCTION public.get_user_context_offices(user_uuid uuid, tenant_uuid uuid)
 RETURNS uuid[]
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$ 
DECLARE 
  office_ids uuid[]; 
BEGIN
  -- Buscar office_id de tenant_users (tabela atual) ao invés de office_users (legada)
  SELECT ARRAY_AGG(DISTINCT office_id) INTO office_ids 
  FROM tenant_users 
  WHERE user_id = user_uuid 
    AND tenant_id = tenant_uuid 
    AND active = true 
    AND office_id IS NOT NULL;
  
  -- Se não encontrou em tenant_users, tentar fallback em office_users (compatibilidade com dados legados)
  IF office_ids IS NULL OR array_length(office_ids, 1) IS NULL THEN
    SELECT ARRAY_AGG(DISTINCT office_id) INTO office_ids 
    FROM office_users 
    WHERE user_id = user_uuid 
      AND tenant_id = tenant_uuid 
      AND active = true 
      AND office_id IS NOT NULL;
  END IF;
  
  RETURN COALESCE(office_ids, ARRAY[]::uuid[]); 
END; 
$function$;