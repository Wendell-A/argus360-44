-- Continuando correções das funções SQL restantes - Parte 2

-- 12. Corrigir get_query_performance_metrics
CREATE OR REPLACE FUNCTION public.get_query_performance_metrics(tenant_uuid uuid)
 RETURNS TABLE(metric_name text, metric_value numeric, measurement_time timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    'total_tables'::text as metric_name,
    (
      SELECT COUNT(*)::numeric 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    ) as metric_value,
    now() as measurement_time
  UNION ALL
  SELECT 
    'total_indexes'::text as metric_name,
    (
      SELECT COUNT(*)::numeric 
      FROM pg_indexes 
      WHERE schemaname = 'public'
    ) as metric_value,
    now() as measurement_time
  UNION ALL
  SELECT 
    'database_size_mb'::text as metric_name,
    (
      SELECT pg_database_size(current_database())::numeric / 1024 / 1024
    ) as metric_value,
    now() as measurement_time;
END;
$function$;

-- 13. Corrigir can_access_user_data
CREATE OR REPLACE FUNCTION public.can_access_user_data(accessing_user_id uuid, target_user_id uuid, tenant_uuid uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
  accessing_role user_role;
  target_office_id uuid;
  accessing_offices uuid[];
  can_access boolean := false;
BEGIN
  -- Se está tentando acessar seus próprios dados, sempre pode
  IF accessing_user_id = target_user_id THEN
    RETURN true;
  END IF;
  
  -- Obter role do usuário que está tentando acessar
  SELECT public.get_user_role_in_tenant(accessing_user_id, tenant_uuid) INTO accessing_role;
  
  -- Owner e Admin podem acessar dados de qualquer usuário
  IF accessing_role IN ('owner', 'admin') THEN
    RETURN true;
  END IF;
  
  -- Manager pode acessar dados de usuários do mesmo escritório ou contexto
  IF accessing_role = 'manager' THEN
    -- Obter escritório do usuário target
    SELECT office_id INTO target_office_id
    FROM public.tenant_users 
    WHERE user_id = target_user_id 
      AND tenant_id = tenant_uuid 
      AND active = true;
    
    -- Obter escritórios que o manager pode acessar
    SELECT public.get_user_context_offices(accessing_user_id, tenant_uuid) INTO accessing_offices;
    
    -- Verificar se o escritório do target está na lista do manager
    IF target_office_id = ANY(accessing_offices) THEN
      RETURN true;
    END IF;
  END IF;
  
  RETURN false;
END;
$function$;

-- 14. Corrigir get_user_full_context
CREATE OR REPLACE FUNCTION public.get_user_full_context(user_uuid uuid, tenant_uuid uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
  user_context jsonb;
  user_role_val user_role;
  office_ids uuid[];
  department_ids uuid[];
  team_ids uuid[];
BEGIN
  -- Obter role do usuário
  SELECT public.get_user_role_in_tenant(user_uuid, tenant_uuid) INTO user_role_val;
  
  -- Obter escritórios acessíveis
  SELECT public.get_user_context_offices(user_uuid, tenant_uuid) INTO office_ids;
  
  -- Obter departamentos acessíveis baseado no role
  IF user_role_val IN ('owner', 'admin') THEN
    SELECT ARRAY(
      SELECT id FROM public.departments 
      WHERE tenant_id = tenant_uuid
    ) INTO department_ids;
  ELSE
    SELECT ARRAY(
      SELECT DISTINCT COALESCE(tu.department_id, pc.context_id)
      FROM public.tenant_users tu
      LEFT JOIN public.permission_contexts pc ON pc.user_id = tu.user_id 
        AND pc.tenant_id = tu.tenant_id 
        AND pc.context_type = 'department' 
        AND pc.is_active = true
      WHERE tu.user_id = user_uuid 
        AND tu.tenant_id = tenant_uuid 
        AND tu.active = true
        AND (tu.department_id IS NOT NULL OR pc.context_id IS NOT NULL)
    ) INTO department_ids;
  END IF;
  
  -- Obter teams acessíveis baseado no role
  IF user_role_val IN ('owner', 'admin') THEN
    SELECT ARRAY(
      SELECT id FROM public.teams 
      WHERE tenant_id = tenant_uuid AND active = true
    ) INTO team_ids;
  ELSE
    SELECT ARRAY(
      SELECT DISTINCT COALESCE(tu.team_id, pc.context_id)
      FROM public.tenant_users tu
      LEFT JOIN public.permission_contexts pc ON pc.user_id = tu.user_id 
        AND pc.tenant_id = tu.tenant_id 
        AND pc.context_type = 'team' 
        AND pc.is_active = true
      WHERE tu.user_id = user_uuid 
        AND tu.tenant_id = tenant_uuid 
        AND tu.active = true
        AND (tu.team_id IS NOT NULL OR pc.context_id IS NOT NULL)
    ) INTO team_ids;
  END IF;
  
  -- Montar objeto de contexto
  user_context := jsonb_build_object(
    'user_id', user_uuid,
    'tenant_id', tenant_uuid,
    'role', user_role_val,
    'accessible_offices', office_ids,
    'accessible_departments', COALESCE(department_ids, ARRAY[]::uuid[]),
    'accessible_teams', COALESCE(team_ids, ARRAY[]::uuid[]),
    'is_owner_or_admin', user_role_val IN ('owner', 'admin'),
    'is_manager', user_role_val = 'manager',
    'is_user', user_role_val IN ('user', 'viewer'),
    'context_level', CASE 
      WHEN user_role_val IN ('owner', 'admin') THEN 1
      WHEN user_role_val = 'manager' THEN 2
      ELSE 4
    END
  );
  
  RETURN user_context;
END;
$function$;

-- 15. Corrigir validate_super_admin_session
CREATE OR REPLACE FUNCTION public.validate_super_admin_session(p_token character varying)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public, extensions'
AS $function$
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
$function$;

-- 16. Corrigir authenticate_super_admin
CREATE OR REPLACE FUNCTION public.authenticate_super_admin(p_email character varying, p_password character varying)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public, extensions'
AS $function$
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

  -- Verify password using pgcrypto's crypt
  IF admin_record.password_hash != crypt(p_password, admin_record.password_hash) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Credenciais inválidas'
    );
  END IF;

  -- Generate session token (pgcrypto gen_random_bytes)
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
$function$;

-- 17. Corrigir get_tenant_analytics
CREATE OR REPLACE FUNCTION public.get_tenant_analytics()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
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
$function$;