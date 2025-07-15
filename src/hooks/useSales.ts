
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { useAuth } from '@/contexts/AuthContext';

export type Sale = Tables<'sales'>;
export type SaleInsert = TablesInsert<'sales'>;
export type SaleUpdate = TablesUpdate<'sales'>;

export function useSales() {
  const { activeTenant } = useAuth();

  const query = useQuery({
    queryKey: ['sales', activeTenant?.tenant_id],
    queryFn: async () => {
      if (!activeTenant?.tenant_id) {
        throw new Error('No tenant selected');
      }

      const { data, error } = await supabase
        .from('sales')
        .select(`
          *,
          clients:client_id(name, document),
          consortium_products:product_id(name, category)
        `)
        .eq('tenant_id', activeTenant.tenant_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!activeTenant?.tenant_id,
  });

  return {
    sales: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useCreateSale() {
  const queryClient = useQueryClient();
  const { activeTenant } = useAuth();

  const mutation = useMutation({
    mutationFn: async (sale: Omit<SaleInsert, 'tenant_id'>) => {
      if (!activeTenant?.tenant_id) {
        throw new Error('No tenant selected');
      }

      const { data, error } = await supabase
        .from('sales')
        .insert({ ...sale, tenant_id: activeTenant.tenant_id })
        .select()
        .single();

      if (error) throw error;
      return data as Sale;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['commissions'] });
    },
  });

  return {
    createSale: mutation.mutate,
    createSaleAsync: mutation.mutateAsync,
    isCreating: mutation.isPending,
    error: mutation.error,
  };
}

export function useUpdateSale() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ id, ...updates }: SaleUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('sales')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Sale;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['commissions'] });
    },
  });

  return {
    updateSale: mutation.mutate,
    updateSaleAsync: mutation.mutateAsync,
    isUpdating: mutation.isPending,
    error: mutation.error,
  };
}

export function useDeleteSale() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('sales')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['commissions'] });
    },
  });

  return {
    deleteSale: mutation.mutate,
    deleteSaleAsync: mutation.mutateAsync,
    isDeleting: mutation.isPending,
    error: mutation.error,
  };
}
