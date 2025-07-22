
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { useAuth } from '@/contexts/AuthContext';

export type AutomatedTask = Tables<'automated_tasks'>;
export type AutomatedTaskInsert = TablesInsert<'automated_tasks'>;
export type AutomatedTaskUpdate = TablesUpdate<'automated_tasks'>;

export function useAutomatedTasks(sellerId?: string) {
  const { activeTenant } = useAuth();

  const query = useQuery({
    queryKey: ['automated_tasks', activeTenant?.tenant_id, sellerId],
    queryFn: async () => {
      if (!activeTenant?.tenant_id) {
        throw new Error('No tenant selected');
      }

      let queryBuilder = supabase
        .from('automated_tasks')
        .select(`
          *,
          clients!inner(name, phone, email)
        `)
        .eq('tenant_id', activeTenant.tenant_id)
        .order('due_date', { ascending: true });

      if (sellerId) {
        queryBuilder = queryBuilder.eq('seller_id', sellerId);
      }

      const { data, error } = await queryBuilder;

      if (error) throw error;
      return data;
    },
    enabled: !!activeTenant?.tenant_id,
  });

  return {
    tasks: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useCreateAutomatedTask() {
  const queryClient = useQueryClient();
  const { activeTenant } = useAuth();

  const mutation = useMutation({
    mutationFn: async (task: Omit<AutomatedTaskInsert, 'tenant_id'>) => {
      if (!activeTenant?.tenant_id) {
        throw new Error('No tenant selected');
      }

      const { data, error } = await supabase
        .from('automated_tasks')
        .insert({ ...task, tenant_id: activeTenant.tenant_id })
        .select()
        .single();

      if (error) throw error;
      return data as AutomatedTask;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automated_tasks'] });
    },
  });

  return {
    createTask: mutation.mutate,
    createTaskAsync: mutation.mutateAsync,
    isCreating: mutation.isPending,
    error: mutation.error,
  };
}

export function useUpdateAutomatedTask() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ id, ...updates }: AutomatedTaskUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('automated_tasks')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as AutomatedTask;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automated_tasks'] });
    },
  });

  return {
    updateTask: mutation.mutate,
    updateTaskAsync: mutation.mutateAsync,
    isUpdating: mutation.isPending,
    error: mutation.error,
  };
}
