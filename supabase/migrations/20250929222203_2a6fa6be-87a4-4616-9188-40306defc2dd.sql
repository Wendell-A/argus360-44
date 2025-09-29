-- ============================================
-- TAREFA 1: Gerenciamento de Treinamentos
-- ============================================

-- Garantir que a tabela training_videos existe com todos os campos necessários
-- (Se já existe, apenas adicionar campos que faltam)
DO $$ 
BEGIN
  -- Adicionar campos se não existirem
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'training_videos' AND column_name = 'tenant_id') THEN
    ALTER TABLE public.training_videos ADD COLUMN tenant_id UUID NOT NULL;
  END IF;
END $$;

-- Índices para training_videos
CREATE INDEX IF NOT EXISTS idx_training_videos_tenant_id ON public.training_videos(tenant_id);
CREATE INDEX IF NOT EXISTS idx_training_videos_category_id ON public.training_videos(category_id);
CREATE INDEX IF NOT EXISTS idx_training_videos_active ON public.training_videos(is_active) WHERE is_active = true;

-- Enable RLS (se ainda não estiver)
ALTER TABLE public.training_videos ENABLE ROW LEVEL SECURITY;

-- Drop policies antigas se existirem e recriar
DROP POLICY IF EXISTS "Super admins can manage training videos" ON public.training_videos;
DROP POLICY IF EXISTS "Users can view training videos in their tenant" ON public.training_videos;
DROP POLICY IF EXISTS "Super admins can manage training categories" ON public.training_categories;

-- RLS Policies para training_videos (super admins)
CREATE POLICY "Super admins can manage training videos"
  ON public.training_videos
  FOR ALL
  USING (is_authenticated_super_admin())
  WITH CHECK (is_authenticated_super_admin());

-- RLS Policies para training_videos (tenant users - apenas visualização)
CREATE POLICY "Users can view training videos in their tenant"
  ON public.training_videos
  FOR SELECT
  USING (tenant_id = ANY (get_user_tenant_ids(auth.uid())) AND is_active = true);

-- Ajustar RLS de training_categories para super admins
CREATE POLICY "Super admins can manage training categories"
  ON public.training_categories
  FOR ALL
  USING (is_authenticated_super_admin())
  WITH CHECK (is_authenticated_super_admin());

-- ============================================
-- TAREFA 2: Sistema de Resposta a Chamados
-- ============================================

-- Drop policies antigas se existirem e recriar
DROP POLICY IF EXISTS "Super admins can view all tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Super admins can update all tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Super admins can view all ticket comments" ON public.support_ticket_comments;
DROP POLICY IF EXISTS "Super admins can create ticket comments" ON public.support_ticket_comments;

-- Ajustar RLS de support_tickets para super admins
CREATE POLICY "Super admins can view all tickets"
  ON public.support_tickets
  FOR SELECT
  USING (is_authenticated_super_admin());

CREATE POLICY "Super admins can update all tickets"
  ON public.support_tickets
  FOR UPDATE
  USING (is_authenticated_super_admin())
  WITH CHECK (is_authenticated_super_admin());

-- Ajustar RLS de support_ticket_comments para super admins
CREATE POLICY "Super admins can view all ticket comments"
  ON public.support_ticket_comments
  FOR SELECT
  USING (is_authenticated_super_admin());

CREATE POLICY "Super admins can create ticket comments"
  ON public.support_ticket_comments
  FOR INSERT
  WITH CHECK (is_authenticated_super_admin());

-- Índices adicionais para performance
CREATE INDEX IF NOT EXISTS idx_support_tickets_tenant_status ON public.support_tickets(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_support_ticket_comments_ticket_id ON public.support_ticket_comments(ticket_id, created_at DESC);