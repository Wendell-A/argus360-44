
-- Fase 1: Correção search_path - Batch 2 (Funções RLS e Validação)
-- Data: 02/10/2025

-- CRÍTICAS: Funções usadas por políticas RLS (não podem ser dropadas)
CREATE OR REPLACE FUNCTION public.get_user_context_offices(user_uuid uuid, tenant_uuid uuid)
RETURNS uuid[] LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = 'public'
AS $$ DECLARE office_ids uuid[]; BEGIN
  SELECT ARRAY_AGG(DISTINCT office_id) INTO office_ids FROM office_users WHERE user_id = user_uuid AND tenant_id = tenant_uuid AND active = true AND office_id IS NOT NULL;
  RETURN COALESCE(office_ids, ARRAY[]::uuid[]); END; $$;

CREATE OR REPLACE FUNCTION public.get_user_role_in_tenant(user_uuid uuid, tenant_uuid uuid)
RETURNS user_role LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = 'public'
AS $$ DECLARE user_role_val user_role; BEGIN
  SELECT role INTO user_role_val FROM tenant_users WHERE user_id = user_uuid AND tenant_id = tenant_uuid AND active = true;
  RETURN COALESCE(user_role_val, 'viewer'::user_role); END; $$;

CREATE OR REPLACE FUNCTION public.get_user_tenant_ids(user_uuid uuid)
RETURNS uuid[] LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = 'public'
AS $$ DECLARE tenant_ids uuid[]; BEGIN
  SELECT ARRAY_AGG(DISTINCT tenant_id) INTO tenant_ids FROM tenant_users WHERE user_id = user_uuid AND active = true;
  RETURN COALESCE(tenant_ids, ARRAY[]::uuid[]); END; $$;

-- TRIGGERS E VALIDAÇÕES
CREATE OR REPLACE FUNCTION public.validate_commission_hierarchy()
RETURNS trigger LANGUAGE plpgsql SET search_path = 'public'
AS $$ BEGIN
  IF NEW.seller_id IS NOT NULL AND NEW.is_active = true THEN
    UPDATE seller_commissions SET is_active = false 
    WHERE tenant_id = NEW.tenant_id AND product_id = NEW.product_id 
      AND seller_id IS NULL AND is_default_rate = true AND is_active = true;
  END IF;
  RETURN NEW; END; $$;

CREATE OR REPLACE FUNCTION public.check_permission_migration()
RETURNS TABLE(old_permissions_count bigint, new_permissions_count bigint, migrated_role_permissions bigint)
LANGUAGE plpgsql SET search_path = 'public'
AS $$ BEGIN RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM permissions WHERE module IN ('usuarios', 'clientes', 'comissoes', 'relatorios', 'configuracoes')),
    (SELECT COUNT(*) FROM permissions WHERE module IN ('users', 'clients', 'commissions', 'reports', 'system', 'sales', 'offices')),
    (SELECT COUNT(*) FROM role_permissions rp JOIN permissions p ON p.id = rp.permission_id WHERE p.module IN ('users', 'clients', 'commissions', 'reports', 'system', 'sales', 'offices'));
END; $$;

-- CONVITES
CREATE OR REPLACE FUNCTION public.accept_invitation(
  invitation_token character varying, user_id uuid, user_email character varying, user_full_name character varying
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$ DECLARE invitation_record invitations%ROWTYPE; result jsonb; BEGIN
  SELECT * INTO invitation_record FROM invitations WHERE token = invitation_token AND status = 'pending' AND expires_at > now() AND email = user_email;
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'Convite inválido ou expirado'); END IF;
  UPDATE invitations SET status = 'accepted', accepted_at = now() WHERE id = invitation_record.id;
  INSERT INTO profiles (id, email, full_name) VALUES (user_id, user_email, user_full_name)
  ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, full_name = EXCLUDED.full_name;
  INSERT INTO tenant_users (user_id, tenant_id, role, active, joined_at)
  VALUES (user_id, invitation_record.tenant_id, invitation_record.role, true, now())
  ON CONFLICT (user_id, tenant_id) DO UPDATE SET role = EXCLUDED.role, active = true, joined_at = now();
  RETURN jsonb_build_object('success', true, 'tenant_id', invitation_record.tenant_id, 'role', invitation_record.role);
END; $$;

CREATE OR REPLACE FUNCTION public.validate_invitation(invitation_token character varying)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$ DECLARE invitation_record invitations%ROWTYPE; result jsonb; BEGIN
  SELECT * INTO invitation_record FROM invitations WHERE token = invitation_token AND status = 'pending' AND expires_at > now();
  IF NOT FOUND THEN RETURN jsonb_build_object('valid', false, 'error', 'Convite inválido ou expirado'); END IF;
  RETURN jsonb_build_object('valid', true, 'invitation', row_to_json(invitation_record));
END; $$;

-- Comentários
COMMENT ON FUNCTION public.get_user_context_offices IS 'FASE 1 BATCH 2 - Corrigido: SET search_path';
COMMENT ON FUNCTION public.get_user_role_in_tenant IS 'FASE 1 BATCH 2 - Corrigido: SET search_path';
COMMENT ON FUNCTION public.get_user_tenant_ids IS 'FASE 1 BATCH 2 - Corrigido: SET search_path';
COMMENT ON FUNCTION public.validate_commission_hierarchy IS 'FASE 1 BATCH 2 - Corrigido: SET search_path';
COMMENT ON FUNCTION public.check_permission_migration IS 'FASE 1 BATCH 2 - Corrigido: SET search_path';
COMMENT ON FUNCTION public.accept_invitation IS 'FASE 1 BATCH 2 - Corrigido: SET search_path';
COMMENT ON FUNCTION public.validate_invitation IS 'FASE 1 BATCH 2 - Corrigido: SET search_path';
