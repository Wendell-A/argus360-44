-- FASE 2: ENHANCED CLIENT DATA PROTECTION
-- Data: 02/10/2025
-- Descrição: Adiciona validação rigorosa de tenant isolation e segurança de dados PII
-- Prioridade: HIGH

-- 1. Criar função para validar isolamento estrito de tenant
CREATE OR REPLACE FUNCTION public.verify_strict_tenant_isolation(
  _table_name text,
  _tenant_id uuid,
  _user_id uuid DEFAULT auth.uid()
)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verificar se usuário pertence ao tenant
  IF NOT EXISTS (
    SELECT 1 FROM public.tenant_users
    WHERE user_id = _user_id
    AND tenant_id = _tenant_id
    AND active = true
  ) THEN
    -- Log violação de segurança
    INSERT INTO public.audit_log (
      tenant_id, user_id, table_name, action,
      new_values, ip_address, user_agent
    ) VALUES (
      _tenant_id, _user_id, _table_name, 'TENANT_ISOLATION_VIOLATION',
      jsonb_build_object(
        'attempted_tenant', _tenant_id,
        'severity', 'CRITICAL',
        'timestamp', now()
      ),
      inet_client_addr(),
      current_setting('request.headers', true)::json->>'user-agent'
    );
    
    RAISE EXCEPTION 'Tenant isolation violation detected for table %', _table_name;
  END IF;
  
  RETURN true;
END;
$$;

-- 2. Criar função para auditar acesso a dados sensíveis de clientes
CREATE OR REPLACE FUNCTION public.log_sensitive_client_access(
  _client_id uuid,
  _access_type text,
  _fields_accessed text[]
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  client_tenant_id uuid;
BEGIN
  -- Obter tenant_id do cliente
  SELECT tenant_id INTO client_tenant_id
  FROM public.clients
  WHERE id = _client_id;
  
  -- Registrar acesso
  INSERT INTO public.sensitive_data_access_log (
    user_id,
    tenant_id,
    table_name,
    field_name,
    record_id,
    access_type,
    ip_address,
    user_agent
  ) VALUES (
    auth.uid(),
    client_tenant_id,
    'clients',
    array_to_string(_fields_accessed, ','),
    _client_id,
    _access_type,
    inet_client_addr(),
    current_setting('request.headers', true)::json->>'user-agent'
  );
END;
$$;

-- 3. Melhorar view clients_masked com RLS explícito
DROP VIEW IF EXISTS public.clients_masked CASCADE;

CREATE VIEW public.clients_masked AS
SELECT 
  c.id,
  c.tenant_id,
  c.office_id,
  c.responsible_user_id,
  c.name,
  c.type,
  c.classification,
  c.status,
  c.source,
  c.birth_date,
  c.occupation,
  c.monthly_income,
  c.address,
  c.notes,
  c.settings,
  c.created_at,
  c.updated_at,
  -- Campos sensíveis mascarados
  CASE 
    WHEN can_view_full_client_data(c.id, auth.uid()) THEN c.document
    ELSE CASE 
      WHEN LENGTH(c.document) = 11 THEN -- CPF
        CONCAT(LEFT(c.document, 3), '***', RIGHT(c.document, 2))
      WHEN LENGTH(c.document) = 14 THEN -- CNPJ
        CONCAT(LEFT(c.document, 2), '***', RIGHT(c.document, 2))
      ELSE '***'
    END
  END as document,
  CASE 
    WHEN can_view_full_client_data(c.id, auth.uid()) THEN c.email
    ELSE CASE 
      WHEN c.email IS NOT NULL THEN 
        CONCAT(LEFT(c.email, 2), '***@', SPLIT_PART(c.email, '@', 2))
      ELSE NULL
    END
  END as email,
  CASE 
    WHEN can_view_full_client_data(c.id, auth.uid()) THEN c.phone
    ELSE CASE 
      WHEN LENGTH(c.phone) > 4 THEN 
        CONCAT(LEFT(c.phone, 3), '****', RIGHT(c.phone, 2))
      ELSE '****'
    END
  END as phone,
  CASE 
    WHEN can_view_full_client_data(c.id, auth.uid()) THEN c.secondary_phone
    ELSE CASE 
      WHEN LENGTH(c.secondary_phone) > 4 THEN 
        CONCAT(LEFT(c.secondary_phone, 3), '****', RIGHT(c.secondary_phone, 2))
      ELSE '****'
    END
  END as secondary_phone,
  -- Flag indicando se dados estão mascarados
  NOT can_view_full_client_data(c.id, auth.uid()) as data_masked
FROM public.clients c;

-- 4. Habilitar RLS na view clients_masked
ALTER VIEW public.clients_masked SET (security_invoker = true);

-- 5. Criar política RLS para clients_masked
CREATE POLICY "Users can view masked clients based on context"
ON public.clients
FOR SELECT
TO authenticated
USING (
  verify_strict_tenant_isolation('clients', tenant_id) AND
  (
    get_user_role_in_tenant(auth.uid(), tenant_id) = ANY (ARRAY['owner'::user_role, 'admin'::user_role]) OR
    (get_user_role_in_tenant(auth.uid(), tenant_id) = 'manager'::user_role 
     AND office_id = ANY (get_user_context_offices(auth.uid(), tenant_id))) OR
    (get_user_role_in_tenant(auth.uid(), tenant_id) = ANY (ARRAY['user'::user_role, 'viewer'::user_role]) 
     AND responsible_user_id = auth.uid())
  )
);

-- 6. Criar função para validar acesso a dados completos do cliente
CREATE OR REPLACE FUNCTION public.can_view_full_client_data(p_client_id uuid, p_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  client_record clients%ROWTYPE;
  user_role_val user_role;
  user_offices UUID[];
BEGIN
  SELECT * INTO client_record
  FROM public.clients
  WHERE id = p_client_id;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Verificar isolamento de tenant
  IF NOT verify_strict_tenant_isolation('clients', client_record.tenant_id, p_user_id) THEN
    RETURN false;
  END IF;

  SELECT get_user_role_in_tenant(p_user_id, client_record.tenant_id) INTO user_role_val;
  SELECT get_user_context_offices(p_user_id, client_record.tenant_id) INTO user_offices;

  -- Owner/Admin podem ver todos os dados
  IF user_role_val IN ('owner', 'admin') THEN
    RETURN true;
  END IF;

  -- Manager pode ver dados do seu escritório
  IF user_role_val = 'manager' AND client_record.office_id = ANY(user_offices) THEN
    RETURN true;
  END IF;

  -- Usuário responsável pode ver dados completos
  IF client_record.responsible_user_id = p_user_id THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$;

-- 7. Criar trigger para auditar modificações em dados sensíveis
CREATE OR REPLACE FUNCTION public.audit_client_sensitive_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  changed_fields text[];
BEGIN
  changed_fields := ARRAY[]::text[];
  
  -- Detectar quais campos sensíveis mudaram
  IF TG_OP = 'UPDATE' THEN
    IF OLD.document IS DISTINCT FROM NEW.document THEN
      changed_fields := array_append(changed_fields, 'document');
    END IF;
    IF OLD.email IS DISTINCT FROM NEW.email THEN
      changed_fields := array_append(changed_fields, 'email');
    END IF;
    IF OLD.phone IS DISTINCT FROM NEW.phone THEN
      changed_fields := array_append(changed_fields, 'phone');
    END IF;
    IF OLD.secondary_phone IS DISTINCT FROM NEW.secondary_phone THEN
      changed_fields := array_append(changed_fields, 'secondary_phone');
    END IF;
    
    -- Registrar apenas se campos sensíveis mudaram
    IF array_length(changed_fields, 1) > 0 THEN
      INSERT INTO public.audit_log (
        tenant_id, user_id, table_name, record_id, action,
        old_values, new_values, ip_address, user_agent
      ) VALUES (
        NEW.tenant_id, auth.uid(), 'clients', NEW.id, 'SENSITIVE_DATA_MODIFIED',
        jsonb_build_object(
          'changed_fields', changed_fields,
          'old_masked', jsonb_build_object(
            'document', LEFT(OLD.document, 3) || '***',
            'email', CASE WHEN OLD.email IS NOT NULL THEN LEFT(OLD.email, 2) || '***' ELSE NULL END,
            'phone', CASE WHEN OLD.phone IS NOT NULL THEN LEFT(OLD.phone, 3) || '***' ELSE NULL END
          )
        ),
        jsonb_build_object(
          'changed_fields', changed_fields,
          'new_masked', jsonb_build_object(
            'document', LEFT(NEW.document, 3) || '***',
            'email', CASE WHEN NEW.email IS NOT NULL THEN LEFT(NEW.email, 2) || '***' ELSE NULL END,
            'phone', CASE WHEN NEW.phone IS NOT NULL THEN LEFT(NEW.phone, 3) || '***' ELSE NULL END
          )
        ),
        inet_client_addr(),
        current_setting('request.headers', true)::json->>'user-agent'
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER audit_client_sensitive_changes_trigger
AFTER UPDATE ON public.clients
FOR EACH ROW EXECUTE FUNCTION public.audit_client_sensitive_changes();

-- 8. Comentários para documentação
COMMENT ON FUNCTION public.verify_strict_tenant_isolation IS 'Valida isolamento estrito de tenant e registra violações - SECURITY DEFINER';
COMMENT ON FUNCTION public.log_sensitive_client_access IS 'Registra acesso a dados sensíveis de clientes para auditoria - SECURITY DEFINER';
COMMENT ON FUNCTION public.can_view_full_client_data IS 'Determina se usuário pode ver dados completos (não mascarados) do cliente - SECURITY DEFINER';
COMMENT ON VIEW public.clients_masked IS 'View com mascaramento automático de PII baseado em permissões do usuário';
COMMENT ON FUNCTION public.audit_client_sensitive_changes IS 'Audita modificações em campos sensíveis de clientes';