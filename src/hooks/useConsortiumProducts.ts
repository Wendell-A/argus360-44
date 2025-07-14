
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { useAuth } from '@/contexts/AuthContext';

export type ConsortiumProduct = Tables<'consortium_products'>;
export type ConsortiumProductInsert = TablesInsert<'consortium_products'>;
export type ConsortiumProductUpdate = TablesUpdate<'consortium_products'>;

export function useConsortiumProducts() {
  const { activeTenant } = useAuth();

  return useQuery({
    queryKey: ['consortium_products', activeTenant?.tenant_id],
    queryFn: async () => {
      if (!activeTenant?.tenant_id) {
        throw new Error('No tenant selected');
      }

      const { data, error } = await supabase
        .from('consortium_products')
        .select('*')
        .eq('tenant_id', activeTenant.tenant_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ConsortiumProduct[];
    },
    enabled: !!activeTenant?.tenant_id,
  });
}

export function useCreateConsortiumProduct() {
  const queryClient = useQueryClient();
  const { activeTenant } = useAuth();

  return useMutation({
    mutationFn: async (product: Omit<ConsortiumProductInsert, 'tenant_id'>) => {
      if (!activeTenant?.tenant_id) {
        throw new Error('No tenant selected');
      }

      const { data, error } = await supabase
        .from('consortium_products')
        .insert({ ...product, tenant_id: activeTenant.tenant_id })
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
