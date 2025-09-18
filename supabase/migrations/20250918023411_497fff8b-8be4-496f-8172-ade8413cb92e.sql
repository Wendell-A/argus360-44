-- Continuando as correções das funções SQL restantes

-- 8. Corrigir get_users_complete_optimized
CREATE OR REPLACE FUNCTION public.get_users_complete_optimized(tenant_uuid uuid, limit_param integer DEFAULT 50, offset_param integer DEFAULT 0)
 RETURNS TABLE(user_id uuid, user_data jsonb, profile_data jsonb, office_data jsonb, department_data jsonb, position_data jsonb, permissions_data jsonb, stats_data jsonb)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
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
$function$;

-- 9. Corrigir get_user_context_offices
CREATE OR REPLACE FUNCTION public.get_user_context_offices(user_uuid uuid, tenant_uuid uuid)
 RETURNS uuid[]
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path = 'public'
AS $function$
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
$function$;

-- 10. Corrigir get_crm_complete_optimized
CREATE OR REPLACE FUNCTION public.get_crm_complete_optimized(tenant_uuid uuid, limit_param integer DEFAULT 100)
 RETURNS TABLE(client_id uuid, client_data jsonb, funnel_position jsonb, recent_interactions jsonb, pending_tasks jsonb, sales_data jsonb)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
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
$function$;

-- 11. Corrigir get_dashboard_complete_optimized
CREATE OR REPLACE FUNCTION public.get_dashboard_complete_optimized(tenant_uuid uuid)
 RETURNS TABLE(stats_data jsonb, recent_sales jsonb, recent_clients jsonb, pending_tasks jsonb, goals_data jsonb, commission_summary jsonb)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
  user_role_val user_role;
  accessible_offices uuid[];
  stats_result jsonb;
  sales_result jsonb;
  clients_result jsonb;
  tasks_result jsonb;
  goals_result jsonb;
  commission_result jsonb;
BEGIN
  -- Obter contexto do usuário
  SELECT public.get_user_role_in_tenant(auth.uid(), tenant_uuid) INTO user_role_val;
  SELECT public.get_user_context_offices(auth.uid(), tenant_uuid) INTO accessible_offices;
  
  -- Calcular estatísticas principais
  SELECT jsonb_build_object(
    'total_clients', (
      SELECT COUNT(DISTINCT c.id) 
      FROM public.clients c
      WHERE c.tenant_id = tenant_uuid
        AND (
          user_role_val IN ('owner', 'admin')
          OR (user_role_val = 'manager' AND c.office_id = ANY(accessible_offices))
          OR (user_role_val IN ('user', 'viewer') AND c.responsible_user_id = auth.uid())
        )
    ),
    'total_sales', (
      SELECT COUNT(DISTINCT s.id) 
      FROM public.sales s
      WHERE s.tenant_id = tenant_uuid
        AND s.status = 'approved'
        AND (
          user_role_val IN ('owner', 'admin')
          OR (user_role_val = 'manager' AND s.office_id = ANY(accessible_offices))
          OR (user_role_val IN ('user', 'viewer') AND s.seller_id = auth.uid())
        )
    ),
    'total_revenue', (
      SELECT COALESCE(SUM(s.sale_value), 0) 
      FROM public.sales s
      WHERE s.tenant_id = tenant_uuid
        AND s.status = 'approved'
        AND (
          user_role_val IN ('owner', 'admin')
          OR (user_role_val = 'manager' AND s.office_id = ANY(accessible_offices))
          OR (user_role_val IN ('user', 'viewer') AND s.seller_id = auth.uid())
        )
    ),
    'total_commission', (
      SELECT COALESCE(SUM(com.commission_amount), 0) 
      FROM public.commissions com
      WHERE com.tenant_id = tenant_uuid
        AND com.status = 'paid'
        AND (
          user_role_val IN ('owner', 'admin')
          OR (user_role_val = 'manager' AND (
            (com.recipient_type = 'office' AND com.recipient_id = ANY(accessible_offices)) OR
            (com.recipient_type = 'seller' AND EXISTS (
              SELECT 1 FROM public.tenant_users tu 
              WHERE tu.user_id = com.recipient_id AND tu.office_id = ANY(accessible_offices)
            ))
          ))
          OR (user_role_val IN ('user', 'viewer') AND com.recipient_type = 'seller' AND com.recipient_id = auth.uid())
        )
    )
  ) INTO stats_result;

  -- Buscar vendas recentes (apenas os últimos 10)
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', s.id,
      'sale_value', s.sale_value,
      'status', s.status,
      'sale_date', s.sale_date,
      'client_name', c.name,
      'seller_name', p.full_name
    )
  ) INTO sales_result
  FROM (
    SELECT s.id, s.sale_value, s.status, s.sale_date, s.client_id, s.seller_id
    FROM public.sales s
    WHERE s.tenant_id = tenant_uuid
      AND (
        user_role_val IN ('owner', 'admin')
        OR (user_role_val = 'manager' AND s.office_id = ANY(accessible_offices))
        OR (user_role_val IN ('user', 'viewer') AND s.seller_id = auth.uid())
      )
    ORDER BY s.created_at DESC
    LIMIT 10
  ) s
  LEFT JOIN public.clients c ON c.id = s.client_id
  LEFT JOIN public.profiles p ON p.id = s.seller_id;

  -- Buscar clientes recentes (apenas os últimos 10)
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', c.id,
      'name', c.name,
      'email', c.email,
      'status', c.status,
      'created_at', c.created_at,
      'responsible_name', p.full_name
    )
  ) INTO clients_result
  FROM (
    SELECT c.id, c.name, c.email, c.status, c.created_at, c.responsible_user_id
    FROM public.clients c
    WHERE c.tenant_id = tenant_uuid
      AND (
        user_role_val IN ('owner', 'admin')
        OR (user_role_val = 'manager' AND c.office_id = ANY(accessible_offices))
        OR (user_role_val IN ('user', 'viewer') AND c.responsible_user_id = auth.uid())
      )
    ORDER BY c.created_at DESC
    LIMIT 10
  ) c
  LEFT JOIN public.profiles p ON p.id = c.responsible_user_id;

  -- Buscar tarefas pendentes (apenas as próximas 5)
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', at.id,
      'title', at.title,
      'description', at.description,
      'due_date', at.due_date,
      'priority', at.priority,
      'client_name', c.name
    )
  ) INTO tasks_result
  FROM (
    SELECT at.id, at.title, at.description, at.due_date, at.priority, at.client_id
    FROM public.automated_tasks at
    WHERE at.tenant_id = tenant_uuid
      AND at.status = 'pending'
      AND at.seller_id = auth.uid()
      AND at.due_date <= CURRENT_DATE + INTERVAL '7 days'
    ORDER BY at.due_date ASC
    LIMIT 5
  ) at
  LEFT JOIN public.clients c ON c.id = at.client_id;

  -- Buscar metas ativas
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
  ) INTO goals_result
  FROM public.goals g
  WHERE g.tenant_id = tenant_uuid
    AND g.status = 'active'
    AND (
      (g.goal_type = 'individual' AND g.user_id = auth.uid())
      OR (g.goal_type = 'office' AND user_role_val IN ('owner', 'admin', 'manager'))
    );

  -- Calcular resumo de comissões
  SELECT jsonb_build_object(
    'pending_commissions', COALESCE(SUM(commission_amount), 0)
  ) INTO commission_result
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
    );

  -- Retornar resultados
  RETURN QUERY
  SELECT 
    COALESCE(stats_result, '{"total_clients": 0, "total_sales": 0, "total_revenue": 0, "total_commission": 0}'::jsonb) as stats_data,
    COALESCE(sales_result, '[]'::jsonb) as recent_sales,
    COALESCE(clients_result, '[]'::jsonb) as recent_clients,
    COALESCE(tasks_result, '[]'::jsonb) as pending_tasks,
    COALESCE(goals_result, '[]'::jsonb) as goals_data,
    COALESCE(commission_result, '{"pending_commissions": 0}'::jsonb) as commission_summary;
END;
$function$;