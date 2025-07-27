-- Remover tentativa de configurar variáveis de sistema
-- Vamos usar uma abordagem mais simples com valores hardcoded

-- Habilitar extensões necessárias para triggers automáticos
CREATE EXTENSION IF NOT EXISTS http WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Função atualizada do trigger usando valores diretos
CREATE OR REPLACE FUNCTION public.send_invitation_automatic()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  request_id bigint;
  invitation_data jsonb;
  supabase_url text := 'https://ipmdzigjpthmaeyhejdl.supabase.co';
  service_role_key text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlwbWR6aWdqcHRobWFleWhlamRsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjUxNzQwMCwiZXhwIjoyMDY4MDkzNDAwfQ.oLnLuCfUPl_7c8YcPy8XTlm7JqyM0XkFbgBxKhH0UWo';
BEGIN
  -- Preparar dados do convite
  invitation_data := jsonb_build_object(
    'invitation_id', NEW.id,
    'email', NEW.email,
    'tenant_id', NEW.tenant_id,
    'role', NEW.role
  );

  -- Usar pg_net para chamar a edge function de forma assíncrona
  SELECT net.http_post(
    url := supabase_url || '/functions/v1/send-invitation-auto',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_role_key
    ),
    body := invitation_data,
    timeout_milliseconds := 15000
  ) INTO request_id;

  -- Log para debugging
  RAISE LOG 'Invitation auto-send triggered for % with request_id %', NEW.email, request_id;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log o erro mas não falha a operação de inserção
    RAISE LOG 'Failed to trigger auto invitation for %: %', NEW.email, SQLERRM;
    RETURN NEW;
END;
$$;