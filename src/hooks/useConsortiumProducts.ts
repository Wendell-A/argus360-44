
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { useAuth } from '@/contexts/AuthContext';

export type ConsortiumProduct = Tables<'consortium_products'>;
export type ConsortiumProductInsert = TablesInsert<'consortium_products'>;
export type ConsortiumProductUpdate = TablesUpdate<'consortium_products'>;

export function useConsortiumProducts() {
  const { currentTenant } = useAuth();

  return useQuery({
    queryKey: ['consortium_products', currentTenant?.tenant_id],
    queryFn: async () => {
      if (!currentTenant?.tenant_id) {
        throw new Error('No tenant selected');
      }

      const { data, error } = await supabase
        .from('consortium_products')
        .select('*')
        .eq('tenant_id', currentTenant.tenant_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ConsortiumProduct[];
    },
    enabled: !!currentTenant?.tenant_id,
  });
}

export function useCreateConsortiumProduct() {
  const queryClient = useQueryClient();
  const { currentTenant } = useAuth();

  return useMutation({
    mutationFn: async (product: Omit<ConsortiumProductInsert, 'tenant_id'>) => {
      if (!currentTenant?.tenant_id) {
        throw new Error('No tenant selected');
      }

      const { data, error } = await supabase
        .from('consortium_products')
        .insert({ ...product, tenant_id: currentTenant.tenant_id })
        .select()
        .single();

      if (error) throw error;
      return data as ConsortiumProduct;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consortium_products'] });
    },
  });
}

export function useUpdateConsortiumProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: ConsortiumProductUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('consortium_products')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as ConsortiumProduct;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consortium_products'] });
    },
  });
}

export function useDeleteConsortiumProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('consortium_products')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consortium_products'] });
    },
  });
}
