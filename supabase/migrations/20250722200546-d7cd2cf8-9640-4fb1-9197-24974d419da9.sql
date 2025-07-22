
-- Remover a constraint única que impede múltiplas posições do cliente
-- e adicionar campos para controlar posição atual vs histórico
ALTER TABLE client_funnel_position 
DROP CONSTRAINT IF EXISTS client_funnel_position_client_id_tenant_id_key;

-- Adicionar campo para controlar se é a posição atual
ALTER TABLE client_funnel_position 
ADD COLUMN IF NOT EXISTS is_current BOOLEAN DEFAULT true;

-- Adicionar campo para data de saída da fase
ALTER TABLE client_funnel_position 
ADD COLUMN IF NOT EXISTS exited_at TIMESTAMP WITH TIME ZONE;

-- Criar índice para performance na busca da posição atual
CREATE INDEX IF NOT EXISTS idx_client_funnel_position_current 
ON client_funnel_position (client_id, tenant_id, is_current) 
WHERE is_current = true;

-- Garantir que existe apenas uma posição atual por cliente/tenant
CREATE UNIQUE INDEX IF NOT EXISTS idx_client_funnel_position_unique_current
ON client_funnel_position (client_id, tenant_id)
WHERE is_current = true;
