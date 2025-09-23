-- Corrigir constraint de status para incluir 'pending'
-- Primeiro remover a constraint existente
ALTER TABLE client_interactions DROP CONSTRAINT IF EXISTS client_interactions_status_check;

-- Adicionar nova constraint incluindo 'pending'
ALTER TABLE client_interactions ADD CONSTRAINT client_interactions_status_check 
CHECK (status::text = ANY (ARRAY['completed'::character varying, 'scheduled'::character varying, 'cancelled'::character varying, 'pending'::character varying]::text[]));