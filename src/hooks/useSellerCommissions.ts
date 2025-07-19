import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SellerCommission {
  id: string;
  tenant_id: string;
  seller_id: string;
  product_id: string;
  commission_rate: number;
  min_sale_value?: number;
  max_sale_value?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface CreateSellerCommissionData {
  seller_id: string;
  product_id: string;
  commission_rate: number;
  min_sale_value?: number;
  max_sale_value?: number;
  is_active?: boolean;
}

export const useSellerCommissions = (tenantId?: string) => {
  return useQuery({
    queryKey: ['seller-commissions', tenantId],
    queryFn: async () => {
      let query = supabase
        .from('seller_commissions')
        .select('*');

      if (tenantId) {
        query = query.eq('tenant_id', tenantId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching seller commissions:', error);
        throw error;
      }

      return data || [];
    },
    enabled: !!tenantId,
  });
};

export const useCreateSellerCommission = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ tenantId, data }: { tenantId: string; data: CreateSellerCommissionData }) => {
      const { data: result, error } = await supabase
        .from('seller_commissions')
        .insert({
          tenant_id: tenantId,
          ...data,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating seller commission:', error);
        throw error;
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-commissions'] });
      toast.success('Comissão de vendedor cadastrada com sucesso!');
    },
    onError: (error) => {
      console.error('Error creating seller commission:', error);
      toast.error('Erro ao cadastrar comissão de vendedor');
    },
  });
};

export const useUpdateSellerCommission = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateSellerCommissionData> }) => {
      const { data: result, error } = await supabase
        .from('seller_commissions')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating seller commission:', error);
        throw error;
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-commissions'] });
      toast.success('Comissão de vendedor atualizada com sucesso!');
    },
    onError: (error) => {
      console.error('Error updating seller commission:', error);
      toast.error('Erro ao atualizar comissão de vendedor');
    },
  });
};

export const useDeleteSellerCommission = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('seller_commissions')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting seller commission:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-commissions'] });
      toast.success('Comissão de vendedor removida com sucesso!');
    },
    onError: (error) => {
      console.error('Error deleting seller commission:', error);
      toast.error('Erro ao remover comissão de vendedor');
    },
  });
};

// Hook para buscar comissões de um vendedor específico por produto
export const useSellerCommissionByProduct = (sellerId: string, productId: string) => {
  return useQuery({
    queryKey: ['seller-commission', sellerId, productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('seller_commissions')
        .select('*')
        .eq('seller_id', sellerId)
        .eq('product_id', productId)
        .eq('is_active', true)
        .maybeSingle();

      if (error) {
        console.error('Error fetching seller commission:', error);
        throw error;
      }

      return data;
    },
    enabled: !!sellerId && !!productId,
  });
};