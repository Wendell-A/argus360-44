
-- Fase 1: Correção search_path mantendo assinaturas
-- Data: 02/10/2025

CREATE OR REPLACE FUNCTION public.add_user_to_tenant(
  user_id uuid, user_email text, user_full_name text, 
  target_tenant_id uuid, user_role user_role DEFAULT 'user'::user_role
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$ DECLARE result jsonb; BEGIN
  IF NOT EXISTS (SELECT 1 FROM tenants WHERE id = target_tenant_id AND status IN ('trial', 'active')) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Tenant não encontrado');
  END IF;
  INSERT INTO profiles (id, email, full_name) VALUES (user_id, user_email, user_full_name)
  ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, full_name = EXCLUDED.full_name;
  INSERT INTO tenant_users (user_id, tenant_id, role, active, joined_at)
  VALUES (user_id, target_tenant_id, user_role, true, now());
  RETURN jsonb_build_object('tenant_id', target_tenant_id, 'user_id', user_id, 'success', true);
EXCEPTION WHEN OTHERS THEN RETURN jsonb_build_object('success', false, 'error', SQLERRM); END; $$;

CREATE OR REPLACE FUNCTION public.calculate_commission(p_sale_value numeric, p_commission_rate numeric)
RETURNS numeric LANGUAGE plpgsql SET search_path = 'public'
AS $$ BEGIN RETURN ROUND(p_sale_value * (p_commission_rate / 100), 2); END; $$;

CREATE OR REPLACE FUNCTION public.generate_invitation_token()
RETURNS varchar LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$ BEGIN RETURN md5(gen_random_uuid()::text || now()::text); END; $$;

CREATE OR REPLACE FUNCTION public.get_authenticated_user_data()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = 'public'
AS $$ DECLARE current_user_id uuid := auth.uid(); user_profile jsonb; tenants_list jsonb;
BEGIN
  IF current_user_id IS NULL THEN RETURN jsonb_build_object('authenticated', false); END IF;
  SELECT jsonb_build_object('authenticated', true, 'id', p.id, 'email', p.email, 'full_name', p.full_name, 'avatar_url', p.avatar_url, 'lgpd_accepted_at', p.lgpd_accepted_at, 'lgpd_version_accepted', p.lgpd_version_accepted) INTO user_profile FROM profiles p WHERE p.id = current_user_id;
  SELECT COALESCE(jsonb_agg(jsonb_build_object('tenant_id', t.id, 'tenant_name', t.name, 'tenant_slug', t.slug, 'tenant_status', t.status, 'user_role', tu.role, 'active', tu.active) ORDER BY t.created_at DESC), '[]'::jsonb) INTO tenants_list FROM tenant_users tu JOIN tenants t ON t.id = tu.tenant_id WHERE tu.user_id = current_user_id AND tu.active = true;
  IF user_profile IS NULL THEN user_profile := jsonb_build_object('authenticated', true, 'id', current_user_id); END IF;
  RETURN user_profile || jsonb_build_object('tenants', tenants_list);
END; $$;

CREATE OR REPLACE FUNCTION public.create_automatic_commissions()
RETURNS trigger LANGUAGE plpgsql SET search_path = 'public'
AS $$ DECLARE schedule_record RECORD; seller_commission_rate NUMERIC; office_commission_amount NUMERIC; seller_commission_amount NUMERIC; installment_due_date DATE;
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    FOR schedule_record IN SELECT * FROM commission_payment_schedules WHERE product_id = NEW.product_id ORDER BY installment_number LOOP
      installment_due_date := COALESCE(NEW.approval_date, CURRENT_DATE) + (schedule_record.installment_number * INTERVAL '30 days');
      office_commission_amount := NEW.sale_value * (schedule_record.percentage / 100);
      INSERT INTO commissions (tenant_id, sale_id, recipient_id, recipient_type, commission_type, base_amount, commission_rate, commission_amount, installment_number, total_installments, installment_amount, due_date, status) VALUES (NEW.tenant_id, NEW.id, NEW.office_id, 'office', 'office', NEW.sale_value, schedule_record.percentage, office_commission_amount, schedule_record.installment_number, (SELECT COUNT(*) FROM commission_payment_schedules WHERE product_id = NEW.product_id), office_commission_amount, installment_due_date, 'pending');
    END LOOP;
    SELECT COALESCE((SELECT commission_rate FROM seller_commissions WHERE tenant_id = NEW.tenant_id AND product_id = NEW.product_id AND seller_id = NEW.seller_id AND is_active = true ORDER BY created_at DESC LIMIT 1), (SELECT commission_rate FROM seller_commissions WHERE tenant_id = NEW.tenant_id AND product_id = NEW.product_id AND seller_id IS NULL AND is_default_rate = true AND is_active = true ORDER BY created_at DESC LIMIT 1), 0) INTO seller_commission_rate;
    IF seller_commission_rate > 0 THEN
      FOR schedule_record IN SELECT * FROM commission_payment_schedules WHERE product_id = NEW.product_id ORDER BY installment_number LOOP
        installment_due_date := COALESCE(NEW.approval_date, CURRENT_DATE) + (schedule_record.installment_number * INTERVAL '30 days');
        seller_commission_amount := NEW.sale_value * (seller_commission_rate / 100) * (schedule_record.percentage / 100);
        INSERT INTO commissions (tenant_id, sale_id, recipient_id, recipient_type, commission_type, base_amount, commission_rate, commission_amount, installment_number, total_installments, installment_amount, due_date, status) VALUES (NEW.tenant_id, NEW.id, NEW.seller_id, 'seller', 'seller', NEW.sale_value, seller_commission_rate, seller_commission_amount, schedule_record.installment_number, (SELECT COUNT(*) FROM commission_payment_schedules WHERE product_id = NEW.product_id), seller_commission_amount, installment_due_date, 'pending');
      END LOOP;
    END IF;
  END IF;
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.update_goals_progress()
RETURNS trigger LANGUAGE plpgsql SET search_path = 'public'
AS $$ BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    IF NEW.status = 'approved' THEN
      UPDATE goals SET current_amount = current_amount + NEW.sale_value, updated_at = now() WHERE goal_type = 'individual' AND user_id = NEW.seller_id AND tenant_id = NEW.tenant_id AND status = 'active' AND period_start <= NEW.sale_date AND period_end >= NEW.sale_date;
      UPDATE goals SET current_amount = current_amount + NEW.sale_value, updated_at = now() WHERE goal_type = 'office' AND office_id = NEW.office_id AND tenant_id = NEW.tenant_id AND status = 'active' AND period_start <= NEW.sale_date AND period_end >= NEW.sale_date;
    END IF;
  END IF;
  RETURN NEW;
END; $$;
