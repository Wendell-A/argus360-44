
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { useAuth } from '@/contexts/AuthContext';

export type Commission = Tables<'commissions'>;
export type CommissionInsert = TablesInsert<'commissions'>;
export type CommissionUpdate = TablesUpdate<'commissions'>;

export function useCommissions() {
  const { activeTenant } = useAuth();
  const queryClient = useQueryClient();

  const commissionsQuery = useQuery({
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
            sale_value,
            client_id,
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

  const updateCommissionMutation = useMutation({
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

  const approveCommissionMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('commissions')
        .update({ 
          status: 'approved',
          approval_date: new Date().toISOString().split('T')[0]
        })
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

  const payCommissionMutation = useMutation({
    mutationFn: async ({ id, payment_method, payment_reference }: { 
      id: string; 
      payment_method: string; 
      payment_reference?: string; 
    }) => {
      const { data, error } = await supabase
        .from('commissions')
        .update({ 
          status: 'paid',
          payment_date: new Date().toISOString().split('T')[0],
          payment_method,
          payment_reference
        })
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
    commissions: commissionsQuery.data || [],
    isLoading: commissionsQuery.isLoading,
    error: commissionsQuery.error,
    updateCommission: updateCommissionMutation.mutate,
    approveCommission: approveCommissionMutation.mutate,
    payCommission: payCommissionMutation.mutate,
    isUpdating: updateCommissionMutation.isPending,
    isApproving: approveCommissionMutation.isPending,
    isPaying: payCommissionMutation.isPending,
  };
}
