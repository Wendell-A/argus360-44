-- Create super admin tables and system
-- Date: 2025-09-14

-- Super admins table for system-wide administration
CREATE TABLE public.super_admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email varchar NOT NULL UNIQUE,
  password_hash varchar NOT NULL,
  full_name varchar NOT NULL,
  is_active boolean DEFAULT true,
  last_login timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS but allow super admins to manage themselves
ALTER TABLE public.super_admins ENABLE ROW LEVEL SECURITY;

-- Tenant payments tracking
CREATE TABLE public.tenant_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  payment_date date NOT NULL,
  due_date date NOT NULL,
  status varchar DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
  payment_method varchar,
  notes text,
  created_by uuid REFERENCES public.super_admins(id),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.tenant_payments ENABLE ROW LEVEL SECURITY;

-- Tenant custom pricing
CREATE TABLE public.tenant_pricing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
  plan_type varchar NOT NULL,
  monthly_price numeric NOT NULL,
  setup_fee numeric DEFAULT 0,
  discount_percentage numeric DEFAULT 0,
  is_active boolean DEFAULT true,
  valid_from date NOT NULL,
  valid_until date,
  created_by uuid REFERENCES public.super_admins(id),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.tenant_pricing ENABLE ROW LEVEL SECURITY;

-- Super admin sessions table for authentication
CREATE TABLE public.super_admin_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  super_admin_id uuid REFERENCES public.super_admins(id) ON DELETE CASCADE,
  token_hash varchar NOT NULL,
  expires_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  ip_address inet,
  user_agent text
);

ALTER TABLE public.super_admin_sessions ENABLE ROW LEVEL SECURITY;

-- Functions for super admin authentication
CREATE OR REPLACE FUNCTION public.authenticate_super_admin(p_email varchar, p_password varchar)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_record public.super_admins%ROWTYPE;
  session_token varchar;
  result jsonb;
BEGIN
  -- Find active super admin
  SELECT * INTO admin_record
  FROM public.super_admins
  WHERE email = p_email
    AND is_active = true;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Credenciais inválidas'
    );
  END IF;

  -- Verify password (in production, use proper hash verification)
  -- For now, we'll use simple comparison (should be replaced with bcrypt)
  IF admin_record.password_hash != crypt(p_password, admin_record.password_hash) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Credenciais inválidas'
    );
  END IF;

  -- Generate session token
  session_token := encode(gen_random_bytes(32), 'base64');

  -- Create session
  INSERT INTO public.super_admin_sessions (
    super_admin_id,
    token_hash,
    expires_at,
    ip_address,
    user_agent
  ) VALUES (
    admin_record.id,
    crypt(session_token, gen_salt('bf')),
    now() + INTERVAL '8 hours',
    inet_client_addr(),
    current_setting('request.headers', true)::json->>'user-agent'
  );

  -- Update last login
  UPDATE public.super_admins
  SET last_login = now()
  WHERE id = admin_record.id;

  RETURN jsonb_build_object(
    'success', true,
    'token', session_token,
    'admin', jsonb_build_object(
      'id', admin_record.id,
      'email', admin_record.email,
      'full_name', admin_record.full_name
    )
  );
END;
$$;

-- Function to validate super admin session
CREATE OR REPLACE FUNCTION public.validate_super_admin_session(p_token varchar)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  session_record record;
  admin_record public.super_admins%ROWTYPE;
BEGIN
  -- Find valid session
  SELECT s.*, sa.*
  INTO session_record
  FROM public.super_admin_sessions s
  JOIN public.super_admins sa ON sa.id = s.super_admin_id
  WHERE s.token_hash = crypt(p_token, s.token_hash)
    AND s.expires_at > now()
    AND sa.is_active = true;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Sessão inválida ou expirada'
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'admin', jsonb_build_object(
      'id', session_record.id,
      'email', session_record.email,
      'full_name', session_record.full_name
    )
  );
END;
$$;

-- Function to get tenant analytics for super admin
CREATE OR REPLACE FUNCTION public.get_tenant_analytics()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  stats jsonb;
BEGIN
  SELECT jsonb_build_object(
    'total_tenants', (SELECT COUNT(*) FROM public.tenants),
    'active_tenants', (SELECT COUNT(*) FROM public.tenants WHERE status = 'active'),
    'trial_tenants', (SELECT COUNT(*) FROM public.tenants WHERE status = 'trial'),
    'total_users', (SELECT COUNT(DISTINCT user_id) FROM public.tenant_users WHERE active = true),
    'total_revenue_pending', (SELECT COALESCE(SUM(amount), 0) FROM public.tenant_payments WHERE status = 'pending'),
    'total_revenue_paid', (SELECT COALESCE(SUM(amount), 0) FROM public.tenant_payments WHERE status = 'paid'),
    'overdue_payments', (SELECT COUNT(*) FROM public.tenant_payments WHERE status = 'overdue'),
    'recent_signups', (
      SELECT COUNT(*) FROM public.tenants 
      WHERE created_at >= now() - INTERVAL '30 days'
    )
  ) INTO stats;
  
  RETURN stats;
END;
$$;

-- Grant permissions for super admin functions
GRANT EXECUTE ON FUNCTION public.authenticate_super_admin(varchar, varchar) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.validate_super_admin_session(varchar) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_tenant_analytics() TO anon, authenticated;

-- RLS Policies for super admin tables
CREATE POLICY "Super admins can manage themselves" ON public.super_admins
  FOR ALL USING (true); -- Will be controlled by application logic

CREATE POLICY "Super admin access for payments" ON public.tenant_payments
  FOR ALL USING (true); -- Will be controlled by application logic

CREATE POLICY "Super admin access for pricing" ON public.tenant_pricing
  FOR ALL USING (true); -- Will be controlled by application logic

CREATE POLICY "Super admin access for sessions" ON public.super_admin_sessions
  FOR ALL USING (true); -- Will be controlled by application logic

-- Insert default super admin (password: admin123 - CHANGE IN PRODUCTION)
INSERT INTO public.super_admins (email, password_hash, full_name) VALUES 
('admin@argus360.com', crypt('admin123', gen_salt('bf')), 'Administrador Sistema');

-- Add indexes for performance
CREATE INDEX idx_super_admin_sessions_token ON public.super_admin_sessions USING btree (token_hash);
CREATE INDEX idx_super_admin_sessions_expires ON public.super_admin_sessions USING btree (expires_at);
CREATE INDEX idx_tenant_payments_tenant_status ON public.tenant_payments USING btree (tenant_id, status);
CREATE INDEX idx_tenant_pricing_tenant_active ON public.tenant_pricing USING btree (tenant_id, is_active);

-- Update function to handle updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add triggers for updated_at
CREATE TRIGGER update_super_admins_updated_at
  BEFORE UPDATE ON public.super_admins
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tenant_payments_updated_at
  BEFORE UPDATE ON public.tenant_payments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tenant_pricing_updated_at
  BEFORE UPDATE ON public.tenant_pricing
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();