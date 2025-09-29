-- Permitir tenant_id NULL para conteúdo global de super admin
ALTER TABLE public.training_categories ALTER COLUMN tenant_id DROP NOT NULL;
ALTER TABLE public.training_videos ALTER COLUMN tenant_id DROP NOT NULL;