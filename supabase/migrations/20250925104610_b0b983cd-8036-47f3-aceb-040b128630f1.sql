-- Atualizar função para garantir responsible_user_id e office_id
CREATE OR REPLACE FUNCTION public.ensure_client_responsible_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Se responsible_user_id for null, definir como o usuário atual
  IF NEW.responsible_user_id IS NULL THEN
    NEW.responsible_user_id := auth.uid();
  END IF;
  
  -- Se office_id for null, pegar o office_id do usuário na tabela tenant_users
  IF NEW.office_id IS NULL THEN
    SELECT office_id INTO NEW.office_id
    FROM public.tenant_users 
    WHERE user_id = NEW.responsible_user_id 
      AND tenant_id = NEW.tenant_id 
      AND active = true
      AND office_id IS NOT NULL
    LIMIT 1;
  END IF;
  
  -- Garantir que o usuário está no mesmo tenant (verificação adicional)
  IF NOT EXISTS (
    SELECT 1 FROM public.tenant_users 
    WHERE user_id = NEW.responsible_user_id 
      AND tenant_id = NEW.tenant_id 
      AND active = true
  ) THEN
    -- Se não encontrar o usuário responsável no tenant, usar o usuário atual
    NEW.responsible_user_id := auth.uid();
    
    -- E pegar o office_id do usuário atual
    SELECT office_id INTO NEW.office_id
    FROM public.tenant_users 
    WHERE user_id = auth.uid() 
      AND tenant_id = NEW.tenant_id 
      AND active = true
      AND office_id IS NOT NULL
    LIMIT 1;
  END IF;
  
  RETURN NEW;
END;
$function$;