-- FASE 2 CORRIGIDA: INTEGRAÇÃO COMPLETA LGPD
-- Data: 02/10/2025
-- Descrição: Integra funções de mascaramento originais com validações de segurança
-- Mantém: Modal de consentimento + Funções mask_* + Validações de tenant

-- Recriar view clients_masked integrando TODAS as funcionalidades LGPD
DROP VIEW IF EXISTS public.clients_masked CASCADE;

CREATE VIEW public.clients_masked 
WITH (security_invoker = true)
AS
SELECT 
  c.id,
  c.tenant_id,
  c.office_id,
  c.responsible_user_id,
  c.name, -- Nome NÃO é mascarado conforme especificação original
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
  
  -- Campos sensíveis: usa funções de mascaramento originais OU dados completos
  CASE 
    WHEN can_view_full_client_data(c.id, auth.uid()) 
    THEN c.document -- Dados completos
    ELSE mask_document(c.document) -- Mascaramento via função original
  END as document,
  
  CASE 
    WHEN can_view_full_client_data(c.id, auth.uid()) 
    THEN c.email
    ELSE mask_email(c.email)
  END as email,
  
  CASE 
    WHEN can_view_full_client_data(c.id, auth.uid()) 
    THEN c.phone
    ELSE mask_phone(c.phone)
  END as phone,
  
  CASE 
    WHEN can_view_full_client_data(c.id, auth.uid()) 
    THEN c.secondary_phone
    ELSE mask_phone(c.secondary_phone)
  END as secondary_phone,
  
  -- Flag indicando se dados estão mascarados (para transparência LGPD)
  NOT can_view_full_client_data(c.id, auth.uid()) as data_masked
  
FROM public.clients c;

-- Comentário atualizado
COMMENT ON VIEW public.clients_masked IS 'View LGPD-compliant: Usa funções mask_* originais + validações de permissão can_view_full_client_data() + flag de transparência data_masked';

-- Garantir que RLS é herdado da tabela clients
-- (security_invoker = true já faz isso automaticamente)