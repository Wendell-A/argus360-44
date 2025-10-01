-- =====================================================
-- Migração: Implementar Visibilidade e RLS para Training
-- Data: 2025-01-XX
-- Descrição: Adiciona coluna is_public e implementa políticas RLS
--            para permitir vídeos públicos e específicos por tenant
-- =====================================================

-- Tarefa 1: Evoluir o Schema do Banco de Dados
-- Adicionar coluna is_public à tabela training_videos
ALTER TABLE public.training_videos
ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT false;

-- Tarefa 2: Implementar Novas Políticas de RLS

-- Remover políticas antigas para garantir estado limpo
DROP POLICY IF EXISTS "Admins can manage training videos" ON public.training_videos;
DROP POLICY IF EXISTS "Users can view training videos in their tenant" ON public.training_videos;
DROP POLICY IF EXISTS "Admins can manage training categories" ON public.training_categories;
DROP POLICY IF EXISTS "Users can view training categories in their tenant" ON public.training_categories;

-- =====================================================
-- Políticas para training_videos
-- =====================================================

-- Política de Visualização (SELECT)
-- Usuários autenticados podem ver vídeos se:
-- 1) O vídeo pertence ao tenant do usuário, OU
-- 2) O vídeo está marcado como público (is_public = true)
-- E em ambos os casos, o vídeo deve estar ativo
CREATE POLICY "Users can view videos from their tenant or public videos"
ON public.training_videos
FOR SELECT
TO authenticated
USING (
  is_active = true 
  AND (
    tenant_id = ANY(get_user_tenant_ids(auth.uid()))
    OR is_public = true
  )
);

-- Política de Gerenciamento (INSERT, UPDATE, DELETE)
-- Apenas owners e admins podem gerenciar vídeos do seu próprio tenant
CREATE POLICY "Admins can manage videos in their tenant"
ON public.training_videos
FOR ALL
TO authenticated
USING (
  tenant_id = ANY(get_user_tenant_ids(auth.uid()))
  AND get_user_role_in_tenant(auth.uid(), tenant_id) IN ('owner', 'admin')
)
WITH CHECK (
  tenant_id = ANY(get_user_tenant_ids(auth.uid()))
  AND get_user_role_in_tenant(auth.uid(), tenant_id) IN ('owner', 'admin')
);

-- =====================================================
-- Políticas para training_categories
-- =====================================================

-- Política de Visualização (SELECT)
-- Usuários podem ver uma categoria se:
-- 1) A categoria está ativa E pertence ao tenant do usuário, OU
-- 2) Existe pelo menos um vídeo público ativo naquela categoria
CREATE POLICY "Users can view categories from their tenant or with public videos"
ON public.training_categories
FOR SELECT
TO authenticated
USING (
  is_active = true
  AND (
    tenant_id = ANY(get_user_tenant_ids(auth.uid()))
    OR EXISTS (
      SELECT 1
      FROM public.training_videos tv
      WHERE tv.category_id = training_categories.id
        AND tv.is_public = true
        AND tv.is_active = true
    )
  )
);

-- Política de Gerenciamento (ALL)
-- Apenas owners e admins podem gerenciar categorias do seu próprio tenant
CREATE POLICY "Admins can manage categories in their tenant"
ON public.training_categories
FOR ALL
TO authenticated
USING (
  tenant_id = ANY(get_user_tenant_ids(auth.uid()))
  AND get_user_role_in_tenant(auth.uid(), tenant_id) IN ('owner', 'admin')
)
WITH CHECK (
  tenant_id = ANY(get_user_tenant_ids(auth.uid()))
  AND get_user_role_in_tenant(auth.uid(), tenant_id) IN ('owner', 'admin')
);

-- =====================================================
-- Ativar RLS nas tabelas
-- =====================================================

ALTER TABLE public.training_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_videos ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- Comentários para documentação
-- =====================================================

COMMENT ON COLUMN public.training_videos.is_public IS 
'Indica se o vídeo é público para todos os tenants (true) ou específico do tenant (false)';

COMMENT ON POLICY "Users can view videos from their tenant or public videos" ON public.training_videos IS
'Permite visualização de vídeos do próprio tenant ou vídeos marcados como públicos';

COMMENT ON POLICY "Admins can manage videos in their tenant" ON public.training_videos IS
'Owners e admins podem gerenciar apenas vídeos do seu próprio tenant';

COMMENT ON POLICY "Users can view categories from their tenant or with public videos" ON public.training_categories IS
'Permite visualização de categorias do próprio tenant ou categorias com vídeos públicos';

COMMENT ON POLICY "Admins can manage categories in their tenant" ON public.training_categories IS
'Owners e admins podem gerenciar apenas categorias do seu próprio tenant';