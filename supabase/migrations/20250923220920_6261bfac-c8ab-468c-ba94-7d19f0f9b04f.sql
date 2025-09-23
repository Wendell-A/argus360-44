-- Critical Security Fixes - Stage 1b: Fix Remaining SQL Functions
-- 23/09/2025 - Fixing remaining 9 functions with search_path vulnerabilities

-- Fix remaining critical functions with search_path vulnerabilities
CREATE OR REPLACE FUNCTION public.get_user_context_offices(user_uuid uuid, tenant_uuid uuid)
RETURNS uuid[]
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  user_role_val user_role;
  office_ids uuid[];
BEGIN
  -- Obter role do usuário no tenant
  SELECT public.get_user_role_in_tenant(user_uuid, tenant_uuid) INTO user_role_val;
  
  -- Se é owner ou admin, pode acessar todos os escritórios
  IF user_role_val IN ('owner', 'admin') THEN
    SELECT ARRAY(
      SELECT id FROM public.offices 
      WHERE tenant_id = tenant_uuid AND active = true
    ) INTO office_ids;
    
  -- Se é manager, pode acessar escritórios onde tem contexto
  ELSIF user_role_val = 'manager' THEN
    SELECT ARRAY(
      SELECT DISTINCT COALESCE(tu.office_id, pc.context_id)
      FROM public.tenant_users tu
      LEFT JOIN public.permission_contexts pc ON pc.user_id = tu.user_id 
        AND pc.tenant_id = tu.tenant_id 
        AND pc.context_type = 'office' 
        AND pc.is_active = true
      WHERE tu.user_id = user_uuid 
        AND tu.tenant_id = tenant_uuid 
        AND tu.active = true
        AND (tu.office_id IS NOT NULL OR pc.context_id IS NOT NULL)
    ) INTO office_ids;
    
  -- Se é user ou viewer, apenas seu próprio escritório
  ELSE
    SELECT ARRAY(
      SELECT office_id 
      FROM public.tenant_users 
      WHERE user_id = user_uuid 
        AND tenant_id = tenant_uuid 
        AND active = true 
        AND office_id IS NOT NULL
    ) INTO office_ids;
  END IF;
  
  RETURN COALESCE(office_ids, ARRAY[]::uuid[]);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_full_context(user_uuid uuid, tenant_uuid uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  user_context jsonb;
  user_role_val user_role;
  accessible_offices uuid[];
  accessible_departments uuid[];
  accessible_teams uuid[];
BEGIN
  -- Get user role
  SELECT public.get_user_role_in_tenant(user_uuid, tenant_uuid) INTO user_role_val;
  
  -- Get accessible offices
  SELECT public.get_user_context_offices(user_uuid, tenant_uuid) INTO accessible_offices;
  
  -- Get accessible departments
  IF user_role_val IN ('owner', 'admin') THEN
    SELECT ARRAY(
      SELECT id FROM public.departments 
      WHERE tenant_id = tenant_uuid
    ) INTO accessible_departments;
  ELSE
    SELECT ARRAY(
      SELECT DISTINCT department_id 
      FROM public.tenant_users 
      WHERE user_id = user_uuid 
        AND tenant_id = tenant_uuid 
        AND department_id IS NOT NULL
    ) INTO accessible_departments;
  END IF;
  
  -- Get accessible teams (check if teams table exists)
  IF user_role_val IN ('owner', 'admin') THEN
    IF to_regclass('public.teams') IS NOT NULL THEN
      SELECT ARRAY(
        SELECT id FROM public.teams 
        WHERE tenant_id = tenant_uuid AND active = true
      ) INTO accessible_teams;
    END IF;
  ELSE
    IF to_regclass('public.teams') IS NOT NULL THEN
      SELECT ARRAY(
        SELECT DISTINCT team_id 
        FROM public.tenant_users 
        WHERE user_id = user_uuid 
          AND tenant_id = tenant_uuid 
          AND team_id IS NOT NULL
      ) INTO accessible_teams;
    END IF;
  END IF;
  
  -- Build context object
  user_context := jsonb_build_object(
    'user_id', user_uuid,
    'tenant_id', tenant_uuid,
    'role', user_role_val,
    'accessible_offices', accessible_offices,
    'accessible_departments', COALESCE(accessible_departments, ARRAY[]::uuid[]),
    'accessible_teams', COALESCE(accessible_teams, ARRAY[]::uuid[]),
    'context_level', CASE 
      WHEN user_role_val IN ('owner', 'admin') THEN 1
      WHEN user_role_val = 'manager' THEN 2
      ELSE 4
    END,
    'has_global_access', user_role_val IN ('owner', 'admin'),
    'can_manage_users', user_role_val IN ('owner', 'admin', 'manager'),
    'can_view_reports', user_role_val IN ('owner', 'admin', 'manager'),
    'can_manage_settings', user_role_val IN ('owner', 'admin')
  );
  
  RETURN user_context;
END;
$$;

-- Fix other remaining functions
CREATE OR REPLACE FUNCTION public.get_contextual_sales(user_uuid uuid, tenant_uuid uuid)
RETURNS TABLE(id uuid, client_id uuid, seller_id uuid, product_id uuid, office_id uuid, sale_value numeric, commission_rate numeric, commission_amount numeric, monthly_payment numeric, installments integer, down_payment numeric, status character varying, sale_date date, approval_date date, completion_date date, cancellation_date date, contract_number character varying, notes text, settings jsonb, created_at timestamp with time zone, updated_at timestamp with time zone, tenant_id uuid)
LANGUAGE plpgsql
STABLE 
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  user_role_val user_role;
  accessible_offices uuid[];
BEGIN
  -- Obter role e escritórios acessíveis
  SELECT public.get_user_role_in_tenant(user_uuid, tenant_uuid) INTO user_role_val;
  SELECT public.get_user_context_offices(user_uuid, tenant_uuid) INTO accessible_offices;
  
  -- Filtrar vendas baseado no contexto
  RETURN QUERY
  SELECT s.*
  FROM public.sales s
  WHERE s.tenant_id = tenant_uuid
    AND (
      -- Owner/Admin: todas as vendas
      user_role_val IN ('owner', 'admin')
      OR
      -- Manager: vendas dos escritórios acessíveis
      (user_role_val = 'manager' AND s.office_id = ANY(accessible_offices))
      OR
      -- User/Viewer: apenas próprias vendas
      (user_role_val IN ('user', 'viewer') AND s.seller_id = user_uuid)
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_contextual_commissions(user_uuid uuid, tenant_uuid uuid)
RETURNS TABLE(id uuid, sale_id uuid, recipient_id uuid, recipient_type character varying, commission_type character varying, base_amount numeric, commission_rate numeric, commission_amount numeric, installment_number integer, total_installments integer, installment_amount numeric, due_date date, payment_date date, approval_date date, status character varying, payment_method character varying, payment_reference character varying, notes text, settings jsonb, parent_commission_id uuid, created_at timestamp with time zone, updated_at timestamp with time zone, tenant_id uuid)
LANGUAGE plpgsql
STABLE 
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  user_role_val user_role;
  accessible_offices uuid[];
BEGIN
  -- Obter role e escritórios acessíveis
  SELECT public.get_user_role_in_tenant(user_uuid, tenant_uuid) INTO user_role_val;
  SELECT public.get_user_context_offices(user_uuid, tenant_uuid) INTO accessible_offices;
  
  -- Filtrar comissões baseado no contexto
  RETURN QUERY
  SELECT c.*
  FROM public.commissions c
  WHERE c.tenant_id = tenant_uuid
    AND (
      -- Owner/Admin: todas as comissões
      user_role_val IN ('owner', 'admin')
      OR
      -- Manager: comissões dos escritórios acessíveis
      (user_role_val = 'manager' AND (
        (c.recipient_type = 'office' AND c.recipient_id = ANY(accessible_offices))
        OR
        (c.recipient_type = 'seller' AND EXISTS (
          SELECT 1 FROM public.tenant_users tu 
          WHERE tu.user_id = c.recipient_id 
            AND tu.tenant_id = c.tenant_id 
            AND tu.office_id = ANY(accessible_offices)
        ))
      ))
      OR
      -- User/Viewer: apenas próprias comissões
      (user_role_val IN ('user', 'viewer') AND 
       c.recipient_type = 'seller' AND c.recipient_id = user_uuid)
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_contextual_users(user_uuid uuid, tenant_uuid uuid)
RETURNS TABLE(user_id uuid, tenant_id uuid, role user_role, office_id uuid, department_id uuid, team_id uuid, profile_id uuid, active boolean, context_level integer, permissions jsonb, invited_at timestamp with time zone, joined_at timestamp with time zone, created_at timestamp with time zone, updated_at timestamp with time zone)
LANGUAGE plpgsql
STABLE 
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  user_role_val user_role;
  accessible_offices uuid[];
BEGIN
  -- Obter role e escritórios acessíveis
  SELECT public.get_user_role_in_tenant(user_uuid, tenant_uuid) INTO user_role_val;
  SELECT public.get_user_context_offices(user_uuid, tenant_uuid) INTO accessible_offices;
  
  -- Filtrar usuários baseado no contexto
  RETURN QUERY
  SELECT tu.*
  FROM public.tenant_users tu
  WHERE tu.tenant_id = tenant_uuid
    AND tu.active = true
    AND (
      -- Próprio usuário sempre visível
      tu.user_id = user_uuid
      OR
      -- Owner/Admin: todos os usuários
      user_role_val IN ('owner', 'admin')
      OR
      -- Manager: usuários dos escritórios acessíveis
      (user_role_val = 'manager' AND tu.office_id = ANY(accessible_offices))
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_contextual_dashboard_stats(user_uuid uuid, tenant_uuid uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE 
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  user_role_val user_role;
  accessible_offices uuid[];
  stats jsonb;
  total_clients integer;
  total_sales integer;
  total_commission numeric;
  pending_tasks integer;
  month_sales numeric;
  month_commission numeric;
BEGIN
  -- Obter role e escritórios acessíveis
  SELECT public.get_user_role_in_tenant(user_uuid, tenant_uuid) INTO user_role_val;
  SELECT public.get_user_context_offices(user_uuid, tenant_uuid) INTO accessible_offices;
  
  -- Calcular estatísticas baseadas no contexto
  IF user_role_val IN ('owner', 'admin') THEN
    -- Owner/Admin: estatísticas globais
    SELECT COUNT(*) INTO total_clients
    FROM public.clients WHERE tenant_id = tenant_uuid;
    
    SELECT COUNT(*) INTO total_sales
    FROM public.sales WHERE tenant_id = tenant_uuid AND status = 'approved';
    
    SELECT COALESCE(SUM(commission_amount), 0) INTO total_commission
    FROM public.commissions WHERE tenant_id = tenant_uuid AND status = 'paid';
    
    SELECT COALESCE(SUM(sale_value), 0) INTO month_sales
    FROM public.sales 
    WHERE tenant_id = tenant_uuid 
      AND status = 'approved'
      AND EXTRACT(MONTH FROM sale_date) = EXTRACT(MONTH FROM CURRENT_DATE)
      AND EXTRACT(YEAR FROM sale_date) = EXTRACT(YEAR FROM CURRENT_DATE);
    
    SELECT COALESCE(SUM(commission_amount), 0) INTO month_commission
    FROM public.commissions 
    WHERE tenant_id = tenant_uuid 
      AND status = 'paid'
      AND EXTRACT(MONTH FROM payment_date) = EXTRACT(MONTH FROM CURRENT_DATE)
      AND EXTRACT(YEAR FROM payment_date) = EXTRACT(YEAR FROM CURRENT_DATE);
      
  ELSIF user_role_val = 'manager' THEN
    -- Manager: estatísticas dos escritórios acessíveis
    SELECT COUNT(*) INTO total_clients
    FROM public.clients 
    WHERE tenant_id = tenant_uuid AND office_id = ANY(accessible_offices);
    
    SELECT COUNT(*) INTO total_sales
    FROM public.sales 
    WHERE tenant_id = tenant_uuid AND office_id = ANY(accessible_offices) AND status = 'approved';
    
    SELECT COALESCE(SUM(c.commission_amount), 0) INTO total_commission
    FROM public.commissions c
    WHERE c.tenant_id = tenant_uuid AND c.status = 'paid'
      AND ((c.recipient_type = 'office' AND c.recipient_id = ANY(accessible_offices))
           OR (c.recipient_type = 'seller' AND EXISTS (
             SELECT 1 FROM public.tenant_users tu 
             WHERE tu.user_id = c.recipient_id AND tu.office_id = ANY(accessible_offices)
           )));
    
    SELECT COALESCE(SUM(sale_value), 0) INTO month_sales
    FROM public.sales 
    WHERE tenant_id = tenant_uuid 
      AND office_id = ANY(accessible_offices)
      AND status = 'approved'
      AND EXTRACT(MONTH FROM sale_date) = EXTRACT(MONTH FROM CURRENT_DATE)
      AND EXTRACT(YEAR FROM sale_date) = EXTRACT(YEAR FROM CURRENT_DATE);
    
    SELECT COALESCE(SUM(commission_amount), 0) INTO month_commission
    FROM public.commissions c
    WHERE c.tenant_id = tenant_uuid 
      AND c.status = 'paid'
      AND EXTRACT(MONTH FROM payment_date) = EXTRACT(MONTH FROM CURRENT_DATE)
      AND EXTRACT(YEAR FROM payment_date) = EXTRACT(YEAR FROM CURRENT_DATE)
      AND ((c.recipient_type = 'office' AND c.recipient_id = ANY(accessible_offices))
           OR (c.recipient_type = 'seller' AND EXISTS (
             SELECT 1 FROM public.tenant_users tu 
             WHERE tu.user_id = c.recipient_id AND tu.office_id = ANY(accessible_offices)
           )));
      
  ELSE
    -- User/Viewer: apenas estatísticas próprias
    SELECT COUNT(*) INTO total_clients
    FROM public.clients 
    WHERE tenant_id = tenant_uuid AND responsible_user_id = user_uuid;
    
    SELECT COUNT(*) INTO total_sales
    FROM public.sales 
    WHERE tenant_id = tenant_uuid AND seller_id = user_uuid AND status = 'approved';
    
    SELECT COALESCE(SUM(commission_amount), 0) INTO total_commission
    FROM public.commissions 
    WHERE tenant_id = tenant_uuid 
      AND recipient_type = 'seller' 
      AND recipient_id = user_uuid 
      AND status = 'paid';
    
    SELECT COALESCE(SUM(sale_value), 0) INTO month_sales
    FROM public.sales 
    WHERE tenant_id = tenant_uuid 
      AND seller_id = user_uuid
      AND status = 'approved'
      AND EXTRACT(MONTH FROM sale_date) = EXTRACT(MONTH FROM CURRENT_DATE)
      AND EXTRACT(YEAR FROM sale_date) = EXTRACT(YEAR FROM CURRENT_DATE);
    
    SELECT COALESCE(SUM(commission_amount), 0) INTO month_commission
    FROM public.commissions 
    WHERE tenant_id = tenant_uuid 
      AND recipient_type = 'seller'
      AND recipient_id = user_uuid
      AND status = 'paid'
      AND EXTRACT(MONTH FROM payment_date) = EXTRACT(MONTH FROM CURRENT_DATE)
      AND EXTRACT(YEAR FROM payment_date) = EXTRACT(YEAR FROM CURRENT_DATE);
  END IF;
  
  -- Calcular tarefas pendentes (sempre contextuais)
  SELECT COUNT(*) INTO pending_tasks
  FROM public.automated_tasks
  WHERE tenant_id = tenant_uuid 
    AND seller_id = user_uuid 
    AND status = 'pending'
    AND due_date <= CURRENT_DATE + INTERVAL '7 days';
  
  -- Montar objeto de estatísticas
  stats := jsonb_build_object(
    'total_clients', total_clients,
    'total_sales', total_sales,
    'total_commission', total_commission,
    'pending_tasks', pending_tasks,
    'month_sales', month_sales,
    'month_commission', month_commission,
    'user_role', user_role_val,
    'accessible_offices', accessible_offices,
    'context_level', CASE 
      WHEN user_role_val IN ('owner', 'admin') THEN 1
      WHEN user_role_val = 'manager' THEN 2
      ELSE 4
    END
  );
  
  RETURN stats;
END;
$$;