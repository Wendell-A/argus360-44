-- ============================================================
-- LGPD FASE 2: FUNÇÕES DE MASCARAMENTO E VIEW MASCARADA
-- Data: 2025-10-01
-- Objetivo: Implementar mascaramento de dados pessoais
-- ============================================================

-- Função para mascarar CPF/CNPJ (document)
CREATE OR REPLACE FUNCTION public.mask_document(doc TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    -- Retorna string vazia se doc for NULL
    IF doc IS NULL OR doc = '' THEN
        RETURN '';
    END IF;
    
    -- Remove caracteres não numéricos
    doc := regexp_replace(doc, '[^0-9]', '', 'g');
    
    IF length(doc) = 11 THEN -- CPF
        RETURN substr(doc, 1, 3) || '.***.***-' || substr(doc, 10, 2);
    ELSIF length(doc) = 14 THEN -- CNPJ
        RETURN substr(doc, 1, 2) || '.***.***/' || substr(doc, 9, 4) || '-' || substr(doc, 13, 2);
    ELSE
        RETURN '***'; -- Retorno padrão para documentos inválidos
    END IF;
END;
$$;

-- Função para mascarar Email
CREATE OR REPLACE FUNCTION public.mask_email(email TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    parts TEXT[];
    username TEXT;
    domain TEXT;
BEGIN
    -- Retorna string vazia se email for NULL
    IF email IS NULL OR email = '' THEN
        RETURN '';
    END IF;
    
    -- Valida se tem @
    IF position('@' in email) = 0 THEN
        RETURN '***@***.***';
    END IF;
    
    parts := string_to_array(email, '@');
    username := parts[1];
    domain := parts[2];
    
    -- Protege casos de username muito curto
    IF length(username) <= 2 THEN
        RETURN '*****@' || domain;
    END IF;
    
    RETURN substr(username, 1, 1) || '*****' || substr(username, length(username), 1) || '@' || domain;
END;
$$;

-- Função para mascarar Telefone
CREATE OR REPLACE FUNCTION public.mask_phone(phone TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    -- Retorna string vazia se phone for NULL
    IF phone IS NULL OR phone = '' THEN
        RETURN '';
    END IF;
    
    -- Remove caracteres não numéricos
    phone := regexp_replace(phone, '[^0-9]', '', 'g');
    
    IF length(phone) >= 10 THEN
        RETURN '(' || substr(phone, 1, 2) || ') ****-' || substr(phone, length(phone) - 3, 4);
    ELSE
        RETURN '****-****';
    END IF;
END;
$$;

-- ============================================================
-- VIEW MASCARADA PARA CLIENTES
-- ============================================================

CREATE OR REPLACE VIEW public.clients_masked AS
SELECT
    id,
    tenant_id,
    name, -- Nome completo NÃO é mascarado
    type,
    mask_document(document) as document,
    mask_email(email) as email,
    mask_phone(phone) as phone,
    mask_phone(secondary_phone) as secondary_phone,
    status,
    classification,
    office_id,
    responsible_user_id,
    birth_date,
    occupation,
    monthly_income,
    address,
    notes,
    source,
    settings,
    created_at,
    updated_at
FROM
    public.clients;

-- Garantir permissões na view (herdar RLS da tabela clients)
ALTER VIEW public.clients_masked OWNER TO postgres;

-- Comentários para documentação
COMMENT ON FUNCTION public.mask_document IS 'Mascara CPF (11 dígitos) ou CNPJ (14 dígitos) mantendo apenas primeiros e últimos dígitos';
COMMENT ON FUNCTION public.mask_email IS 'Mascara email mantendo apenas primeira e última letra do username e domínio completo';
COMMENT ON FUNCTION public.mask_phone IS 'Mascara telefone mantendo apenas DDD e últimos 4 dígitos';
COMMENT ON VIEW public.clients_masked IS 'View com dados de clientes mascarados para listagens (LGPD compliant)';