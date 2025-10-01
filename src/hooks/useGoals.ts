
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export type Goal = {
  id: string;
  tenant_id: string;
  office_id?: string;
  user_id?: string;
  goal_type: 'office' | 'individual' | 'conversion';
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
  office_id?: string | null;
  user_id?: string | null;
  goal_type: 'office' | 'individual' | 'conversion';
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
  conversionGoals: number;
  completedGoals: number;
  averageProgress: number;
};

interface GoalFilters {
  dateRange?: 'today' | 'week' | 'month' | 'previous_month' | 'current_year' | 'previous_year' | 'all_periods';
  office?: string;
}

export const useGoals = (filters: GoalFilters = {}) => {
  const { activeTenant } = useAuth();

  const query = useQuery({
    queryKey: ['goals', activeTenant?.tenant_id, filters],
    queryFn: async () => {
      if (!activeTenant?.tenant_id) {
        throw new Error('No tenant selected');
      }

      // Calcular datas baseadas no filtro para filtrar metas por período
      const getDateRange = () => {
        if (!filters.dateRange || filters.dateRange === 'all_periods') return { start: null, end: null };
        
        const now = new Date();
        switch (filters.dateRange) {
          case 'today':
            return {
              start: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
              end: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
            };
          case 'week':
            const weekStart = new Date(now);
            weekStart.setDate(now.getDate() - now.getDay());
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 7);
            return { start: weekStart, end: weekEnd };
          case 'month':
            return {
              start: new Date(now.getFullYear(), now.getMonth(), 1),
              end: new Date(now.getFullYear(), now.getMonth() + 1, 1)
            };
          case 'previous_month':
            return {
              start: new Date(now.getFullYear(), now.getMonth() - 1, 1),
              end: new Date(now.getFullYear(), now.getMonth(), 1)
            };
          case 'current_year':
            return {
              start: new Date(now.getFullYear(), 0, 1),
              end: new Date(now.getFullYear() + 1, 0, 1)
            };
          case 'previous_year':
            return {
              start: new Date(now.getFullYear() - 1, 0, 1),
              end: new Date(now.getFullYear(), 0, 1)
            };
          default:
            return { start: null, end: null };
        }
      };

      const dateRange = getDateRange();

      let query = supabase
        .from('goals')
        .select(`
          *,
          offices!office_id(name),
          profiles!user_id(full_name, email),
          creator:profiles!created_by(full_name)
        `)
        .eq('tenant_id', activeTenant.tenant_id);

      // Aplicar filtros de data se especificados (metas que se sobrepõem ao período)
      if (dateRange.start && dateRange.end) {
        query = query.or(`and(period_start.lte.${dateRange.end.toISOString().split('T')[0]},period_end.gte.${dateRange.start.toISOString().split('T')[0]})`);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      let goals = (data || []) as Goal[];

      // Aplicar filtros adicionais
      if (filters.office && filters.office !== 'all') {
        goals = goals.filter(goal => 
          goal.offices?.name === filters.office ||
          goal.office_id === filters.office
        );
      }

      return goals;
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
        conversionGoals: goals.filter(g => g.goal_type === 'conversion').length,
        completedGoals: goals.filter(g => g.current_amount >= g.target_amount).length,
        averageProgress: goals.length > 0 ? 
          goals.reduce((sum, g) => sum + (g.current_amount / g.target_amount), 0) / goals.length * 100 : 0,
      };

      return stats;
    },
    enabled: !!activeTenant?.tenant_id,
  });
};
