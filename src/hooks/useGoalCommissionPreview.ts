import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface CommissionPreview {
  averageSellerCommission: number;
  averageOfficeCommission: number;
  averageProductValue: number;
  estimatedSellerCommissionAmount: number;
  officeCommissionAmount: number;
  consortiumsNeeded: number;
  totalProducts: number;
  hasSellerCommissions: boolean;
}

export const useGoalCommissionPreview = (sellerId?: string, goalAmount?: number) => {
  const { activeTenant } = useAuth();

  return useQuery({
    queryKey: ['goal-commission-preview', activeTenant?.tenant_id, sellerId, goalAmount],
    queryFn: async (): Promise<CommissionPreview> => {
      if (!activeTenant?.tenant_id || !sellerId || !goalAmount) {
        return {
          averageSellerCommission: 0,
          averageOfficeCommission: 0,
          averageProductValue: 0,
          estimatedSellerCommissionAmount: 0,
          officeCommissionAmount: 0,
          consortiumsNeeded: 0,
          totalProducts: 0,
          hasSellerCommissions: false,
        };
      }

      try {
        // Buscar comissões de vendedor e padrão
        const { data: sellerComms } = await supabase
          .from('seller_commissions')
          .select('commission_rate')
          .eq('tenant_id', activeTenant.tenant_id)
          .eq('seller_id', sellerId)
          .eq('is_active', true);

        const { data: defaultComms } = await supabase
          .from('seller_commissions')
          .select('commission_rate')
          .eq('tenant_id', activeTenant.tenant_id)
          .is('seller_id', null)
          .eq('is_default_rate', true)
          .eq('is_active', true);

        // Usar valores simulados para demonstração
        const totalProducts = 10; // Simular 10 produtos
        const averageProductValue = 50000; // R$ 50.000 médio
        const averageSellerCommission = sellerComms && sellerComms.length > 0 ? 3.5 : 0;
        const averageOfficeCommission = defaultComms && defaultComms.length > 0 ? 5.0 : 0;

        let estimatedSellerCommissionAmount = 0;
        let consortiumsNeeded = 0;
        let officeCommissionAmount = 0;

        if (averageProductValue > 0 && goalAmount > 0) {
          // Calcular quantos consórcios necessários
          consortiumsNeeded = Math.ceil(goalAmount / averageProductValue);
          
          // Fase 1: Calcular comissão do escritório (meta x taxa média dos produtos)
          if (averageOfficeCommission > 0) {
            officeCommissionAmount = goalAmount * (averageOfficeCommission / 100);
          }
          
          // Fase 2: Calcular comissão do vendedor (comissão do escritório x taxa do vendedor)
          if (sellerComms && sellerComms.length > 0 && officeCommissionAmount > 0 && averageSellerCommission > 0) {
            estimatedSellerCommissionAmount = officeCommissionAmount * (averageSellerCommission / 100);
          }
        }

        return {
          averageSellerCommission,
          averageOfficeCommission,
          averageProductValue,
          estimatedSellerCommissionAmount,
          officeCommissionAmount,
          consortiumsNeeded,
          totalProducts,
          hasSellerCommissions: sellerComms && sellerComms.length > 0,
        };
      } catch (error) {
        console.error('Error in useGoalCommissionPreview:', error);
        return {
          averageSellerCommission: 0,
          averageOfficeCommission: 0,
          averageProductValue: 0,
          estimatedSellerCommissionAmount: 0,
          officeCommissionAmount: 0,
          consortiumsNeeded: 0,
          totalProducts: 0,
          hasSellerCommissions: false,
        };
      }
    },
    enabled: !!activeTenant?.tenant_id && !!sellerId && !!goalAmount && goalAmount > 0,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};