import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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

// Função auxiliar para extrair youtube_video_id de URLs
export const extractYoutubeVideoId = (input: string): string => {
  // Se já é apenas o ID (11 caracteres), retornar direto
  if (/^[a-zA-Z0-9_-]{11}$/.test(input)) {
    return input;
  }

  // Padrões de URL do YouTube
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = input.match(pattern);
    if (match) return match[1];
  }

  throw new Error('URL do YouTube inválida');
};

// ============ CATEGORIAS ============

export const useAdminTrainingCategories = () => {
  return useQuery({
    queryKey: ['admin-training-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('training_categories')
        .select('*')
        .order('order_index', { ascending: true });

      if (error) throw error;
      return data as TrainingCategory[];
    },
  });
};

export const useCreateTrainingCategory = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (category: Omit<TrainingCategory, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('training_categories')
        .insert(category)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-training-categories'] });
      toast({
        title: 'Categoria criada',
        description: 'A categoria foi criada com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao criar categoria',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

export const useUpdateTrainingCategory = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<TrainingCategory> & { id: string }) => {
      const { data, error } = await supabase
        .from('training_categories')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-training-categories'] });
      toast({
        title: 'Categoria atualizada',
        description: 'A categoria foi atualizada com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao atualizar categoria',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

export const useDeleteTrainingCategory = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('training_categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-training-categories'] });
      queryClient.invalidateQueries({ queryKey: ['admin-training-videos'] });
      toast({
        title: 'Categoria excluída',
        description: 'A categoria foi excluída com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao excluir categoria',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

// ============ VÍDEOS ============

export const useAdminTrainingVideos = (categoryId?: string) => {
  return useQuery({
    queryKey: ['admin-training-videos', categoryId],
    queryFn: async () => {
      let query = supabase
        .from('training_videos')
        .select('*')
        .order('order_index', { ascending: true });

      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as TrainingVideo[];
    },
  });
};

export const useCreateTrainingVideo = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (video: Omit<TrainingVideo, 'id' | 'created_at' | 'updated_at' | 'thumbnail_url' | 'duration_seconds'> & { youtube_video_id: string }) => {
      // Extrair ID do vídeo se for uma URL completa
      const videoId = extractYoutubeVideoId(video.youtube_video_id);
      
      const videoData = {
        ...video,
        youtube_video_id: videoId,
        thumbnail_url: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      };

      const { data, error } = await supabase
        .from('training_videos')
        .insert(videoData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-training-videos'] });
      toast({
        title: 'Vídeo criado',
        description: 'O vídeo foi criado com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao criar vídeo',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

export const useUpdateTrainingVideo = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, youtube_video_id, ...updates }: Partial<TrainingVideo> & { id: string }) => {
      let videoData: any = { ...updates };
      
      // Se o youtube_video_id foi atualizado, processar
      if (youtube_video_id) {
        const videoId = extractYoutubeVideoId(youtube_video_id);
        videoData.youtube_video_id = videoId;
        videoData.thumbnail_url = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
      }

      const { data, error } = await supabase
        .from('training_videos')
        .update(videoData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-training-videos'] });
      toast({
        title: 'Vídeo atualizado',
        description: 'O vídeo foi atualizado com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao atualizar vídeo',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

export const useDeleteTrainingVideo = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('training_videos')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-training-videos'] });
      toast({
        title: 'Vídeo excluído',
        description: 'O vídeo foi excluído com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao excluir vídeo',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};
