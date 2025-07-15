
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { useAuth } from '@/contexts/AuthContext';

export type Commission = Tables<'commissions'>;
export type CommissionInsert = TablesInsert<'commissions'>;
export type CommissionUpdate = TablesUpdate<'commissions'>;

export function useCommissions() {
  const { activeTenant } = useAuth();

  const query = useQuery({
    queryKey: ['commissions', activeTenant?.tenant_id],
    queryFn: async () => {
      if (!activeTenant?.tenant_id) {
        throw new Error('No tenant selected');
      }

      const { data, error } = await supabase
        .from('commissions')
        .select(`
          *,
          sales:sale_id(
            contract_number,
            sale_value,
            clients:client_id(name)
          )
        `)
        .eq('tenant_id', activeTenant.tenant_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!activeTenant?.tenant_id,
  });

  return {
    commissions: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useUpdateCommission() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ id, ...updates }: CommissionUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('commissions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Commission;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commissions'] });
    },
  });

  return {
    updateCommission: mutation.mutate,
    updateCommissionAsync: mutation.mutateAsync,
    isUpdating: mutation.isPending,
    error: mutation.error,
  };
}

export function useCommissionStats() {
  const { activeTenant } = useAuth();

  const query = useQuery({
    queryKey: ['commission_stats', activeTenant?.tenant_id],
    queryFn: async () => {
      if (!activeTenant?.tenant_id) {
        throw new Error('No tenant selected');
      }

      const { data, error } = await supabase
        .from('commissions')
        .select('status, commission_amount')
        .eq('tenant_id', activeTenant.tenant_id);

      if (error) throw error;

      const stats = data.reduce((acc, commission) => {
        acc.total += Number(commission.commission_amount);
        acc.byStatus[commission.status || 'pending'] = 
          (acc.byStatus[commission.status || 'pending'] || 0) + Number(commission.commission_amount);
        return acc;
      }, {
        total: 0,
        byStatus: {} as Record<string, number>
      });

      return stats;
    },
    enabled: !!activeTenant?.tenant_id,
  });

  return {
    stats: query.data,
    isLoading: query.isLoading,
    error: query.error,
  };
}
