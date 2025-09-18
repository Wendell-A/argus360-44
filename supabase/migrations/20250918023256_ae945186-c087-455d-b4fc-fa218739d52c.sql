-- ETAPA 1: CORREÇÕES CRÍTICAS DE SEGURANÇA
-- Correção do Search Path em todas as funções identificadas

-- 1. Corrigir generate_invitation_token
CREATE OR REPLACE FUNCTION public.generate_invitation_token()
 RETURNS character varying
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  -- Usar md5 com uuid e timestamp para gerar token único de 32 caracteres
  RETURN md5(gen_random_uuid()::text || now()::text);
END;
$function$;

-- 2. Corrigir validate_invitation
CREATE OR REPLACE FUNCTION public.validate_invitation(invitation_token character varying)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
  invitation_record public.invitations%ROWTYPE;
  result jsonb;
BEGIN
  SELECT * INTO invitation_record
  FROM public.invitations
  WHERE token = invitation_token
    AND status = 'pending'
    AND expires_at > now();

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'Convite inválido ou expirado'
    );
  END IF;

  RETURN jsonb_build_object(
    'valid', true,
    'invitation', row_to_json(invitation_record)
  );
END;
$function$;

-- 3. Corrigir update_support_tickets_updated_at
CREATE OR REPLACE FUNCTION public.update_support_tickets_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- 4. Corrigir audit_trigger
CREATE OR REPLACE FUNCTION public.audit_trigger()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
  tenant_id_value uuid;
BEGIN
  -- Tentar extrair tenant_id do registro
  IF TG_OP = 'DELETE' THEN
    tenant_id_value := OLD.tenant_id;
  ELSE
    tenant_id_value := COALESCE(NEW.tenant_id, OLD.tenant_id);
  END IF;

  INSERT INTO public.audit_log (
    tenant_id,
    user_id,
    table_name,
    record_id,
    action,
    old_values,
    new_values,
    ip_address,
    user_agent
  ) VALUES (
    tenant_id_value,
    auth.uid(),
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    TG_OP,
    CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE row_to_json(OLD) END,
    CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE row_to_json(NEW) END,
    inet_client_addr(),
    current_setting('request.headers', true)::json->>'user-agent'
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- 5. Corrigir update_goal_progress
CREATE OR REPLACE FUNCTION public.update_goal_progress()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  -- Atualizar metas individuais do vendedor
  UPDATE public.goals 
  SET current_amount = (
    SELECT COALESCE(SUM(sale_value), 0)
    FROM public.sales 
    WHERE seller_id = NEW.seller_id 
    AND tenant_id = NEW.tenant_id
    AND status = 'approved'
    AND sale_date BETWEEN goals.period_start AND goals.period_end
  )
  WHERE user_id = NEW.seller_id 
  AND tenant_id = NEW.tenant_id
  AND goal_type = 'individual'
  AND status = 'active';
  
  -- Atualizar metas do escritório
  UPDATE public.goals 
  SET current_amount = (
    SELECT COALESCE(SUM(sale_value), 0)
    FROM public.sales 
    WHERE office_id = NEW.office_id 
    AND tenant_id = NEW.tenant_id
    AND status = 'approved'
    AND sale_date BETWEEN goals.period_start AND goals.period_end
  )
  WHERE office_id = NEW.office_id 
  AND tenant_id = NEW.tenant_id
  AND goal_type = 'office'
  AND status = 'active';
  
  RETURN NEW;
END;
$function$;

-- 6. Corrigir create_seller_commission_on_office_approval
CREATE OR REPLACE FUNCTION public.create_seller_commission_on_office_approval()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
  seller_rate NUMERIC;
  seller_amount NUMERIC;
  sale_seller_id UUID;
BEGIN
  -- Só processar quando comissão do escritório for aprovada
  IF NEW.status = 'approved' AND NEW.commission_type = 'office' AND 
     (OLD.status IS NULL OR OLD.status != 'approved') THEN
    
    -- Buscar o vendedor da venda
    SELECT seller_id INTO sale_seller_id 
    FROM public.sales 
    WHERE id = NEW.sale_id;
    
    -- Buscar taxa de comissão do vendedor para este produto
    SELECT commission_rate INTO seller_rate
    FROM public.seller_commissions
    WHERE tenant_id = NEW.tenant_id 
      AND seller_id = sale_seller_id
      AND product_id = (SELECT product_id FROM public.sales WHERE id = NEW.sale_id)
      AND is_active = true;
    
    -- Se encontrou configuração, criar comissão do vendedor
    IF seller_rate IS NOT NULL THEN
      seller_amount := NEW.commission_amount * (seller_rate / 100);
      
      INSERT INTO public.commissions (
        tenant_id,
        sale_id,
        recipient_id,
        recipient_type,
        commission_type,
        parent_commission_id,
        base_amount,
        commission_rate,
        commission_amount,
        installment_number,
        total_installments,
        installment_amount,
        due_date,
        status
      ) VALUES (
        NEW.tenant_id,
        NEW.sale_id,
        sale_seller_id,
        'seller',
        'seller',
        NEW.id,
        NEW.commission_amount, -- Base é a comissão do escritório
        seller_rate,
        seller_amount,
        NEW.installment_number,
        NEW.total_installments,
        seller_amount,
        NEW.due_date,
        'pending'
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- 7. Corrigir accept_invitation
CREATE OR REPLACE FUNCTION public.accept_invitation(invitation_token character varying, user_id uuid, user_email character varying, user_full_name character varying)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
  invitation_record public.invitations%ROWTYPE;
  result jsonb;
BEGIN
  -- Buscar convite válido
  SELECT * INTO invitation_record
  FROM public.invitations
  WHERE token = invitation_token
    AND status = 'pending'
    AND expires_at > now()
    AND email = user_email;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Convite inválido ou expirado'
    );
  END IF;

  -- Marcar convite como aceito
  UPDATE public.invitations
  SET status = 'accepted',
      accepted_at = now()
  WHERE id = invitation_record.id;

  -- Criar ou atualizar perfil
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (user_id, user_email, user_full_name)
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name;

  -- Criar associação tenant_user
  INSERT INTO public.tenant_users (user_id, tenant_id, role, active, joined_at)
  VALUES (user_id, invitation_record.tenant_id, invitation_record.role, true, now())
  ON CONFLICT (user_id, tenant_id) DO UPDATE SET
    role = EXCLUDED.role,
    active = true,
    joined_at = now();

  RETURN jsonb_build_object(
    'success', true,
    'tenant_id', invitation_record.tenant_id,
    'role', invitation_record.role
  );
END;
$function$;

-- Criar tabela para auditoria de dados sensíveis
CREATE TABLE IF NOT EXISTS public.sensitive_data_access_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  tenant_id uuid NOT NULL,
  table_name text NOT NULL,
  field_name text NOT NULL,
  record_id uuid,
  access_type text NOT NULL, -- 'view', 'edit', 'export'
  ip_address inet,
  user_agent text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS na tabela de auditoria
ALTER TABLE public.sensitive_data_access_log ENABLE ROW LEVEL SECURITY;

-- Política para auditoria: apenas admins podem ver logs
CREATE POLICY "Admins can view sensitive data logs" ON public.sensitive_data_access_log
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.tenant_users tu
    WHERE tu.user_id = auth.uid()
    AND tu.tenant_id = sensitive_data_access_log.tenant_id
    AND tu.role IN ('owner', 'admin')
  )
);

-- Função para log automático de acesso a dados sensíveis
CREATE OR REPLACE FUNCTION public.log_sensitive_access(
  p_table_name text,
  p_field_name text,
  p_record_id uuid,
  p_access_type text DEFAULT 'view'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
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
    (SELECT tenant_id FROM public.tenant_users WHERE user_id = auth.uid() LIMIT 1),
    p_table_name,
    p_field_name,
    p_record_id,
    p_access_type,
    inet_client_addr(),
    current_setting('request.headers', true)::json->>'user-agent'
  );
END;
$function$;