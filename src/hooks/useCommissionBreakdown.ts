import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface CommissionBreakdown {
  commission_type: 'office' | 'seller';
  total_amount: number;
  count: number;
  avg_amount: number;
  pending_amount: number;
  approved_amount: number;
  paid_amount: number;
}

export interface CommissionMetrics {
  office: CommissionBreakdown;
  seller: CommissionBreakdown;
  combined: {
    total_amount: number;
    total_count: number;
    pending_percentage: number;
    approved_percentage: number;
    paid_percentage: number;
  };
}

export function useCommissionBreakdown(enabled: boolean = true) {
  const { user, activeTenant } = useAuth();

  return useQuery({
    queryKey: ['commission-breakdown', user?.id, activeTenant?.tenant_id],
    queryFn: async (): Promise<CommissionMetrics> => {
      if (!user?.id || !activeTenant?.tenant_id) {
        throw new Error('Usuário ou tenant não encontrado');
      }

      // Query otimizada para buscar breakdown por tipo
      const { data: breakdownData, error } = await supabase
        .from('commissions')
        .select(`
          commission_type,
          commission_amount,
          status
        `)
        .eq('tenant_id', activeTenant.tenant_id);

      if (error) {
        console.error('Erro ao buscar breakdown de comissões:', error);
        throw error;
      }

      // Processar dados para criar métricas separadas
      const officeCommissions = breakdownData?.filter(c => c.commission_type === 'office') || [];
      const sellerCommissions = breakdownData?.filter(c => c.commission_type === 'seller') || [];

      const processCommissionData = (commissions: any[]): CommissionBreakdown => {
        const total_amount = commissions.reduce((sum, c) => sum + (c.commission_amount || 0), 0);
        const count = commissions.length;
        const avg_amount = count > 0 ? total_amount / count : 0;
        
        const pending_amount = commissions
          .filter(c => c.status === 'pending')
          .reduce((sum, c) => sum + (c.commission_amount || 0), 0);
        
        const approved_amount = commissions
          .filter(c => c.status === 'approved')
          .reduce((sum, c) => sum + (c.commission_amount || 0), 0);
        
        const paid_amount = commissions
          .filter(c => c.status === 'paid')
          .reduce((sum, c) => sum + (c.commission_amount || 0), 0);

        return {
          commission_type: commissions[0]?.commission_type || 'office',
          total_amount,
          count,
          avg_amount,
          pending_amount,
          approved_amount,
          paid_amount,
        };
      };

      const office = processCommissionData(officeCommissions);
      const seller = processCommissionData(sellerCommissions);

      // Métricas combinadas
      const combined_total = office.total_amount + seller.total_amount;
      const combined_count = office.count + seller.count;
      const combined_pending = office.pending_amount + seller.pending_amount;
      const combined_approved = office.approved_amount + seller.approved_amount;
      const combined_paid = office.paid_amount + seller.paid_amount;

      const combined = {
        total_amount: combined_total,
        total_count: combined_count,
        pending_percentage: combined_total > 0 ? (combined_pending / combined_total) * 100 : 0,
        approved_percentage: combined_total > 0 ? (combined_approved / combined_total) * 100 : 0,
        paid_percentage: combined_total > 0 ? (combined_paid / combined_total) * 100 : 0,
      };

      return { office, seller, combined };
    },
    enabled: enabled && !!user?.id && !!activeTenant?.tenant_id,
    staleTime: 2 * 60 * 1000, // 2 minutos para comissões (dados mais voláteis)
    gcTime: 5 * 60 * 1000, // 5 minutos de cache
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}

export function useCommissionByType(
  commissionType: 'office' | 'seller',
  enabled: boolean = true
) {
  const { user, activeTenant } = useAuth();

  return useQuery({
    queryKey: ['commission-by-type', commissionType, user?.id, activeTenant?.tenant_id],
    queryFn: async () => {
      if (!user?.id || !activeTenant?.tenant_id) {
        throw new Error('Usuário ou tenant não encontrado');
      }

      const { data, error } = await supabase
        .from('commissions')
        .select('*')
        .eq('tenant_id', activeTenant.tenant_id)
        .eq('commission_type', commissionType)
        .order('created_at', { ascending: false });

      if (error) {
        console.error(`Erro ao buscar comissões ${commissionType}:`, error);
        throw error;
      }

      return data || [];
    },
    enabled: enabled && !!user?.id && !!activeTenant?.tenant_id,
    staleTime: 1 * 60 * 1000, // 1 minuto para listas específicas
    gcTime: 3 * 60 * 1000, // 3 minutos de cache
    refetchOnWindowFocus: false,
  });
}