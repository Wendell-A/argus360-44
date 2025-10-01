-- Etapa 1: Adicionar suporte para Metas de Conversão

-- 1.1: Adicionar colunas para identificar etapas inicial e final do funil
ALTER TABLE public.sales_funnel_stages
ADD COLUMN IF NOT EXISTS is_initial_stage BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS is_final_stage BOOLEAN NOT NULL DEFAULT false;

-- 1.2: Adicionar comentários para documentação
COMMENT ON COLUMN public.sales_funnel_stages.is_initial_stage IS 'Indica se esta etapa é o início do funil para cálculo de conversão';
COMMENT ON COLUMN public.sales_funnel_stages.is_final_stage IS 'Indica se esta etapa é o fim do funil para cálculo de conversão';

-- 1.3: Criar índices para otimizar consultas de conversão
CREATE INDEX IF NOT EXISTS idx_sales_funnel_stages_initial ON public.sales_funnel_stages(tenant_id, is_initial_stage) WHERE is_initial_stage = true;
CREATE INDEX IF NOT EXISTS idx_sales_funnel_stages_final ON public.sales_funnel_stages(tenant_id, is_final_stage) WHERE is_final_stage = true;

-- 1.4: Adicionar índice na tabela goals para consultas por tipo de meta
CREATE INDEX IF NOT EXISTS idx_goals_type ON public.goals(tenant_id, goal_type) WHERE goal_type = 'conversion';