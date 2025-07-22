
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { useAuth } from '@/contexts/AuthContext';

export type SalesFunnelStage = Tables<'sales_funnel_stages'>;
export type ClientFunnelPosition = Tables<'client_funnel_position'>;
export type ClientFunnelPositionInsert = TablesInsert<'client_funnel_position'>;

export function useSalesFunnelStages() {
  const { activeTenant } = useAuth();

  const query = useQuery({
    queryKey: ['sales_funnel_stages', activeTenant?.tenant_id],
    queryFn: async () => {
      if (!activeTenant?.tenant_id) {
        throw new Error('No tenant selected');
      }

      const { data, error } = await supabase
        .from('sales_funnel_stages')
        .select('*')
        .eq('tenant_id', activeTenant.tenant_id)
        .eq('is_active', true)
        .order('order_index', { ascending: true });

      if (error) throw error;
      return data as SalesFunnelStage[];
    },
    enabled: !!activeTenant?.tenant_id,
  });

  return {
    stages: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useClientFunnelPositions() {
  const { activeTenant } = useAuth();

  const query = useQuery({
    queryKey: ['client_funnel_positions', activeTenant?.tenant_id],
    queryFn: async () => {
      if (!activeTenant?.tenant_id) {
        throw new Error('No tenant selected');
      }

      const { data, error } = await supabase
        .from('client_funnel_position')
        .select(`
          *,
          clients(id, name, email, phone, classification, status),
          sales_funnel_stages(id, name, color, order_index)
        `)
        .eq('tenant_id', activeTenant.tenant_id);

      if (error) throw error;
      return data;
    },
    enabled: !!activeTenant?.tenant_id,
  });

  return {
    positions: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useUpdateClientFunnelPosition() {
  const queryClient = useQueryClient();
  const { activeTenant } = useAuth();

  const mutation = useMutation({
    mutationFn: async (data: { clientId: string; stageId: string; probability?: number; expectedValue?: number; notes?: string }) => {
      if (!activeTenant?.tenant_id) {
        throw new Error('No tenant selected');
      }

      const { data: result, error } = await supabase
        .from('client_funnel_position')
        .upsert({
          tenant_id: activeTenant.tenant_id,
          client_id: data.clientId,
          stage_id: data.stageId,
          probability: data.probability || 0,
          expected_value: data.expectedValue || 0,
          notes: data.notes || '',
          entered_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client_funnel_positions'] });
    },
  });

  return {
    updatePosition: mutation.mutate,
    updatePositionAsync: mutation.mutateAsync,
    isUpdating: mutation.isPending,
    error: mutation.error,
  };
}
