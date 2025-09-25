
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
        .eq('tenant_id', activeTenant.tenant_id)
        .eq('is_current', true);

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

export function useClientFunnelHistory(clientId?: string) {
  const { activeTenant } = useAuth();

  const query = useQuery({
    queryKey: ['client_funnel_history', activeTenant?.tenant_id, clientId],
    queryFn: async () => {
      if (!activeTenant?.tenant_id || !clientId) {
        throw new Error('No tenant or client selected');
      }

      const { data, error } = await supabase
        .from('client_funnel_position')
        .select(`
          *,
          sales_funnel_stages(id, name, color, order_index)
        `)
        .eq('tenant_id', activeTenant.tenant_id)
        .eq('client_id', clientId)
        .order('entered_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!activeTenant?.tenant_id && !!clientId,
  });

  return {
    history: query.data || [],
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

      console.log('🔄 Atualizando posição no funil:', data);
      console.log('🏢 Tenant ativo:', activeTenant?.tenant_id);

      // Primeiro, marcar a posição atual como não atual e definir data de saída
      const { error: updateError } = await supabase
        .from('client_funnel_position')
        .update({
          is_current: false,
          exited_at: new Date().toISOString(),
        })
        .eq('tenant_id', activeTenant.tenant_id)
        .eq('client_id', data.clientId)
        .eq('is_current', true);

      if (updateError) {
        console.error('Error updating previous position:', updateError);
        throw updateError;
      }

      // Criar nova posição atual
      const { data: result, error } = await supabase
        .from('client_funnel_position')
        .insert({
          tenant_id: activeTenant.tenant_id,
          client_id: data.clientId,
          stage_id: data.stageId,
          probability: data.probability || 10,
          expected_value: data.expectedValue || 0,
          notes: data.notes || '',
          entered_at: new Date().toISOString(),
          is_current: true,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating new position:', error);
        throw error;
      }

      console.log('Position updated successfully:', result);
      return result;
    },
    onSuccess: (result) => {
      console.log('✅ Posição no funil atualizada com sucesso:', result);
      
      // Invalidar queries para atualizar a interface
      queryClient.invalidateQueries({ queryKey: ['client_funnel_positions'] });
      queryClient.invalidateQueries({ queryKey: ['client_funnel_history'] });
      queryClient.invalidateQueries({ queryKey: ['sales_funnel_stages'] });
      
      console.log('🔄 Queries invalidadas para atualização da interface');
    },
    onError: (error) => {
      console.error('❌ Erro na mutação do funil:', error);
      console.error('❌ Detalhes:', {
        message: error?.message,
        stack: error?.stack
      });
    },
  });

  return {
    updatePosition: mutation.mutate,
    updatePositionAsync: mutation.mutateAsync,
    isUpdating: mutation.isPending,
    error: mutation.error,
  };
}

export function useCreateDefaultFunnelStages() {
  const queryClient = useQueryClient();
  const { activeTenant } = useAuth();

  const mutation = useMutation({
    mutationFn: async () => {
      if (!activeTenant?.tenant_id) {
        throw new Error('No tenant selected');
      }

      // Verificar se já existem fases
      const { data: existingStages } = await supabase
        .from('sales_funnel_stages')
        .select('id')
        .eq('tenant_id', activeTenant.tenant_id)
        .limit(1);

      if (existingStages && existingStages.length > 0) {
        return existingStages; // Já existem fases
      }

      // Criar fases padrão
      const defaultStages = [
        {
          tenant_id: activeTenant.tenant_id,
          name: 'Lead',
          description: 'Potenciais clientes identificados',
          color: '#3b82f6',
          order_index: 1,
          is_active: true,
        },
        {
          tenant_id: activeTenant.tenant_id,
          name: 'Qualificado',
          description: 'Clientes com interesse confirmado',
          color: '#f59e0b',
          order_index: 2,
          is_active: true,
        },
        {
          tenant_id: activeTenant.tenant_id,
          name: 'Proposta',
          description: 'Proposta enviada e em análise',
          color: '#8b5cf6',
          order_index: 3,
          is_active: true,
        },
        {
          tenant_id: activeTenant.tenant_id,
          name: 'Negociação',
          description: 'Em processo de negociação',
          color: '#ef4444',
          order_index: 4,
          is_active: true,
        },
        {
          tenant_id: activeTenant.tenant_id,
          name: 'Fechado',
          description: 'Venda concluída com sucesso',
          color: '#10b981',
          order_index: 5,
          is_active: true,
        },
      ];

      const { data, error } = await supabase
        .from('sales_funnel_stages')
        .insert(defaultStages)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales_funnel_stages'] });
    },
  });

  return {
    createDefaultStages: mutation.mutate,
    createDefaultStagesAsync: mutation.mutateAsync,
    isCreating: mutation.isPending,
    error: mutation.error,
  };
}
