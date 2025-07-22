
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { useAuth } from '@/contexts/AuthContext';

export type ClientInteraction = Tables<'client_interactions'>;
export type ClientInteractionInsert = TablesInsert<'client_interactions'>;
export type ClientInteractionUpdate = TablesUpdate<'client_interactions'>;

export function useClientInteractions(clientId?: string) {
  const { activeTenant, user } = useAuth();

  const query = useQuery({
    queryKey: ['client_interactions', activeTenant?.tenant_id, clientId],
    queryFn: async () => {
      if (!activeTenant?.tenant_id) {
        throw new Error('No tenant selected');
      }

      let queryBuilder = supabase
        .from('client_interactions')
        .select('*')
        .eq('tenant_id', activeTenant.tenant_id)
        .order('created_at', { ascending: false });

      if (clientId) {
        queryBuilder = queryBuilder.eq('client_id', clientId);
      }

      const { data, error } = await queryBuilder;

      if (error) throw error;
      return data as ClientInteraction[];
    },
    enabled: !!activeTenant?.tenant_id,
  });

  return {
    interactions: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useCreateClientInteraction() {
  const queryClient = useQueryClient();
  const { activeTenant, user } = useAuth();

  const mutation = useMutation({
    mutationFn: async (interaction: Omit<ClientInteractionInsert, 'tenant_id' | 'seller_id'>) => {
      if (!activeTenant?.tenant_id) {
        throw new Error('No tenant selected');
      }

      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      console.log('Creating interaction:', {
        ...interaction,
        tenant_id: activeTenant.tenant_id,
        seller_id: user.id
      });

      const { data, error } = await supabase
        .from('client_interactions')
        .insert({ 
          ...interaction, 
          tenant_id: activeTenant.tenant_id,
          seller_id: user.id
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating interaction:', error);
        throw error;
      }
      
      console.log('Interaction created successfully:', data);
      return data as ClientInteraction;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client_interactions'] });
    },
  });

  return {
    createInteraction: mutation.mutate,
    createInteractionAsync: mutation.mutateAsync,
    isCreating: mutation.isPending,
    error: mutation.error,
  };
}

export function useUpdateClientInteraction() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ id, ...updates }: ClientInteractionUpdate & { id: string }) => {
      console.log('Updating interaction:', { id, updates });

      const { data, error } = await supabase
        .from('client_interactions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating interaction:', error);
        throw error;
      }
      
      console.log('Interaction updated successfully:', data);
      return data as ClientInteraction;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client_interactions'] });
    },
  });

  return {
    updateInteraction: mutation.mutate,
    updateInteractionAsync: mutation.mutateAsync,
    isUpdating: mutation.isPending,
    error: mutation.error,
  };
}
