-- Etapa 6: Ajustes para Metas de Conversão
-- Data: 2025-01-10
-- Objetivo: Permitir goal_type='conversion', adicionar validações e atualizar RPC

-- 1. Atualizar CHECK constraint de goal_type para incluir 'conversion'
ALTER TABLE public.goals DROP CONSTRAINT IF EXISTS goals_goal_type_check;
ALTER TABLE public.goals ADD CONSTRAINT goals_goal_type_check 
  CHECK (goal_type IN ('office', 'individual', 'conversion'));

-- 2. Criar função de validação de regras de negócio
CREATE OR REPLACE FUNCTION public.validate_goal_business_rules()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validar office_id para metas office e conversion
  IF NEW.goal_type IN ('office', 'conversion') AND NEW.office_id IS NULL THEN
    RAISE EXCEPTION 'office_id é obrigatório para metas do tipo %', NEW.goal_type;
  END IF;
  
  -- Validar user_id para metas individuais
  IF NEW.goal_type = 'individual' AND NEW.user_id IS NULL THEN
    RAISE EXCEPTION 'user_id é obrigatório para metas individuais';
  END IF;
  
  -- Validar target_amount
  IF NEW.target_amount IS NULL OR NEW.target_amount < 0 THEN
    RAISE EXCEPTION 'target_amount deve ser maior ou igual a zero';
  END IF;
  
  -- Validar período
  IF NEW.period_start > NEW.period_end THEN
    RAISE EXCEPTION 'period_start deve ser menor ou igual a period_end';
  END IF;
  
  RETURN NEW;
END;
$$;

-- 3. Criar trigger de validação
DROP TRIGGER IF EXISTS trg_validate_goal_business_rules ON public.goals;
CREATE TRIGGER trg_validate_goal_business_rules
  BEFORE INSERT OR UPDATE ON public.goals
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_goal_business_rules();

-- 4. Atualizar RPC get_conversion_rate_summary para aceitar office_id
DROP FUNCTION IF EXISTS public.get_conversion_rate_summary(uuid, date, date);

CREATE OR REPLACE FUNCTION public.get_conversion_rate_summary(
  p_tenant_id UUID,
  p_office_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE(
  current_conversions BIGINT,
  conversion_goal NUMERIC,
  conversion_rate NUMERIC,
  total_entered BIGINT,
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
  v_total_entered BIGINT := 0;
  v_current_conversions BIGINT := 0;
  v_conversion_goal NUMERIC := 0;
  v_conversion_rate NUMERIC := 0;
  v_progress_percentage NUMERIC := 0;
BEGIN
  -- Buscar ID da etapa inicial (is_active, não active)
  SELECT id INTO v_initial_stage_id
  FROM public.sales_funnel_stages
  WHERE tenant_id = p_tenant_id
    AND is_initial_stage = true
    AND is_active = true
  LIMIT 1;

  -- Buscar ID da etapa final (is_active, não active)
  SELECT id INTO v_final_stage_id
  FROM public.sales_funnel_stages
  WHERE tenant_id = p_tenant_id
    AND is_final_stage = true
    AND is_active = true
  LIMIT 1;

  -- Se não houver configuração de funil, retornar zeros
  IF v_initial_stage_id IS NULL OR v_final_stage_id IS NULL THEN
    RETURN QUERY SELECT 0::BIGINT, 0::NUMERIC, 0::NUMERIC, 0::BIGINT, 0::NUMERIC;
    RETURN;
  END IF;

  -- Contar clientes que entraram na etapa inicial no período (filtrado por office_id)
  SELECT COUNT(DISTINCT cfp.client_id) INTO v_total_entered
  FROM public.client_funnel_position cfp
  JOIN public.clients c ON c.id = cfp.client_id
  WHERE cfp.tenant_id = p_tenant_id
    AND cfp.stage_id = v_initial_stage_id
    AND c.office_id = p_office_id
    AND cfp.entered_at::date BETWEEN p_start_date AND p_end_date;

  -- Contar clientes que chegaram à etapa final no período (filtrado por office_id)
  SELECT COUNT(DISTINCT cfp.client_id) INTO v_current_conversions
  FROM public.client_funnel_position cfp
  JOIN public.clients c ON c.id = cfp.client_id
  WHERE cfp.tenant_id = p_tenant_id
    AND cfp.stage_id = v_final_stage_id
    AND c.office_id = p_office_id
    AND cfp.entered_at::date BETWEEN p_start_date AND p_end_date;

  -- Buscar meta de conversão ativa para o escritório no período
  SELECT target_amount INTO v_conversion_goal
  FROM public.goals
  WHERE tenant_id = p_tenant_id
    AND goal_type = 'conversion'
    AND office_id = p_office_id
    AND status = 'active'
    AND period_start <= p_end_date
    AND period_end >= p_start_date
  ORDER BY created_at DESC
  LIMIT 1;

  -- Calcular taxa de conversão
  IF v_total_entered > 0 THEN
    v_conversion_rate := (v_current_conversions::NUMERIC / v_total_entered::NUMERIC) * 100;
  END IF;

  -- Calcular progresso em relação à meta
  IF v_conversion_goal > 0 THEN
    v_progress_percentage := (v_current_conversions::NUMERIC / v_conversion_goal) * 100;
  END IF;

  RETURN QUERY SELECT 
    v_current_conversions,
    COALESCE(v_conversion_goal, 0),
    ROUND(v_conversion_rate, 2),
    v_total_entered,
    ROUND(v_progress_percentage, 2);
END;
$$;

-- Garantir que authenticated users possam executar a função
GRANT EXECUTE ON FUNCTION public.get_conversion_rate_summary(UUID, UUID, DATE, DATE) TO authenticated;

-- 5. Atualizar RLS policy para managers criarem metas de conversão (opcional)
DROP POLICY IF EXISTS "Users can manage goals based on context" ON public.goals;
CREATE POLICY "Users can manage goals based on context"
ON public.goals
FOR ALL
USING (
  tenant_id = ANY(get_user_tenant_ids(auth.uid()))
  AND (
    -- Owner/Admin podem gerenciar todas as metas
    get_user_role_in_tenant(auth.uid(), tenant_id) IN ('owner', 'admin')
    OR
    -- Manager pode gerenciar metas do seu escritório e metas individuais próprias
    (
      get_user_role_in_tenant(auth.uid(), tenant_id) = 'manager'
      AND (
        (goal_type = 'office' AND office_id = ANY(get_user_context_offices(auth.uid(), tenant_id)))
        OR (goal_type = 'conversion' AND office_id = ANY(get_user_context_offices(auth.uid(), tenant_id)))
        OR (goal_type = 'individual' AND user_id = auth.uid())
      )
    )
  )
);