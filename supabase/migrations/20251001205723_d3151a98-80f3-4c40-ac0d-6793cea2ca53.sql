-- Etapa 2: Criar RPC para calcular conversão do funil

-- 2.1: Criar função para calcular conversão
CREATE OR REPLACE FUNCTION public.get_conversion_rate_summary(
  p_tenant_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE (
  current_conversions INTEGER,
  conversion_goal NUMERIC,
  conversion_rate NUMERIC,
  total_entered INTEGER,
  progress_percentage NUMERIC
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_initial_stage_id UUID;
  v_final_stage_id UUID;
  v_total_entered INTEGER := 0;
  v_total_converted INTEGER := 0;
  v_goal_value NUMERIC := 0;
  v_conversion_rate NUMERIC := 0;
  v_progress NUMERIC := 0;
BEGIN
  -- Buscar etapa inicial do funil para este tenant
  SELECT id INTO v_initial_stage_id
  FROM public.sales_funnel_stages
  WHERE tenant_id = p_tenant_id 
    AND is_initial_stage = true
    AND active = true
  LIMIT 1;
  
  -- Buscar etapa final do funil para este tenant
  SELECT id INTO v_final_stage_id
  FROM public.sales_funnel_stages
  WHERE tenant_id = p_tenant_id 
    AND is_final_stage = true
    AND active = true
  LIMIT 1;
  
  -- Se não houver etapas configuradas, retornar zeros
  IF v_initial_stage_id IS NULL OR v_final_stage_id IS NULL THEN
    RETURN QUERY SELECT 0, 0::NUMERIC, 0::NUMERIC, 0, 0::NUMERIC;
    RETURN;
  END IF;
  
  -- Contar total de clientes que entraram na etapa inicial no período
  SELECT COUNT(DISTINCT cfp.client_id) INTO v_total_entered
  FROM public.client_funnel_position cfp
  WHERE cfp.tenant_id = p_tenant_id
    AND cfp.stage_id = v_initial_stage_id
    AND cfp.entered_at::DATE >= p_start_date
    AND cfp.entered_at::DATE <= p_end_date;
  
  -- Contar clientes que chegaram à etapa final no período
  -- (podem ter entrado antes, mas chegaram à final durante o período)
  SELECT COUNT(DISTINCT cfp.client_id) INTO v_total_converted
  FROM public.client_funnel_position cfp
  WHERE cfp.tenant_id = p_tenant_id
    AND cfp.stage_id = v_final_stage_id
    AND cfp.entered_at::DATE >= p_start_date
    AND cfp.entered_at::DATE <= p_end_date
    AND EXISTS (
      -- Garantir que o cliente passou pela etapa inicial
      SELECT 1 FROM public.client_funnel_position cfp_initial
      WHERE cfp_initial.client_id = cfp.client_id
        AND cfp_initial.tenant_id = p_tenant_id
        AND cfp_initial.stage_id = v_initial_stage_id
    );
  
  -- Buscar meta de conversão ativa
  SELECT target_amount INTO v_goal_value
  FROM public.goals
  WHERE tenant_id = p_tenant_id
    AND goal_type = 'conversion'
    AND status = 'active'
    AND period_start <= p_end_date
    AND period_end >= p_start_date
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- Calcular taxa de conversão (evitar divisão por zero)
  IF v_total_entered > 0 THEN
    v_conversion_rate := ROUND((v_total_converted::NUMERIC / v_total_entered::NUMERIC) * 100, 2);
  ELSE
    v_conversion_rate := 0;
  END IF;
  
  -- Calcular progresso em relação à meta (evitar divisão por zero)
  IF v_goal_value > 0 THEN
    v_progress := ROUND((v_total_converted::NUMERIC / v_goal_value) * 100, 2);
  ELSE
    v_progress := 0;
  END IF;
  
  -- Retornar resultado
  RETURN QUERY SELECT 
    v_total_converted,
    COALESCE(v_goal_value, 0),
    v_conversion_rate,
    v_total_entered,
    v_progress;
END;
$$;

-- 2.2: Adicionar comentário para documentação
COMMENT ON FUNCTION public.get_conversion_rate_summary IS 'Calcula a taxa de conversão do funil de vendas entre etapa inicial e final para um período específico';

-- 2.3: Garantir que a função possa ser chamada por usuários autenticados
GRANT EXECUTE ON FUNCTION public.get_conversion_rate_summary(UUID, DATE, DATE) TO authenticated;