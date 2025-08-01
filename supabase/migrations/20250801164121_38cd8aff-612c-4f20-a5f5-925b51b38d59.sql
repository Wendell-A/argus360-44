-- ETAPA 2: RPC Functions Otimizadas para Eliminação N+1 Queries
-- Data: 31 de Janeiro de 2025, 03:02 UTC
-- 
-- Funções otimizadas que retornam todos os dados relacionados em uma única query
-- eliminando o problema de N+1 queries no frontend.

-- 1. Função otimizada para usuários completos
CREATE OR REPLACE FUNCTION public.get_users_complete_optimized(
  tenant_uuid uuid,
  limit_param integer DEFAULT 50,
  offset_param integer DEFAULT 0
) 
RETURNS TABLE(
  user_id uuid,
  user_data jsonb,
  profile_data jsonb,
  office_data jsonb,
  department_data jsonb,
  position_data jsonb,
  permissions_data jsonb,
  stats_data jsonb
) 
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = 'public'
AS $$
BEGIN
  RETURN QUERY
  WITH user_stats AS (
    SELECT 
      tu.user_id,
      jsonb_build_object(
        'total_sales', COALESCE(COUNT(DISTINCT s.id), 0),
        'total_commission', COALESCE(SUM(c.commission_amount), 0),
        'last_activity', MAX(al.created_at),
        'active_goals', COALESCE(COUNT(DISTINCT g.id), 0)
      ) as stats
    FROM public.tenant_users tu
    LEFT JOIN public.sales s ON s.seller_id = tu.user_id AND s.tenant_id = tu.tenant_id AND s.status = 'approved'
    LEFT JOIN public.commissions c ON c.recipient_id = tu.user_id AND c.tenant_id = tu.tenant_id AND c.status = 'paid'
    LEFT JOIN public.audit_log al ON al.user_id = tu.user_id AND al.tenant_id = tu.tenant_id
    LEFT JOIN public.goals g ON g.user_id = tu.user_id AND g.tenant_id = tu.tenant_id AND g.status = 'active'
    WHERE tu.tenant_id = tenant_uuid
    GROUP BY tu.user_id
  )
  SELECT 
    tu.user_id,
    to_jsonb(tu.*) - 'user_id' as user_data,
    COALESCE(to_jsonb(p.*), '{}'::jsonb) as profile_data,
    COALESCE(to_jsonb(o.*), '{}'::jsonb) as office_data,
    COALESCE(to_jsonb(d.*), '{}'::jsonb) as department_data,
    COALESCE(to_jsonb(pos.*), '{}'::jsonb) as position_data,
    COALESCE(tu.permissions, '{}'::jsonb) as permissions_data,
    COALESCE(us.stats, '{}'::jsonb) as stats_data
  FROM public.tenant_users tu
  LEFT JOIN public.profiles p ON p.id = tu.user_id
  LEFT JOIN public.offices o ON o.id = tu.office_id
  LEFT JOIN public.departments d ON d.id = tu.department_id
  LEFT JOIN public.positions pos ON pos.id = p.position_id
  LEFT JOIN user_stats us ON us.user_id = tu.user_id
  WHERE tu.tenant_id = tenant_uuid
    AND tu.active = true
    AND (
      public.get_user_role_in_tenant(auth.uid(), tenant_uuid) = ANY(ARRAY['owner'::user_role, 'admin'::user_role])
      OR (
        public.get_user_role_in_tenant(auth.uid(), tenant_uuid) = 'manager'::user_role
        AND tu.office_id = ANY(public.get_user_context_offices(auth.uid(), tenant_uuid))
      )
      OR tu.user_id = auth.uid()
    )
  ORDER BY tu.created_at DESC
  LIMIT limit_param
  OFFSET offset_param;
END;
$$;

-- 2. Função otimizada para dashboard completo
CREATE OR REPLACE FUNCTION public.get_dashboard_complete_optimized(
  tenant_uuid uuid
) 
RETURNS TABLE(
  stats_data jsonb,
  recent_sales jsonb,
  recent_clients jsonb,
  pending_tasks jsonb,
  goals_data jsonb,
  commission_summary jsonb
) 
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = 'public'
AS $$
DECLARE
  user_role_val user_role;
  accessible_offices uuid[];
BEGIN
  -- Obter contexto do usuário
  SELECT public.get_user_role_in_tenant(auth.uid(), tenant_uuid) INTO user_role_val;
  SELECT public.get_user_context_offices(auth.uid(), tenant_uuid) INTO accessible_offices;
  
  RETURN QUERY
  WITH stats_calc AS (
    SELECT 
      COUNT(DISTINCT CASE 
        WHEN user_role_val IN ('owner', 'admin') THEN c.id
        WHEN user_role_val = 'manager' AND c.office_id = ANY(accessible_offices) THEN c.id
        WHEN user_role_val IN ('user', 'viewer') AND c.responsible_user_id = auth.uid() THEN c.id
      END) as total_clients,
      COUNT(DISTINCT CASE 
        WHEN user_role_val IN ('owner', 'admin') AND s.status = 'approved' THEN s.id
        WHEN user_role_val = 'manager' AND s.office_id = ANY(accessible_offices) AND s.status = 'approved' THEN s.id
        WHEN user_role_val IN ('user', 'viewer') AND s.seller_id = auth.uid() AND s.status = 'approved' THEN s.id
      END) as total_sales,
      COALESCE(SUM(CASE 
        WHEN user_role_val IN ('owner', 'admin') AND s.status = 'approved' THEN s.sale_value
        WHEN user_role_val = 'manager' AND s.office_id = ANY(accessible_offices) AND s.status = 'approved' THEN s.sale_value
        WHEN user_role_val IN ('user', 'viewer') AND s.seller_id = auth.uid() AND s.status = 'approved' THEN s.sale_value
        ELSE 0
      END), 0) as total_revenue,
      COALESCE(SUM(CASE 
        WHEN user_role_val IN ('owner', 'admin') AND com.status = 'paid' THEN com.commission_amount
        WHEN user_role_val = 'manager' AND com.status = 'paid' AND (
          (com.recipient_type = 'office' AND com.recipient_id = ANY(accessible_offices)) OR
          (com.recipient_type = 'seller' AND EXISTS (
            SELECT 1 FROM public.tenant_users tu 
            WHERE tu.user_id = com.recipient_id AND tu.office_id = ANY(accessible_offices)
          ))
        ) THEN com.commission_amount
        WHEN user_role_val IN ('user', 'viewer') AND com.recipient_type = 'seller' AND com.recipient_id = auth.uid() AND com.status = 'paid' THEN com.commission_amount
        ELSE 0
      END), 0) as total_commission
    FROM public.clients c
    FULL OUTER JOIN public.sales s ON s.tenant_id = tenant_uuid
    FULL OUTER JOIN public.commissions com ON com.tenant_id = tenant_uuid
    WHERE c.tenant_id = tenant_uuid OR s.tenant_id = tenant_uuid OR com.tenant_id = tenant_uuid
  ),
  recent_sales_calc AS (
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', s.id,
        'sale_value', s.sale_value,
        'status', s.status,
        'sale_date', s.sale_date,
        'client_name', c.name,
        'seller_name', p.full_name
      )
    ) as recent_sales
    FROM public.sales s
    LEFT JOIN public.clients c ON c.id = s.client_id
    LEFT JOIN public.profiles p ON p.id = s.seller_id
    WHERE s.tenant_id = tenant_uuid
      AND (
        user_role_val IN ('owner', 'admin')
        OR (user_role_val = 'manager' AND s.office_id = ANY(accessible_offices))
        OR (user_role_val IN ('user', 'viewer') AND s.seller_id = auth.uid())
      )
    ORDER BY s.created_at DESC
    LIMIT 10
  ),
  recent_clients_calc AS (
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', c.id,
        'name', c.name,
        'email', c.email,
        'status', c.status,
        'created_at', c.created_at,
        'responsible_name', p.full_name
      )
    ) as recent_clients
    FROM public.clients c
    LEFT JOIN public.profiles p ON p.id = c.responsible_user_id
    WHERE c.tenant_id = tenant_uuid
      AND (
        user_role_val IN ('owner', 'admin')
        OR (user_role_val = 'manager' AND c.office_id = ANY(accessible_offices))
        OR (user_role_val IN ('user', 'viewer') AND c.responsible_user_id = auth.uid())
      )
    ORDER BY c.created_at DESC
    LIMIT 10
  ),
  pending_tasks_calc AS (
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', at.id,
        'title', at.title,
        'description', at.description,
        'due_date', at.due_date,
        'priority', at.priority,
        'client_name', c.name
      )
    ) as pending_tasks
    FROM public.automated_tasks at
    LEFT JOIN public.clients c ON c.id = at.client_id
    WHERE at.tenant_id = tenant_uuid
      AND at.status = 'pending'
      AND at.seller_id = auth.uid()
      AND at.due_date <= CURRENT_DATE + INTERVAL '7 days'
    ORDER BY at.due_date ASC
    LIMIT 5
  ),
  goals_calc AS (
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', g.id,
        'goal_type', g.goal_type,
        'target_amount', g.target_amount,
        'current_amount', g.current_amount,
        'progress_percentage', CASE 
          WHEN g.target_amount > 0 THEN (g.current_amount / g.target_amount) * 100
          ELSE 0
        END,
        'period_start', g.period_start,
        'period_end', g.period_end
      )
    ) as goals
    FROM public.goals g
    WHERE g.tenant_id = tenant_uuid
      AND g.status = 'active'
      AND (
        (g.goal_type = 'individual' AND g.user_id = auth.uid())
        OR (g.goal_type = 'office' AND user_role_val IN ('owner', 'admin', 'manager'))
      )
  )
  SELECT 
    jsonb_build_object(
      'total_clients', sc.total_clients,
      'total_sales', sc.total_sales,
      'total_revenue', sc.total_revenue,
      'total_commission', sc.total_commission
    ) as stats_data,
    COALESCE(rsc.recent_sales, '[]'::jsonb) as recent_sales,
    COALESCE(rcc.recent_clients, '[]'::jsonb) as recent_clients,
    COALESCE(ptc.pending_tasks, '[]'::jsonb) as pending_tasks,
    COALESCE(gc.goals, '[]'::jsonb) as goals_data,
    jsonb_build_object(
      'pending_commissions', (
        SELECT COALESCE(SUM(commission_amount), 0)
        FROM public.commissions 
        WHERE tenant_id = tenant_uuid 
          AND status = 'pending'
          AND (
            user_role_val IN ('owner', 'admin')
            OR (user_role_val = 'manager' AND (
              (recipient_type = 'office' AND recipient_id = ANY(accessible_offices)) OR
              (recipient_type = 'seller' AND EXISTS (
                SELECT 1 FROM public.tenant_users tu 
                WHERE tu.user_id = recipient_id AND tu.office_id = ANY(accessible_offices)
              ))
            ))
            OR (user_role_val IN ('user', 'viewer') AND recipient_type = 'seller' AND recipient_id = auth.uid())
          )
      )
    ) as commission_summary
  FROM stats_calc sc
  CROSS JOIN recent_sales_calc rsc
  CROSS JOIN recent_clients_calc rcc
  CROSS JOIN pending_tasks_calc ptc
  CROSS JOIN goals_calc gc;
END;
$$;

-- 3. Função otimizada para CRM completo (clientes + funil + interações)
CREATE OR REPLACE FUNCTION public.get_crm_complete_optimized(
  tenant_uuid uuid,
  limit_param integer DEFAULT 100
) 
RETURNS TABLE(
  client_id uuid,
  client_data jsonb,
  funnel_position jsonb,
  recent_interactions jsonb,
  pending_tasks jsonb,
  sales_data jsonb
) 
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = 'public'
AS $$
DECLARE
  user_role_val user_role;
  accessible_offices uuid[];
BEGIN
  -- Obter contexto do usuário
  SELECT public.get_user_role_in_tenant(auth.uid(), tenant_uuid) INTO user_role_val;
  SELECT public.get_user_context_offices(auth.uid(), tenant_uuid) INTO accessible_offices;
  
  RETURN QUERY
  WITH filtered_clients AS (
    SELECT c.*
    FROM public.clients c
    WHERE c.tenant_id = tenant_uuid
      AND (
        user_role_val IN ('owner', 'admin')
        OR (user_role_val = 'manager' AND c.office_id = ANY(accessible_offices))
        OR (user_role_val IN ('user', 'viewer') AND c.responsible_user_id = auth.uid())
      )
    LIMIT limit_param
  ),
  client_interactions AS (
    SELECT 
      ci.client_id,
      jsonb_agg(
        jsonb_build_object(
          'id', ci.id,
          'interaction_type', ci.interaction_type,
          'title', ci.title,
          'description', ci.description,
          'status', ci.status,
          'created_at', ci.created_at,
          'seller_name', p.full_name
        )
        ORDER BY ci.created_at DESC
      ) as interactions
    FROM public.client_interactions ci
    LEFT JOIN public.profiles p ON p.id = ci.seller_id
    WHERE ci.tenant_id = tenant_uuid
      AND ci.client_id IN (SELECT id FROM filtered_clients)
    GROUP BY ci.client_id
  ),
  client_tasks AS (
    SELECT 
      at.client_id,
      jsonb_agg(
        jsonb_build_object(
          'id', at.id,
          'title', at.title,
          'description', at.description,
          'status', at.status,
          'priority', at.priority,
          'due_date', at.due_date
        )
        ORDER BY at.due_date ASC
      ) as tasks
    FROM public.automated_tasks at
    WHERE at.tenant_id = tenant_uuid
      AND at.client_id IN (SELECT id FROM filtered_clients)
      AND at.status = 'pending'
    GROUP BY at.client_id
  ),
  client_sales AS (
    SELECT 
      s.client_id,
      jsonb_agg(
        jsonb_build_object(
          'id', s.id,
          'sale_value', s.sale_value,
          'status', s.status,
          'sale_date', s.sale_date,
          'commission_amount', s.commission_amount
        )
        ORDER BY s.sale_date DESC
      ) as sales
    FROM public.sales s
    WHERE s.tenant_id = tenant_uuid
      AND s.client_id IN (SELECT id FROM filtered_clients)
    GROUP BY s.client_id
  )
  SELECT 
    fc.id as client_id,
    to_jsonb(fc.*) as client_data,
    COALESCE((
      SELECT jsonb_build_object(
        'stage_id', cfp.stage_id,
        'stage_name', sfs.name,
        'stage_color', sfs.color,
        'probability', cfp.probability,
        'expected_value', cfp.expected_value,
        'entered_at', cfp.entered_at
      )
      FROM public.client_funnel_position cfp
      LEFT JOIN public.sales_funnel_stages sfs ON sfs.id = cfp.stage_id
      WHERE cfp.client_id = fc.id 
        AND cfp.tenant_id = tenant_uuid
        AND cfp.is_current = true
      LIMIT 1
    ), '{}'::jsonb) as funnel_position,
    COALESCE(ci.interactions, '[]'::jsonb) as recent_interactions,
    COALESCE(ct.tasks, '[]'::jsonb) as pending_tasks,
    COALESCE(cs.sales, '[]'::jsonb) as sales_data
  FROM filtered_clients fc
  LEFT JOIN client_interactions ci ON ci.client_id = fc.id
  LEFT JOIN client_tasks ct ON ct.client_id = fc.id
  LEFT JOIN client_sales cs ON cs.client_id = fc.id
  ORDER BY fc.created_at DESC;
END;
$$;

-- 4. Índices para otimização das funções
CREATE INDEX IF NOT EXISTS idx_tenant_users_office_active 
ON public.tenant_users(tenant_id, office_id) 
WHERE active = true;

CREATE INDEX IF NOT EXISTS idx_sales_seller_tenant_status 
ON public.sales(tenant_id, seller_id, status);

CREATE INDEX IF NOT EXISTS idx_commissions_recipient_tenant_status 
ON public.commissions(tenant_id, recipient_id, status);

CREATE INDEX IF NOT EXISTS idx_clients_office_responsible 
ON public.clients(tenant_id, office_id, responsible_user_id);

CREATE INDEX IF NOT EXISTS idx_client_interactions_client_date 
ON public.client_interactions(client_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_automated_tasks_seller_status_due 
ON public.automated_tasks(tenant_id, seller_id, status, due_date);

CREATE INDEX IF NOT EXISTS idx_goals_user_type_status 
ON public.goals(tenant_id, user_id, goal_type, status);

-- 5. Função para métricas de performance das queries
CREATE OR REPLACE FUNCTION public.get_query_performance_metrics(
  tenant_uuid uuid
) 
RETURNS TABLE(
  metric_name text,
  metric_value numeric,
  measurement_time timestamp with time zone
) 
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = 'public'
AS $$
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
$$;