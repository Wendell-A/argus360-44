-- ETAPA 1: Criar função RPC para dados filtrados do dashboard e índice de otimização

-- Criar índice composto para otimizar queries filtradas
CREATE INDEX IF NOT EXISTS idx_sales_dashboard_filters 
ON public.sales (tenant_id, sale_date, office_id, product_id);

-- Função RPC para obter dados do dashboard com filtros aplicados
CREATE OR REPLACE FUNCTION public.get_filtered_dashboard_data(
  p_tenant_id UUID,
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL,
  p_office_ids UUID[] DEFAULT NULL,
  p_product_ids UUID[] DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSONB;
  stats_data JSONB;
  lists_data JSONB;
BEGIN
  -- Estatísticas gerais com filtros
  SELECT jsonb_build_object(
    'total_sales', COALESCE(SUM(s.sale_value), 0),
    'total_clients', COUNT(DISTINCT s.client_id),
    'active_sellers', COUNT(DISTINCT s.seller_id),
    'pending_commissions', COALESCE(SUM(
      CASE 
        WHEN c.status = 'pending' THEN c.commission_amount 
        ELSE 0 
      END
    ), 0),
    'avg_ticket', COALESCE(AVG(s.sale_value), 0),
    'conversion_rate', CASE 
      WHEN COUNT(DISTINCT cl.id) > 0 
      THEN ROUND((COUNT(DISTINCT s.client_id)::NUMERIC / COUNT(DISTINCT cl.id)::NUMERIC * 100), 2)
      ELSE 0 
    END
  ) INTO stats_data
  FROM public.sales s
  LEFT JOIN public.commissions c ON c.sale_id = s.id AND c.tenant_id = s.tenant_id
  LEFT JOIN public.clients cl ON cl.tenant_id = s.tenant_id
  WHERE s.tenant_id = p_tenant_id
    AND (p_start_date IS NULL OR s.sale_date >= p_start_date)
    AND (p_end_date IS NULL OR s.sale_date <= p_end_date)
    AND (p_office_ids IS NULL OR s.office_id = ANY(p_office_ids))
    AND (p_product_ids IS NULL OR s.product_id = ANY(p_product_ids));

  -- Listas com filtros
  SELECT jsonb_build_object(
    'recent_sales', (
      SELECT COALESCE(jsonb_agg(row_to_json(rs)), '[]'::jsonb)
      FROM (
        SELECT 
          s.id,
          s.sale_date,
          s.sale_value,
          s.client_id,
          s.seller_id,
          s.product_id,
          s.status
        FROM public.sales s
        WHERE s.tenant_id = p_tenant_id
          AND (p_start_date IS NULL OR s.sale_date >= p_start_date)
          AND (p_end_date IS NULL OR s.sale_date <= p_end_date)
          AND (p_office_ids IS NULL OR s.office_id = ANY(p_office_ids))
          AND (p_product_ids IS NULL OR s.product_id = ANY(p_product_ids))
        ORDER BY s.created_at DESC
        LIMIT 10
      ) rs
    ),
    'top_sellers', (
      SELECT COALESCE(jsonb_agg(row_to_json(ts)), '[]'::jsonb)
      FROM (
        SELECT 
          s.seller_id,
          COUNT(s.id) as total_sales,
          COALESCE(SUM(s.sale_value), 0) as total_value
        FROM public.sales s
        WHERE s.tenant_id = p_tenant_id
          AND s.status = 'approved'
          AND (p_start_date IS NULL OR s.sale_date >= p_start_date)
          AND (p_end_date IS NULL OR s.sale_date <= p_end_date)
          AND (p_office_ids IS NULL OR s.office_id = ANY(p_office_ids))
          AND (p_product_ids IS NULL OR s.product_id = ANY(p_product_ids))
        GROUP BY s.seller_id
        ORDER BY total_value DESC
        LIMIT 5
      ) ts
    ),
    'pending_tasks', (
      SELECT COALESCE(jsonb_agg(row_to_json(pt)), '[]'::jsonb)
      FROM (
        SELECT 
          ci.id,
          ci.title,
          ci.client_id,
          ci.seller_id,
          ci.scheduled_at,
          ci.priority,
          ci.status
        FROM public.client_interactions ci
        WHERE ci.tenant_id = p_tenant_id
          AND ci.status IN ('scheduled', 'pending')
          AND (p_start_date IS NULL OR ci.scheduled_at::date >= p_start_date)
          AND (p_end_date IS NULL OR ci.scheduled_at::date <= p_end_date)
        ORDER BY ci.scheduled_at ASC
        LIMIT 10
      ) pt
    ),
    'commission_breakdown', (
      SELECT COALESCE(jsonb_agg(row_to_json(cb)), '[]'::jsonb)
      FROM (
        SELECT 
          c.id,
          c.sale_id,
          c.recipient_id,
          c.recipient_type,
          c.commission_amount,
          c.status,
          c.due_date,
          s.sale_date,
          s.client_id,
          s.seller_id,
          s.product_id,
          s.office_id
        FROM public.commissions c
        JOIN public.sales s ON s.id = c.sale_id
        WHERE c.tenant_id = p_tenant_id
          AND (p_start_date IS NULL OR s.sale_date >= p_start_date)
          AND (p_end_date IS NULL OR s.sale_date <= p_end_date)
          AND (p_office_ids IS NULL OR s.office_id = ANY(p_office_ids))
          AND (p_product_ids IS NULL OR s.product_id = ANY(p_product_ids))
        ORDER BY c.created_at DESC
        LIMIT 10
      ) cb
    )
  ) INTO lists_data;

  -- Combinar estatísticas e listas
  result := jsonb_build_object(
    'statistics', stats_data,
    'lists', lists_data,
    'filters_applied', jsonb_build_object(
      'start_date', p_start_date,
      'end_date', p_end_date,
      'office_ids', p_office_ids,
      'product_ids', p_product_ids
    )
  );

  RETURN result;
END;
$$;