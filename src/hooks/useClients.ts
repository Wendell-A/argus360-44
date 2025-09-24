
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { useAuth } from '@/contexts/AuthContext';

export type Client = Tables<'clients'>;
export type ClientInsert = TablesInsert<'clients'>;
export type ClientUpdate = TablesUpdate<'clients'>;

export function useClients() {
  const { activeTenant } = useAuth();

  const query = useQuery({
    queryKey: ['clients', activeTenant?.tenant_id],
    queryFn: async () => {
      if (!activeTenant?.tenant_id) {
        throw new Error('No tenant selected');
      }

      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('tenant_id', activeTenant.tenant_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Client[];
    },
    enabled: !!activeTenant?.tenant_id,
  });

  return {
    clients: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useCreateClient() {
  const queryClient = useQueryClient();
  const { activeTenant } = useAuth();

  const mutation = useMutation({
    mutationFn: async (client: Omit<ClientInsert, 'tenant_id'>) => {
      if (!activeTenant?.tenant_id) {
        throw new Error('No tenant selected');
      }

      const { data, error } = await supabase
        .from('clients')
        .insert({ ...client, tenant_id: activeTenant.tenant_id })
        .select()
        .single();

      if (error) throw error;
      return data as Client;
    },
    onSuccess: (data) => {
      console.log('✅ Cliente criado com sucesso:', data.name, 'Data de nascimento:', data.birth_date);
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['birthday_clients'] });
      queryClient.invalidateQueries({ queryKey: ['client_interactions'] });
    },
  });

  return {
    createClient: mutation.mutate,
    createClientAsync: mutation.mutateAsync,
    isCreating: mutation.isPending,
    error: mutation.error,
  };
}

export function useUpdateClient() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ id, ...updates }: ClientUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('clients')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Client;
    },
    onSuccess: (data) => {
      console.log('✅ Cliente atualizado com sucesso:', data.name, 'Data de nascimento:', data.birth_date);
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['birthday_clients'] });
      queryClient.invalidateQueries({ queryKey: ['client_interactions'] });
    },
  });

  return {
    updateClient: mutation.mutate,
    updateClientAsync: mutation.mutateAsync,
    isUpdating: mutation.isPending,
    error: mutation.error,
  };
}

export function useDeleteClient() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      console.log('✅ Cliente excluído com sucesso');
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['birthday_clients'] });
      queryClient.invalidateQueries({ queryKey: ['client_interactions'] });
    },
  });

  return {
    deleteClient: mutation.mutate,
    deleteClientAsync: mutation.mutateAsync,
    isDeleting: mutation.isPending,
    error: mutation.error,
  };
}
