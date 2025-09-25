-- Correção crítica das funções SQL com search_path
CREATE OR REPLACE FUNCTION get_user_tenant_ids(user_uuid uuid)
RETURNS uuid[]
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN ARRAY(
    SELECT tenant_id 
    FROM public.tenant_users 
    WHERE user_id = user_uuid AND active = true
  );
END;
$$;

CREATE OR REPLACE FUNCTION get_user_context_offices(user_uuid uuid, tenant_uuid uuid)
RETURNS uuid[]
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN ARRAY(
    SELECT DISTINCT office_id 
    FROM public.tenant_users 
    WHERE user_id = user_uuid 
      AND tenant_id = tenant_uuid 
      AND office_id IS NOT NULL
      AND active = true
  );
END;
$$;

-- Função para garantir que clientes tenham responsible_user_id definido
CREATE OR REPLACE FUNCTION ensure_client_responsible_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Se responsible_user_id for null, definir como o usuário atual
  IF NEW.responsible_user_id IS NULL THEN
    NEW.responsible_user_id := auth.uid();
  END IF;
  
  -- Garantir que o usuário está no mesmo tenant
  IF NOT EXISTS (
    SELECT 1 FROM public.tenant_users 
    WHERE user_id = NEW.responsible_user_id 
      AND tenant_id = NEW.tenant_id 
      AND active = true
  ) THEN
    NEW.responsible_user_id := auth.uid();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- Trigger para garantir responsible_user_id em clientes
DROP TRIGGER IF EXISTS ensure_client_responsible_user_trigger ON public.clients;
CREATE TRIGGER ensure_client_responsible_user_trigger
  BEFORE INSERT OR UPDATE ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION ensure_client_responsible_user();

-- Atualizar clientes existentes sem responsible_user_id
UPDATE public.clients 
SET responsible_user_id = (
  SELECT user_id 
  FROM public.tenant_users 
  WHERE tenant_id = clients.tenant_id 
    AND active = true 
  ORDER BY created_at ASC 
  LIMIT 1
)
WHERE responsible_user_id IS NULL;