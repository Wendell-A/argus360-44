
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export type Position = {
  id: string;
  tenant_id: string;
  name: string;
  department_id?: string;
  description?: string;
  created_at: string;
  updated_at: string;
  department?: {
    id: string;
    name: string;
  };
};

export type PositionInsert = {
  name: string;
  department_id?: string;
  description?: string;
};

export type PositionUpdate = {
  name?: string;
  department_id?: string;
  description?: string;
};

export const usePositions = () => {
  const { activeTenant } = useAuth();

  const query = useQuery({
    queryKey: ['positions', activeTenant?.tenant_id],
    queryFn: async () => {
      if (!activeTenant?.tenant_id) {
        throw new Error('No tenant selected');
      }

      const { data, error } = await supabase
        .from('positions')
        .select(`
          *,
          department:departments!department_id(id, name)
        `)
        .eq('tenant_id', activeTenant.tenant_id)
        .order('name');

      if (error) throw error;
      return (data || []) as Position[];
    },
    enabled: !!activeTenant?.tenant_id,
  });

  return {
    positions: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
};

export const useCreatePosition = () => {
  const queryClient = useQueryClient();
  const { activeTenant } = useAuth();

  return useMutation({
    mutationFn: async (position: PositionInsert) => {
      if (!activeTenant?.tenant_id) {
        throw new Error('No tenant selected');
      }

      const { data, error } = await supabase
        .from('positions')
        .insert({
          ...position,
          tenant_id: activeTenant.tenant_id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['positions'] });
      toast.success('Cargo criado com sucesso!');
    },
    onError: (error) => {
      console.error('Error creating position:', error);
      toast.error('Erro ao criar cargo');
    },
  });
};

export const useUpdatePosition = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: PositionUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('positions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['positions'] });
      toast.success('Cargo atualizado com sucesso!');
    },
    onError: (error) => {
      console.error('Error updating position:', error);
      toast.error('Erro ao atualizar cargo');
    },
  });
};

export const useDeletePosition = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('positions')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['positions'] });
      toast.success('Cargo excluído com sucesso!');
    },
    onError: (error) => {
      console.error('Error deleting position:', error);
      toast.error('Erro ao excluir cargo');
    },
  });
};
