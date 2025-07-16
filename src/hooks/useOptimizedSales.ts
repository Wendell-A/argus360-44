
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export const useOptimizedSales = (page = 1, limit = 10, filters?: {
  status?: string;
  seller_id?: string;
  office_id?: string;
  date_from?: string;
  date_to?: string;
}) => {
  const { activeTenant } = useAuth();
  const queryClient = useQueryClient();

  // Query otimizada com paginação e filtros
  const { data, isLoading, error } = useQuery({
    queryKey: ['sales-optimized', activeTenant?.tenant_id, page, limit, filters],
    queryFn: async () => {
      if (!activeTenant?.tenant_id) return { data: [], count: 0 };

      let query = supabase
        .from('sales')
        .select(`
          id,
          sale_value,
          commission_amount,
          status,
          sale_date,
          approval_date,
          clients!inner(id, name),
          consortium_products!inner(id, name),
          profiles!sales_seller_id_fkey(id, full_name)
        `, { count: 'exact' })
        .eq('tenant_id', activeTenant.tenant_id)
        .order('created_at', { ascending: false });

      // Aplicar filtros
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.seller_id) {
        query = query.eq('seller_id', filters.seller_id);
      }
      if (filters?.office_id) {
        query = query.eq('office_id', filters.office_id);
      }
      if (filters?.date_from) {
        query = query.gte('sale_date', filters.date_from);
      }
      if (filters?.date_to) {
        query = query.lte('sale_date', filters.date_to);
      }

      // Aplicar paginação
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;
      
      if (error) throw error;
      return { data: data || [], count: count || 0 };
    },
    enabled: !!activeTenant?.tenant_id,
  });

  // Mutation otimizada para aprovar venda
  const approveSaleMutation = useMutation({
    mutationFn: async (saleId: string) => {
      const { data, error } = await supabase
        .from('sales')
        .update({
          status: 'approved',
          approval_date: new Date().toISOString().split('T')[0]
        })
        .eq('id', saleId)
        .eq('tenant_id', activeTenant?.tenant_id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-optimized'] });
      queryClient.invalidateQueries({ queryKey: ['commissions'] });
      toast.success('Venda aprovada com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao aprovar venda:', error);
      toast.error('Erro ao aprovar venda');
    }
  });

  return {
    sales: data?.data || [],
    totalCount: data?.count || 0,
    isLoading,
    error,
    approveSale: approveSaleMutation.mutateAsync,
    isApproving: approveSaleMutation.isPending
  };
};
