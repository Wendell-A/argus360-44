/**
 * Hook de Dashboard Otimizado - ETAPA 2
 * Data: 31 de Janeiro de 2025, 03:06 UTC
 * 
 * Hook que utiliza a nova RPC otimizada para dashboard
 * eliminando múltiplas queries separadas.
 */

import { useOptimizedBusinessQuery } from '@/hooks/useOptimizedQuery';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface DashboardCompleteData {
  stats: {
    total_clients: number;
    total_sales: number;
    total_revenue: number;
    total_commission: number;
  };
  recent_sales: Array<{
    id: string;
    sale_value: number;
    status: string;
    sale_date: string;
    client_name: string;
    seller_name: string;
  }>;
  recent_clients: Array<{
    id: string;
    name: string;
    email: string;
    status: string;
    created_at: string;
    responsible_name: string;
  }>;
  pending_tasks: Array<{
    id: string;
    title: string;
    description: string;
    due_date: string;
    priority: string;
    client_name: string;
  }>;
  goals: Array<{
    id: string;
    goal_type: string;
    target_amount: number;
    current_amount: number;
    progress_percentage: number;
    period_start: string;
    period_end: string;
  }>;
  commission_summary: {
    pending_commissions: number;
  };
}

export const useDashboardOptimized = () => {
  const { activeTenant } = useAuth();

  return useOptimizedBusinessQuery<DashboardCompleteData>(
    ['dashboard-complete-optimized', activeTenant?.tenant_id],
    {
      queryFn: async () => {
        if (!activeTenant) {
          throw new Error('Tenant não selecionado');
        }

        const { data, error } = await supabase
          .rpc('get_dashboard_complete_optimized', {
            tenant_uuid: activeTenant.tenant_id
          });

        if (error) {
          console.error('Erro ao buscar dados do dashboard:', error);
          throw error;
        }

        const result = data?.[0];
        if (!result) {
          throw new Error('Nenhum dado retornado');
        }

        return {
          stats: (result.stats_data as any) || {
            total_clients: 0,
            total_sales: 0,
            total_revenue: 0,
            total_commission: 0
          },
          recent_sales: (result.recent_sales as any) || [],
          recent_clients: (result.recent_clients as any) || [],
          pending_tasks: (result.pending_tasks as any) || [],
          goals: (result.goals_data as any) || [],
          commission_summary: (result.commission_summary as any) || {
            pending_commissions: 0
          }
        };
      },
      enabled: Boolean(activeTenant?.tenant_id),
      staleTime: 300000, // 5 minutos
      gcTime: 600000 // 10 minutos
    }
  );
};