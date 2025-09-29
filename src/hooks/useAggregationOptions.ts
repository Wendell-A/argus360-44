import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface AggregationOption {
  id: string;
  name: string;
  type: 'product' | 'office' | 'seller';
}

export function useAggregationOptions() {
  const { activeTenant } = useAuth();

  const products = useQuery({
    queryKey: ['aggregation-products', activeTenant?.tenant_id],
    queryFn: async () => {
      if (!activeTenant?.tenant_id) return [];
      
      const { data, error } = await supabase
        .from('consortium_products')
        .select('id, name')
        .eq('tenant_id', activeTenant.tenant_id)
        .order('name');
      
      if (error) throw error;
      
      return data?.map((product): AggregationOption => ({
        id: product.id,
        name: product.name,
        type: 'product',
      })) || [];
    },
    enabled: !!activeTenant?.tenant_id,
    staleTime: 10 * 60 * 1000, // 10 minutos
  });

  const offices = useQuery({
    queryKey: ['aggregation-offices', activeTenant?.tenant_id],
    queryFn: async () => {
      if (!activeTenant?.tenant_id) return [];
      
      const { data, error } = await supabase
        .from('offices')
        .select('id, name')
        .eq('tenant_id', activeTenant.tenant_id)
        .eq('active', true)
        .order('name');
      
      if (error) throw error;
      
      return data?.map((office): AggregationOption => ({
        id: office.id,
        name: office.name,
        type: 'office',
      })) || [];
    },
    enabled: !!activeTenant?.tenant_id,
    staleTime: 10 * 60 * 1000,
  });

  const sellers = useQuery({
    queryKey: ['aggregation-sellers', activeTenant?.tenant_id],
    queryFn: async () => {
      if (!activeTenant?.tenant_id) return [];
      
      const { data, error } = await supabase
        .from('tenant_users')
        .select(`
          user_id,
          profiles!inner(full_name)
        `)
        .eq('tenant_id', activeTenant.tenant_id)
        .eq('active', true)
        .not('profiles.full_name', 'is', null)
        .order('profiles(full_name)');
      
      if (error) throw error;
      
      return data?.map((seller): AggregationOption => ({
        id: seller.user_id,
        name: (seller.profiles as any)?.full_name || 'Usuário sem nome',
        type: 'seller',
      })) || [];
    },
    enabled: !!activeTenant?.tenant_id,
    staleTime: 10 * 60 * 1000,
  });

  return {
    products: products.data || [],
    offices: offices.data || [],
    sellers: sellers.data || [],
    isLoading: products.isLoading || offices.isLoading || sellers.isLoading,
    refetch: () => {
      products.refetch();
      offices.refetch();
      sellers.refetch();
    },
  };
}