import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface EnhancedSellerCommission {
  id: string;
  tenant_id: string;
  seller_id: string | null;
  product_id: string;
  commission_rate: number;
  min_sale_value?: number;
  max_sale_value?: number;
  is_active: boolean;
  is_default_rate?: boolean;
  created_at: string;
  updated_at: string;
  // Informações enriquecidas
  seller_name: string;
  seller_email: string;
  product_name: string;
  product_category: string;
  office_name?: string;
  potential_impact?: number;
  conflicts?: string[];
}

interface CreateSellerCommissionData {
  seller_id?: string | null;
  product_id: string;
  commission_rate: number;
  min_sale_value?: number;
  max_sale_value?: number;
  is_active?: boolean;
  is_default_rate?: boolean;
}

interface CommissionFilters {
  search?: string;
  seller_id?: string;
  product_id?: string;
  office_id?: string;
  is_active?: boolean;
  commission_rate_min?: number;
  commission_rate_max?: number;
}

export const useSellerCommissionsEnhanced = (filters?: CommissionFilters) => {
  const { activeTenant } = useAuth();
  
  return useQuery({
    queryKey: ['seller-commissions-enhanced', activeTenant?.tenant_id, filters],
    queryFn: async (): Promise<EnhancedSellerCommission[]> => {
      if (!activeTenant?.tenant_id) {
        return [];
      }

      // Buscar comissões básicas
      let query = supabase
        .from('seller_commissions')
        .select('*')
        .eq('tenant_id', activeTenant.tenant_id);

      // Aplicar filtros
      if (filters?.seller_id) {
        query = query.eq('seller_id', filters.seller_id);
      }
      if (filters?.product_id) {
        query = query.eq('product_id', filters.product_id);
      }
      if (filters?.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active);
      }

      const { data: commissions, error: commissionsError } = await query.order('created_at', { ascending: false });

      if (commissionsError || !commissions?.length) {
        return [];
      }

      // Buscar informações complementares
      const sellerIds = [...new Set(commissions.map(c => c.seller_id))];
      const productIds = [...new Set(commissions.map(c => c.product_id))];

      const [sellersData, productsData] = await Promise.all([
        supabase.from('profiles').select('id, full_name, email').in('id', sellerIds),
        supabase.from('consortium_products').select('id, name, category').in('id', productIds)
      ]);

      // Processar dados enriquecidos
      return commissions.map(commission => {
        const seller = sellersData.data?.find(s => s.id === commission.seller_id);
        const product = productsData.data?.find(p => p.id === commission.product_id);
        
        return {
          ...commission,
          seller_name: commission.seller_id ? (seller?.full_name || 'Nome não encontrado') : 'Comissão Padrão',
          seller_email: commission.seller_id ? (seller?.email || 'Email não encontrado') : 'Taxa padrão do produto',
          product_name: product?.name || 'Produto não encontrado',
          product_category: product?.category || 'Categoria não definida',
          potential_impact: 0,
          conflicts: []
        };
      }).filter(commission => {
        if (!filters?.search) return true;
        const searchTerm = filters.search.toLowerCase();
        return commission.seller_name.toLowerCase().includes(searchTerm) ||
               commission.product_name.toLowerCase().includes(searchTerm) ||
               commission.seller_email.toLowerCase().includes(searchTerm);
      });
    },
    enabled: !!activeTenant?.tenant_id,
    staleTime: 30000,
  });
};

export const useCreateSellerCommissionEnhanced = () => {
  const queryClient = useQueryClient();
  const { activeTenant } = useAuth();

  return useMutation({
    mutationFn: async (data: CreateSellerCommissionData) => {
      if (!activeTenant?.tenant_id) {
        throw new Error('Tenant não encontrado');
      }

      const { data: result, error } = await supabase
        .from('seller_commissions')
        .insert({ tenant_id: activeTenant.tenant_id, ...data })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-commissions-enhanced'] });
      toast.success('Comissão criada com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao criar comissão');
    },
  });
};

export const useUpdateSellerCommissionEnhanced = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateSellerCommissionData> }) => {
      const { data: result, error } = await supabase
        .from('seller_commissions')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-commissions-enhanced'] });
      toast.success('Comissão atualizada com sucesso!');
    },
  });
};

export const useCommissionValidation = () => {
  return {
    validateCommission: async (formData: CreateSellerCommissionData, existingId?: string): Promise<string[]> => {
      const errors: string[] = [];
      
      // Basic validation
      if (formData.commission_rate <= 0 || formData.commission_rate > 100) {
        errors.push('Taxa de comissão deve estar entre 0.01% e 100%');
      }
      
      if (formData.min_sale_value && formData.max_sale_value) {
        if (formData.min_sale_value >= formData.max_sale_value) {
          errors.push('Valor mínimo deve ser menor que o valor máximo');
        }
      }
      
      return errors;
    }
  };
};

export const useCommissionImpactSimulator = () => {
  return {
    simulateImpact: async (sellerId: string, productId: string, commissionRate: number) => ({
      estimatedMonthlyImpact: commissionRate * 1000, // Mock calculation
      basedOnSales: 10, // Mock value
      difference: 0
    })
  };
};