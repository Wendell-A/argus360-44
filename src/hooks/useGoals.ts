
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export type Goal = {
  id: string;
  tenant_id: string;
  office_id?: string;
  user_id?: string;
  goal_type: 'office' | 'individual';
  target_amount: number;
  current_amount: number;
  period_start: string;
  period_end: string;
  status: 'active' | 'completed' | 'cancelled';
  description?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  offices?: { name: string };
  profiles?: { full_name: string; email: string };
  creator?: { full_name: string };
};

export type GoalInsert = {
  office_id?: string;
  user_id?: string;
  goal_type: 'office' | 'individual';
  target_amount: number;
  period_start: string;
  period_end: string;
  status: 'active' | 'completed' | 'cancelled';
  description?: string;
};

export type GoalStats = {
  totalGoals: number;
  officeGoals: number;
  individualGoals: number;
  completedGoals: number;
  averageProgress: number;
};

export const useGoals = () => {
  const { activeTenant } = useAuth();

  const query = useQuery({
    queryKey: ['goals', activeTenant?.tenant_id],
    queryFn: async () => {
      if (!activeTenant?.tenant_id) {
        throw new Error('No tenant selected');
      }

      const { data, error } = await supabase
        .from('goals')
        .select(`
          *,
          offices!office_id(name),
          profiles!user_id(full_name, email),
          creator:profiles!created_by(full_name)
        `)
        .eq('tenant_id', activeTenant.tenant_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as Goal[];
    },
    enabled: !!activeTenant?.tenant_id,
  });

  return {
    goals: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
};

export const useCreateGoal = () => {
  const queryClient = useQueryClient();
  const { activeTenant, user } = useAuth();

  return useMutation({
    mutationFn: async (goal: GoalInsert) => {
      if (!activeTenant?.tenant_id) {
        throw new Error('No tenant selected');
      }

      const { data, error } = await supabase
        .from('goals')
        .insert({
          ...goal,
          tenant_id: activeTenant.tenant_id,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      toast.success('Meta criada com sucesso!');
    },
    onError: (error) => {
      console.error('Error creating goal:', error);
      toast.error('Erro ao criar meta');
    },
  });
};

export const useUpdateGoal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Goal> & { id: string }) => {
      const { data, error } = await supabase
        .from('goals')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      toast.success('Meta atualizada com sucesso!');
    },
    onError: (error) => {
      console.error('Error updating goal:', error);
      toast.error('Erro ao atualizar meta');
    },
  });
};

export const useDeleteGoal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      toast.success('Meta excluída com sucesso!');
    },
    onError: (error) => {
      console.error('Error deleting goal:', error);
      toast.error('Erro ao excluir meta');
    },
  });
};

export const useGoalStats = () => {
  const { activeTenant } = useAuth();

  return useQuery({
    queryKey: ['goal-stats', activeTenant?.tenant_id],
    queryFn: async (): Promise<GoalStats> => {
      if (!activeTenant?.tenant_id) {
        throw new Error('No tenant selected');
      }

      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('tenant_id', activeTenant.tenant_id)
        .eq('status', 'active');

      if (error) throw error;

      const goals = data || [];
      const stats: GoalStats = {
        totalGoals: goals.length,
        officeGoals: goals.filter(g => g.goal_type === 'office').length,
        individualGoals: goals.filter(g => g.goal_type === 'individual').length,
        completedGoals: goals.filter(g => g.current_amount >= g.target_amount).length,
        averageProgress: goals.length > 0 ? 
          goals.reduce((sum, g) => sum + (g.current_amount / g.target_amount), 0) / goals.length * 100 : 0,
      };

      return stats;
    },
    enabled: !!activeTenant?.tenant_id,
  });
};
