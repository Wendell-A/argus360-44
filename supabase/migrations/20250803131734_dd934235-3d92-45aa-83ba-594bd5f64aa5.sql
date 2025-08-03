-- CORREÇÃO: Função get_dashboard_complete_optimized com erro de GROUP BY
-- Data: 03 de Agosto de 2025
DROP FUNCTION IF EXISTS public.get_dashboard_complete_optimized(uuid);

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
AS $function$
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
      -- Clients count
      (SELECT COUNT(DISTINCT c.id) 
       FROM public.clients c
       WHERE c.tenant_id = tenant_uuid
         AND (
           user_role_val IN ('owner', 'admin')
           OR (user_role_val = 'manager' AND c.office_id = ANY(accessible_offices))
           OR (user_role_val IN ('user', 'viewer') AND c.responsible_user_id = auth.uid())
         )
      ) as total_clients,
      
      -- Sales count
      (SELECT COUNT(DISTINCT s.id) 
       FROM public.sales s
       WHERE s.tenant_id = tenant_uuid
         AND s.status = 'approved'
         AND (
           user_role_val IN ('owner', 'admin')
           OR (user_role_val = 'manager' AND s.office_id = ANY(accessible_offices))
           OR (user_role_val IN ('user', 'viewer') AND s.seller_id = auth.uid())
         )
      ) as total_sales,
      
      -- Revenue sum
      (SELECT COALESCE(SUM(s.sale_value), 0) 
       FROM public.sales s
       WHERE s.tenant_id = tenant_uuid
         AND s.status = 'approved'
         AND (
           user_role_val IN ('owner', 'admin')
           OR (user_role_val = 'manager' AND s.office_id = ANY(accessible_offices))
           OR (user_role_val IN ('user', 'viewer') AND s.seller_id = auth.uid())
         )
      ) as total_revenue,
      
      -- Commission sum
      (SELECT COALESCE(SUM(com.commission_amount), 0) 
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
      ) as total_commission
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
      ) ORDER BY s.created_at DESC
    ) as recent_sales
    FROM (
      SELECT s.*, ROW_NUMBER() OVER (ORDER BY s.created_at DESC) as rn
      FROM public.sales s
      WHERE s.tenant_id = tenant_uuid
        AND (
          user_role_val IN ('owner', 'admin')
          OR (user_role_val = 'manager' AND s.office_id = ANY(accessible_offices))
          OR (user_role_val IN ('user', 'viewer') AND s.seller_id = auth.uid())
        )
    ) s
    LEFT JOIN public.clients c ON c.id = s.client_id
    LEFT JOIN public.profiles p ON p.id = s.seller_id
    WHERE s.rn <= 10
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
      ) ORDER BY c.created_at DESC
    ) as recent_clients
    FROM (
      SELECT c.*, ROW_NUMBER() OVER (ORDER BY c.created_at DESC) as rn
      FROM public.clients c
      WHERE c.tenant_id = tenant_uuid
        AND (
          user_role_val IN ('owner', 'admin')
          OR (user_role_val = 'manager' AND c.office_id = ANY(accessible_offices))
          OR (user_role_val IN ('user', 'viewer') AND c.responsible_user_id = auth.uid())
        )
    ) c
    LEFT JOIN public.profiles p ON p.id = c.responsible_user_id
    WHERE c.rn <= 10
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
      ) ORDER BY at.due_date ASC
    ) as pending_tasks
    FROM (
      SELECT at.*, ROW_NUMBER() OVER (ORDER BY at.due_date ASC) as rn
      FROM public.automated_tasks at
      WHERE at.tenant_id = tenant_uuid
        AND at.status = 'pending'
        AND at.seller_id = auth.uid()
        AND at.due_date <= CURRENT_DATE + INTERVAL '7 days'
    ) at
    LEFT JOIN public.clients c ON c.id = at.client_id
    WHERE at.rn <= 5
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
  ),
  commission_summary_calc AS (
    SELECT jsonb_build_object(
      'pending_commissions', COALESCE(SUM(commission_amount), 0)
    ) as commission_summary
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
    COALESCE(csc.commission_summary, '{"pending_commissions": 0}'::jsonb) as commission_summary
  FROM stats_calc sc
  CROSS JOIN recent_sales_calc rsc
  CROSS JOIN recent_clients_calc rcc
  CROSS JOIN pending_tasks_calc ptc
  CROSS JOIN goals_calc gc
  CROSS JOIN commission_summary_calc csc;