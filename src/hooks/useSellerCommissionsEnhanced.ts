import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface EnhancedSellerCommission {
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
  seller_id: string;
  product_id: string;
  commission_rate: number;
  min_sale_value?: number;
  max_sale_value?: number;
  is_active?: boolean;
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
          seller_name: seller?.full_name || 'Nome não encontrado',
          seller_email: seller?.email || 'Email não encontrado',
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
  const { activeTenant } = useAuth();
  
  return {
    simulateImpact: async (sellerId: string, productId: string, commissionRate: number) => {
      try {
        // Buscar histórico de vendas do vendedor nos últimos 6 meses
        const { data: salesHistory } = await supabase
          .from('sales')
          .select('sale_value, commission_amount, sale_date')
          .eq('tenant_id', activeTenant?.tenant_id)
          .eq('seller_id', sellerId)
          .eq('product_id', productId)
          .gte('sale_date', new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000).toISOString())
          .eq('status', 'approved');

        const totalSales = salesHistory?.length || 0;
        const avgMonthlyCommission = salesHistory?.length ? 
          salesHistory.reduce((sum, sale) => sum + (sale.commission_amount || 0), 0) / 6 : 0;
        
        // Calcular impacto estimado baseado no histórico
        const avgSaleValue = salesHistory?.length ?
          salesHistory.reduce((sum, sale) => sum + sale.sale_value, 0) / salesHistory.length : 50000;
        
        const estimatedMonthlySales = Math.max(totalSales / 6, 1);
        const newCommissionAmount = (avgSaleValue * estimatedMonthlySales * (commissionRate / 100));
        
        return {
          estimatedMonthlyImpact: newCommissionAmount,
          basedOnSales: totalSales,
          difference: newCommissionAmount - avgMonthlyCommission,
          avgSaleValue,
          avgMonthlySales: estimatedMonthlySales
        };
      } catch (error) {
        console.error('Error simulating impact:', error);
        return {
          estimatedMonthlyImpact: commissionRate * 1000,
          basedOnSales: 0,
          difference: 0,
          avgSaleValue: 50000,
          avgMonthlySales: 1
        };
      }
    }
  };
};

export const useCommissionDashboardMetrics = () => {
  const { activeTenant } = useAuth();
  
  return useQuery({
    queryKey: ['commission-dashboard-metrics', activeTenant?.tenant_id],
    queryFn: async () => {
      if (!activeTenant?.tenant_id) return null;

      // Buscar configurações de comissões
      const { data: commissions } = await supabase
        .from('seller_commissions')
        .select('*')
        .eq('tenant_id', activeTenant.tenant_id);

      // Buscar vendas dos últimos 30 dias para calcular impacto
      const { data: recentSales } = await supabase
        .from('sales')
        .select('seller_id, commission_amount, sale_date')
        .eq('tenant_id', activeTenant.tenant_id)
        .gte('sale_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .eq('status', 'approved');

      // Buscar perfis dos vendedores únicos
      const sellerIds = [...new Set(commissions?.map(c => c.seller_id) || [])];
      const { data: profiles } = sellerIds.length > 0 ? await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', sellerIds) : { data: [] };

      const activeCommissions = commissions?.filter(c => c.is_active) || [];
      const totalCommissions = commissions?.length || 0;
      const avgCommissionRate = activeCommissions.length > 0
        ? activeCommissions.reduce((sum, c) => sum + c.commission_rate, 0) / activeCommissions.length
        : 0;

      // Calcular top performers
      const sellerPerformance = new Map();
      recentSales?.forEach(sale => {
        if (!sellerPerformance.has(sale.seller_id)) {
          sellerPerformance.set(sale.seller_id, { totalCommissions: 0, salesCount: 0 });
        }
        const current = sellerPerformance.get(sale.seller_id);
        current.totalCommissions += sale.commission_amount || 0;
        current.salesCount += 1;
      });

      const topPerformers = Array.from(sellerPerformance.entries())
        .map(([sellerId, data]) => {
          const seller = profiles?.find(p => p.id === sellerId);
          return {
            id: sellerId,
            name: seller?.full_name || seller?.email || 'Vendedor',
            totalCommissions: data.totalCommissions,
            averageRate: data.salesCount > 0 ? data.totalCommissions / data.salesCount : 0
          };
        })
        .sort((a, b) => b.totalCommissions - a.totalCommissions)
        .slice(0, 5);

      // Mock de atividades recentes (em implementação real, viria de audit log)
      const recentActivity = [
        {
          id: '1',
          type: 'created' as const,
          description: 'Nova configuração criada para João Silva',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '2',
          type: 'updated' as const,
          description: 'Taxa alterada para Maria Santos',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
        }
      ];

      return {
        totalCommissions,
        totalValue: recentSales?.reduce((sum, s) => sum + (s.commission_amount || 0), 0) || 0,
        averageRate: avgCommissionRate,
        monthlyGrowth: 12.5, // Mock - calcular baseado em dados históricos
        activeConfigurations: activeCommissions.length,
        conflictsCount: 0, // Implementar detecção de conflitos
        potentialImpact: activeCommissions.reduce((sum, c) => sum + (c.commission_rate * 1000), 0),
        topPerformers,
        recentActivity
      };
    },
    enabled: !!activeTenant?.tenant_id,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};