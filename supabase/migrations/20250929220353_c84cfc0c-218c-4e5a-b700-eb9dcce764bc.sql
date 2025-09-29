-- ============================================
-- MIGRATIONS PARA PROPOSALS E TRAINING (CORRIGIDA)
-- Data: 29/09/2025
-- ============================================

-- ============================================
-- PARTE 1: PROPOSALS
-- ============================================

-- View otimizada para proposals com dados do cliente (SEM produtos)
CREATE OR REPLACE VIEW proposals_with_client_info AS
SELECT 
  p.id,
  p.tenant_id,
  p.office_id,
  p.client_id,
  p.product_id,
  p.valor_da_simulacao,
  p.valor_da_parcela,
  p.prazo,
  p.data_da_simulacao,
  p.taxa_comissao_escritorio,
  p.taxa_comissao_vendedor,
  p.created_at,
  p.updated_at,
  c.name as client_name,
  c.phone as client_phone,
  c.email as client_email
FROM proposals p
INNER JOIN clients c ON c.id = p.client_id;

-- ============================================
-- PARTE 2: TRAINING SYSTEM
-- ============================================

-- Tabela de categorias de treinamento
CREATE TABLE IF NOT EXISTS training_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, name)
);

-- RLS para training_categories
ALTER TABLE training_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view training categories in their tenant"
ON training_categories FOR SELECT
USING (tenant_id = ANY(get_user_tenant_ids(auth.uid())));

CREATE POLICY "Admins can manage training categories"
ON training_categories FOR ALL
USING (
  get_user_role_in_tenant(auth.uid(), tenant_id) IN ('owner', 'admin')
);

-- Tabela de vídeos de treinamento
CREATE TABLE IF NOT EXISTS training_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES training_categories(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  youtube_video_id TEXT NOT NULL,
  thumbnail_url TEXT,
  duration_seconds INTEGER,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS para training_videos
ALTER TABLE training_videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view training videos in their tenant"
ON training_videos FOR SELECT
USING (tenant_id = ANY(get_user_tenant_ids(auth.uid())));

CREATE POLICY "Admins can manage training videos"
ON training_videos FOR ALL
USING (
  get_user_role_in_tenant(auth.uid(), tenant_id) IN ('owner', 'admin')
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_training_categories_tenant ON training_categories(tenant_id, order_index);
CREATE INDEX IF NOT EXISTS idx_training_videos_category ON training_videos(category_id, order_index);
CREATE INDEX IF NOT EXISTS idx_training_videos_tenant ON training_videos(tenant_id);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_training_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_training_categories_updated_at
  BEFORE UPDATE ON training_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_training_updated_at();

CREATE TRIGGER update_training_videos_updated_at
  BEFORE UPDATE ON training_videos
  FOR EACH ROW
  EXECUTE FUNCTION update_training_updated_at();

-- Comentários nas tabelas
COMMENT ON TABLE training_categories IS 'Categorias de vídeos de treinamento organizados por tenant';
COMMENT ON TABLE training_videos IS 'Vídeos de treinamento hospedados no YouTube, organizados por categoria';
COMMENT ON VIEW proposals_with_client_info IS 'View otimizada que une proposals com dados de clientes (sem produtos)';