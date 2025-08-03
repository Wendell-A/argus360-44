-- CORREÇÃO: Criar função simples para Dashboard sem GROUP BY complexo
-- Data: 03 de Agosto de 2025

CREATE OR REPLACE FUNCTION public.get_dashboard_complete_optimized(tenant_uuid uuid)
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
SET search_path TO 'public'
AS $$
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
$$;