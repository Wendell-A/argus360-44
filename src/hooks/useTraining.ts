import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface TrainingCategory {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  order_index: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TrainingVideo {
  id: string;
  tenant_id: string;
  category_id: string;
  title: string;
  description: string | null;
  youtube_video_id: string;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  order_index: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TrainingCategoryWithVideos extends TrainingCategory {
  videos: TrainingVideo[];
}

export const useTrainingCategories = () => {
  const { activeTenant } = useAuth();

  return useQuery({
    queryKey: ['training-categories', activeTenant?.tenant_id],
    queryFn: async () => {
      if (!activeTenant?.tenant_id) {
        throw new Error('Tenant não encontrado');
      }

      // Buscar categorias
      const { data: categories, error: categoriesError } = await supabase
        .from('training_categories')
        .select('*')
        .eq('tenant_id', activeTenant.tenant_id)
        .eq('is_active', true)
        .order('order_index', { ascending: true });

      if (categoriesError) throw categoriesError;

      // Buscar vídeos para cada categoria
      const { data: videos, error: videosError } = await supabase
        .from('training_videos')
        .select('*')
        .eq('tenant_id', activeTenant.tenant_id)
        .eq('is_active', true)
        .order('order_index', { ascending: true });

      if (videosError) throw videosError;

      // Agrupar vídeos por categoria
      const categoriesWithVideos: TrainingCategoryWithVideos[] = categories.map(category => ({
        ...category,
        videos: videos.filter(video => video.category_id === category.id)
      }));

      return categoriesWithVideos;
    },
    enabled: !!activeTenant?.tenant_id,
  });
};
