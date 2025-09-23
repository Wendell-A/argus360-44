import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { useAuth } from '@/contexts/AuthContext';
import { maskObjectSensitiveData } from '@/lib/security/DataMasking';

export type Client = Tables<'clients'>;
export type ClientInsert = TablesInsert<'clients'>;
export type ClientUpdate = TablesUpdate<'clients'>;

export interface MaskedClient extends Omit<Client, 'document' | 'email' | 'phone' | 'monthly_income' | 'address' | 'notes'> {
  document: string;
  email?: string;
  phone?: string;
  monthly_income?: number | null;
  address?: any;
  notes?: string;
  data_access_level?: 'full' | 'masked';
}

export function useClientsMasked() {
  const { activeTenant } = useAuth();

  const query = useQuery({
    queryKey: ['clients-masked', activeTenant?.tenant_id],
    queryFn: async (): Promise<MaskedClient[]> => {
      if (!activeTenant?.tenant_id) {
        throw new Error('No tenant selected');
      }

      // Buscar clientes usando política RLS existente
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('tenant_id', activeTenant.tenant_id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Aplicar mascaramento usando a biblioteca de segurança
      const maskedClients: MaskedClient[] = (data || []).map(client => {
        const masked = maskObjectSensitiveData(client, false) as MaskedClient;
        masked.data_access_level = 'masked'; // Indicar que os dados foram mascarados
        return masked;
      });

      return maskedClients;
    },
    enabled: !!activeTenant?.tenant_id,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
  });

  return {
    clients: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useClientMaskedById(clientId: string) {
  const { activeTenant } = useAuth();

  const query = useQuery({
    queryKey: ['client-masked', clientId, activeTenant?.tenant_id],
    queryFn: async (): Promise<any> => {
      if (!activeTenant?.tenant_id || !clientId) {
        throw new Error('Invalid parameters');
      }

      // Usar função SQL segura para mascaramento contextual
      const { data, error } = await supabase.rpc('get_client_data_masked', {
        p_client_id: clientId,
        p_tenant_id: activeTenant.tenant_id
      });

      if (error) throw error;

      // Verificar se houve erro na função
      if (typeof data === 'object' && data !== null && 'error' in data) {
        throw new Error(String((data as any).error));
      }

      return data;
    },
    enabled: !!activeTenant?.tenant_id && !!clientId,
    staleTime: 2 * 60 * 1000, // 2 minutos para dados individuais
    gcTime: 5 * 60 * 1000, // 5 minutos
  });

  return {
    client: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    canViewFullData: query.data?.data_access_level === 'full',
  };
}

export function useCanViewFullClientData(clientId: string) {
  const query = useQuery({
    queryKey: ['can-view-full-client', clientId],
    queryFn: async (): Promise<boolean> => {
      if (!clientId) return false;

      const { data, error } = await supabase.rpc('can_view_full_client_data', {
        p_client_id: clientId
      });

      if (error) {
        console.error('Erro ao verificar permissões:', error);
        return false;
      }

      return data === true;
    },
    enabled: !!clientId,
    staleTime: 30 * 1000, // 30 segundos
    gcTime: 2 * 60 * 1000, // 2 minutos
  });

  return {
    canViewFullData: query.data || false,
    isLoading: query.isLoading,
    error: query.error,
  };
}

// Manter compatibilidade com hooks de criação/atualização existentes
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['clients-masked'] });
      queryClient.invalidateQueries({ queryKey: ['contextual-clients'] });
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
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['clients-masked'] });
      queryClient.invalidateQueries({ queryKey: ['contextual-clients'] });
      queryClient.invalidateQueries({ queryKey: ['client-masked', data.id] });
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
      return id;
    },
    onSuccess: (deletedId) => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['clients-masked'] });
      queryClient.invalidateQueries({ queryKey: ['contextual-clients'] });
      queryClient.invalidateQueries({ queryKey: ['client-masked', deletedId] });
    },
  });

  return {
    deleteClient: mutation.mutate,
    deleteClientAsync: mutation.mutateAsync,
    isDeleting: mutation.isPending,
    error: mutation.error,
  };
}