
-- =====================================================
-- FASE 3: OTIMIZAÇÃO DE RPC FUNCTIONS
-- Data: 02 de Outubro de 2025
-- Objetivo: Eliminar N+1 queries e criar RPCs otimizadas
-- =====================================================

-- ===================================================
-- PARTE 1: RPC OTIMIZADA PARA VENDAS COMPLETAS
-- Elimina N+1 queries trazendo dados relacionados em uma query
-- ===================================================

CREATE OR REPLACE FUNCTION public.get_sales_complete_optimized(
  tenant_uuid UUID,
  limit_param INT DEFAULT 50,
  offset_param INT DEFAULT 0
)
RETURNS TABLE(
  sale_id UUID,
  sale_data JSONB,
  client_data JSONB,
  seller_data JSONB,
  product_data JSONB,
  office_data JSONB,
  commission_summary JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  user_role_val user_role;
  accessible_offices UUID[];
BEGIN
  -- Obter contexto do usuário
  SELECT public.get_user_role_in_tenant(auth.uid(), tenant_uuid) INTO user_role_val;
  SELECT public.get_user_context_offices(auth.uid(), tenant_uuid) INTO accessible_offices;

  RETURN QUERY
  SELECT 
    s.id AS sale_id,
    
    -- Dados da venda
    jsonb_build_object(
      'id', s.id,
      'sale_value', s.sale_value,
      'commission_rate', s.commission_rate,
      'commission_amount', s.commission_amount,
      'monthly_payment', s.monthly_payment,
      'installments', s.installments,
      'down_payment', s.down_payment,
      'status', s.status,
      'sale_date', s.sale_date,
      'approval_date', s.approval_date,
      'completion_date', s.completion_date,
      'cancellation_date', s.cancellation_date,
      'contract_number', s.contract_number,
      'notes', s.notes,
      'created_at', s.created_at,
      'updated_at', s.updated_at
    ) AS sale_data,
    
    -- Dados do cliente (evita N+1)
    jsonb_build_object(
      'id', c.id,
      'name', c.name,
      'document', c.document,
      'email', c.email,
      'phone', c.phone,
      'status', c.status,
      'classification', c.classification
    ) AS client_data,
    
    -- Dados do vendedor (evita N+1)
    jsonb_build_object(
      'id', p.id,
      'full_name', p.full_name,
      'email', p.email,
      'phone', p.phone,
      'avatar_url', p.avatar_url
    ) AS seller_data,
    
    -- Dados do produto (evita N+1)
    jsonb_build_object(
      'id', cp.id,
      'name', cp.name,
      'category', cp.category,
      'commission_rate', cp.commission_rate
    ) AS product_data,
    
    -- Dados do escritório (evita N+1)
    jsonb_build_object(
      'id', o.id,
      'name', o.name,
      'type', o.type
    ) AS office_data,
    
    -- Resumo de comissões (agregado)
    (
      SELECT jsonb_build_object(
        'total_commissions', COUNT(*),
        'total_amount', COALESCE(SUM(comm.commission_amount), 0),
        'pending_amount', COALESCE(SUM(CASE WHEN comm.status = 'pending' THEN comm.commission_amount ELSE 0 END), 0),
        'paid_amount', COALESCE(SUM(CASE WHEN comm.status = 'paid' THEN comm.commission_amount ELSE 0 END), 0)
      )
      FROM public.commissions comm
      WHERE comm.sale_id = s.id
    ) AS commission_summary
    
  FROM public.sales s
  
  -- JOINs para evitar N+1 queries
  LEFT JOIN public.clients c ON c.id = s.client_id
  LEFT JOIN public.profiles p ON p.id = s.seller_id
  LEFT JOIN public.consortium_products cp ON cp.id = s.product_id
  LEFT JOIN public.offices o ON o.id = s.office_id
  
  WHERE s.tenant_id = tenant_uuid
    AND (
      -- Owner/Admin: todas as vendas
      user_role_val IN ('owner', 'admin')
      OR
      -- Manager: vendas dos escritórios acessíveis
      (user_role_val = 'manager' AND s.office_id = ANY(accessible_offices))
      OR
      -- User/Viewer: apenas próprias vendas
      (user_role_val IN ('user', 'viewer') AND s.seller_id = auth.uid())
    )
  ORDER BY s.sale_date DESC, s.created_at DESC
  LIMIT limit_param
  OFFSET offset_param;
END;
$$;

COMMENT ON FUNCTION public.get_sales_complete_optimized IS 
'RPC otimizada que elimina N+1 queries trazendo vendas com todos dados relacionados em uma única query';


-- ===================================================
-- PARTE 2: RPC OTIMIZADA PARA COMISSÕES COMPLETAS
-- Elimina N+1 queries incluindo dados de vendas e destinatários
-- ===================================================

CREATE OR REPLACE FUNCTION public.get_commissions_complete_optimized(
  tenant_uuid UUID,
  limit_param INT DEFAULT 50,
  offset_param INT DEFAULT 0
)
RETURNS TABLE(
  commission_id UUID,
  commission_data JSONB,
  sale_data JSONB,
  recipient_data JSONB,
  parent_commission_data JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  user_role_val user_role;
  accessible_offices UUID[];
BEGIN
  -- Obter contexto do usuário
  SELECT public.get_user_role_in_tenant(auth.uid(), tenant_uuid) INTO user_role_val;
  SELECT public.get_user_context_offices(auth.uid(), tenant_uuid) INTO accessible_offices;

  RETURN QUERY
  SELECT 
    comm.id AS commission_id,
    
    -- Dados da comissão
    jsonb_build_object(
      'id', comm.id,
      'sale_id', comm.sale_id,
      'recipient_id', comm.recipient_id,
      'recipient_type', comm.recipient_type,
      'commission_type', comm.commission_type,
      'base_amount', comm.base_amount,
      'commission_rate', comm.commission_rate,
      'commission_amount', comm.commission_amount,
      'installment_number', comm.installment_number,
      'total_installments', comm.total_installments,
      'installment_amount', comm.installment_amount,
      'due_date', comm.due_date,
      'payment_date', comm.payment_date,
      'approval_date', comm.approval_date,
      'status', comm.status,
      'payment_method', comm.payment_method,
      'payment_reference', comm.payment_reference,
      'notes', comm.notes,
      'parent_commission_id', comm.parent_commission_id,
      'created_at', comm.created_at,
      'updated_at', comm.updated_at
    ) AS commission_data,
    
    -- Dados da venda relacionada (evita N+1)
    jsonb_build_object(
      'id', s.id,
      'sale_value', s.sale_value,
      'sale_date', s.sale_date,
      'status', s.status,
      'contract_number', s.contract_number,
      'client_name', c.name,
      'product_name', cp.name
    ) AS sale_data,
    
    -- Dados do destinatário (vendedor ou escritório) (evita N+1)
    CASE 
      WHEN comm.recipient_type = 'seller' THEN
        jsonb_build_object(
          'id', p.id,
          'type', 'seller',
          'name', p.full_name,
          'email', p.email,
          'avatar_url', p.avatar_url
        )
      WHEN comm.recipient_type = 'office' THEN
        jsonb_build_object(
          'id', o.id,
          'type', 'office',
          'name', o.name,
          'office_type', o.type
        )
      ELSE
        '{}'::jsonb
    END AS recipient_data,
    
    -- Dados da comissão pai (se houver)
    CASE 
      WHEN comm.parent_commission_id IS NOT NULL THEN
        (
          SELECT jsonb_build_object(
            'id', parent_comm.id,
            'commission_type', parent_comm.commission_type,
            'commission_amount', parent_comm.commission_amount,
            'status', parent_comm.status
          )
          FROM public.commissions parent_comm
          WHERE parent_comm.id = comm.parent_commission_id
        )
      ELSE
        NULL
    END AS parent_commission_data
    
  FROM public.commissions comm
  
  -- JOINs para evitar N+1 queries
  LEFT JOIN public.sales s ON s.id = comm.sale_id
  LEFT JOIN public.clients c ON c.id = s.client_id
  LEFT JOIN public.consortium_products cp ON cp.id = s.product_id
  LEFT JOIN public.profiles p ON p.id = comm.recipient_id AND comm.recipient_type = 'seller'
  LEFT JOIN public.offices o ON o.id = comm.recipient_id AND comm.recipient_type = 'office'
  
  WHERE comm.tenant_id = tenant_uuid
    AND (
      -- Owner/Admin: todas comissões
      user_role_val IN ('owner', 'admin')
      OR
      -- Manager: comissões dos escritórios ou vendedores do contexto
      (user_role_val = 'manager' AND (
        (comm.recipient_type = 'office' AND comm.recipient_id = ANY(accessible_offices))
        OR
        (comm.recipient_type = 'seller' AND EXISTS (
          SELECT 1 FROM public.tenant_users tu
          WHERE tu.user_id = comm.recipient_id
            AND tu.tenant_id = comm.tenant_id
            AND tu.office_id = ANY(accessible_offices)
        ))
      ))
      OR
      -- User/Viewer: apenas suas próprias comissões
      (user_role_val IN ('user', 'viewer') AND comm.recipient_type = 'seller' AND comm.recipient_id = auth.uid())
    )
  ORDER BY comm.due_date DESC, comm.created_at DESC
  LIMIT limit_param
  OFFSET offset_param;
END;
$$;

COMMENT ON FUNCTION public.get_commissions_complete_optimized IS 
'RPC otimizada que traz comissões com dados de vendas e destinatários em uma única query, eliminando N+1';


-- ===================================================
-- PARTE 3: RPC OTIMIZADA PARA CRM COMPLETO
-- Traz clientes com interações, tarefas, posição do funil e vendas
-- ===================================================

CREATE OR REPLACE FUNCTION public.get_crm_complete_optimized(
  tenant_uuid UUID,
  limit_param INT DEFAULT 100
)
RETURNS TABLE(
  client_id UUID,
  client_data JSONB,
  funnel_position JSONB,
  recent_interactions JSONB,
  pending_tasks JSONB,
  sales_data JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  user_role_val user_role;
  accessible_offices UUID[];
BEGIN
  -- Obter contexto do usuário
  SELECT public.get_user_role_in_tenant(auth.uid(), tenant_uuid) INTO user_role_val;
  SELECT public.get_user_context_offices(auth.uid(), tenant_uuid) INTO accessible_offices;

  RETURN QUERY
  SELECT 
    c.id AS client_id,
    
    -- Dados do cliente
    jsonb_build_object(
      'id', c.id,
      'name', c.name,
      'document', c.document,
      'type', c.type,
      'email', c.email,
      'phone', c.phone,
      'secondary_phone', c.secondary_phone,
      'status', c.status,
      'classification', c.classification,
      'source', c.source,
      'birth_date', c.birth_date,
      'occupation', c.occupation,
      'monthly_income', c.monthly_income,
      'responsible_user_id', c.responsible_user_id,
      'office_id', c.office_id,
      'notes', c.notes,
      'created_at', c.created_at,
      'updated_at', c.updated_at
    ) AS client_data,
    
    -- Posição atual no funil (agregado)
    (
      SELECT jsonb_build_object(
        'stage_id', cfp.stage_id,
        'stage_name', sfs.name,
        'stage_color', sfs.color,
        'probability', cfp.probability,
        'expected_value', cfp.expected_value,
        'estimated_close_date', cfp.estimated_close_date,
        'entered_at', cfp.entered_at,
        'notes', cfp.notes
      )
      FROM public.client_funnel_position cfp
      LEFT JOIN public.sales_funnel_stages sfs ON sfs.id = cfp.stage_id
      WHERE cfp.client_id = c.id 
        AND cfp.is_current = true
      LIMIT 1
    ) AS funnel_position,
    
    -- Últimas 5 interações (agregado)
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', ci.id,
          'title', ci.title,
          'interaction_type', ci.interaction_type,
          'status', ci.status,
          'outcome', ci.outcome,
          'priority', ci.priority,
          'scheduled_at', ci.scheduled_at,
          'completed_at', ci.completed_at,
          'next_action', ci.next_action,
          'next_action_date', ci.next_action_date,
          'seller_id', ci.seller_id,
          'seller_name', p.full_name,
          'created_at', ci.created_at
        ) ORDER BY ci.created_at DESC
      )
      FROM (
        SELECT * FROM public.client_interactions
        WHERE client_id = c.id
        ORDER BY created_at DESC
        LIMIT 5
      ) ci
      LEFT JOIN public.profiles p ON p.id = ci.seller_id
    ) AS recent_interactions,
    
    -- Tarefas pendentes (agregado)
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', at.id,
          'title', at.title,
          'description', at.description,
          'task_type', at.task_type,
          'priority', at.priority,
          'status', at.status,
          'due_date', at.due_date,
          'seller_id', at.seller_id,
          'seller_name', p.full_name,
          'created_at', at.created_at
        ) ORDER BY at.due_date ASC
      )
      FROM public.automated_tasks at
      LEFT JOIN public.profiles p ON p.id = at.seller_id
      WHERE at.client_id = c.id
        AND at.status = 'pending'
    ) AS pending_tasks,
    
    -- Resumo de vendas (agregado)
    (
      SELECT jsonb_build_object(
        'total_sales', COUNT(*),
        'total_value', COALESCE(SUM(s.sale_value), 0),
        'approved_sales', COUNT(*) FILTER (WHERE s.status = 'approved'),
        'pending_sales', COUNT(*) FILTER (WHERE s.status = 'pending'),
        'last_sale_date', MAX(s.sale_date)
      )
      FROM public.sales s
      WHERE s.client_id = c.id
    ) AS sales_data
    
  FROM public.clients c
  
  WHERE c.tenant_id = tenant_uuid
    AND (
      -- Owner/Admin: todos os clientes
      user_role_val IN ('owner', 'admin')
      OR
      -- Manager: clientes dos escritórios acessíveis
      (user_role_val = 'manager' AND c.office_id = ANY(accessible_offices))
      OR
      -- User/Viewer: apenas clientes que são responsáveis
      (user_role_val IN ('user', 'viewer') AND c.responsible_user_id = auth.uid())
    )
  ORDER BY c.updated_at DESC, c.created_at DESC
  LIMIT limit_param;
END;
$$;

COMMENT ON FUNCTION public.get_crm_complete_optimized IS 
'RPC otimizada que traz dados completos do CRM (clientes, funil, interações, tarefas, vendas) em uma única query';


-- ===================================================
-- PARTE 4: RPC PARA ESTATÍSTICAS DE FUNIL OTIMIZADA
-- ===================================================

CREATE OR REPLACE FUNCTION public.get_funnel_stats_optimized(
  tenant_uuid UUID
)
RETURNS TABLE(
  stage_id UUID,
  stage_name VARCHAR,
  stage_color VARCHAR,
  order_index INT,
  clients_count BIGINT,
  total_expected_value NUMERIC,
  avg_probability NUMERIC,
  conversion_rate NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sfs.id AS stage_id,
    sfs.name AS stage_name,
    sfs.color AS stage_color,
    sfs.order_index,
    COUNT(DISTINCT cfp.client_id) AS clients_count,
    COALESCE(SUM(cfp.expected_value), 0) AS total_expected_value,
    COALESCE(AVG(cfp.probability), 0) AS avg_probability,
    -- Taxa de conversão: % de clientes que avançaram para próximo estágio
    CASE 
      WHEN COUNT(DISTINCT cfp.client_id) > 0 THEN
        (
          SELECT COUNT(DISTINCT cfp2.client_id)::NUMERIC / COUNT(DISTINCT cfp.client_id)::NUMERIC * 100
          FROM public.client_funnel_position cfp2
          WHERE cfp2.stage_id > sfs.id
            AND cfp2.client_id IN (
              SELECT client_id FROM public.client_funnel_position
              WHERE stage_id = sfs.id
            )
        )
      ELSE 0
    END AS conversion_rate
  FROM public.sales_funnel_stages sfs
  LEFT JOIN public.client_funnel_position cfp 
    ON cfp.stage_id = sfs.id 
    AND cfp.is_current = true
  WHERE sfs.tenant_id = tenant_uuid
    AND sfs.active = true
  GROUP BY sfs.id, sfs.name, sfs.color, sfs.order_index
  ORDER BY sfs.order_index ASC;
END;
$$;

COMMENT ON FUNCTION public.get_funnel_stats_optimized IS 
'RPC otimizada que calcula estatísticas agregadas do funil de vendas';
