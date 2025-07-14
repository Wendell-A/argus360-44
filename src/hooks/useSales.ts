
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { useAuth } from '@/contexts/AuthContext';

export type Sale = Tables<'sales'>;
export type SaleInsert = TablesInsert<'sales'>;
export type SaleUpdate = TablesUpdate<'sales'>;

export function useSales() {
  const { currentTenant } = useAuth();

  return useQuery({
    queryKey: ['sales', currentTenant?.tenant_id],
    queryFn: async () => {
      if (!currentTenant?.tenant_id) {
        throw new Error('No tenant selected');
      }

      const { data, error } = await supabase
        .from('sales')
        .select(`
          *,
          clients:client_id(name, document),
          consortium_products:product_id(name, category)
        `)
        .eq('tenant_id', currentTenant.tenant_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!currentTenant?.tenant_id,
  });
}

export function useCreateSale() {
  const queryClient = useQueryClient();
  const { currentTenant } = useAuth();

  return useMutation({
    mutationFn: async (sale: Omit<SaleInsert, 'tenant_id'>) => {
      if (!currentTenant?.tenant_id) {
        throw new Error('No tenant selected');
      }

      const { data, error } = await supabase
        .from('sales')
        .insert({ ...sale, tenant_id: currentTenant.tenant_id })
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
}

export function useUpdateSale() {
  const queryClient = useQueryClient();

  return useMutation({
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
}
