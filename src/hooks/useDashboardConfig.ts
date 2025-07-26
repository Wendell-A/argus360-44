import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface DashboardWidgets {
  total_sales: boolean;
  total_clients: boolean;
  monthly_performance: boolean;
  personal_goals: boolean;
  team_performance: boolean;
  office_comparison: boolean;
  commission_breakdown: boolean;
  top_sellers: boolean;
  recent_activities: boolean;
  pending_tasks: boolean;
}

export interface DashboardConfig {
  role: string;
  widgets: DashboardWidgets;
  data_scope: 'global' | 'office' | 'personal';
  accessible_offices: string[];
}

export function useDashboardConfig(enabled: boolean = true) {
  const { user, activeTenant } = useAuth();

  return useQuery({
    queryKey: ['dashboard-config', user?.id, activeTenant?.tenant_id],
    queryFn: async (): Promise<DashboardConfig> => {
      if (!user?.id || !activeTenant?.tenant_id) {
        throw new Error('Usuário ou tenant não encontrado');
      }

      const { data, error } = await supabase.rpc('get_dashboard_stats_config', {
        user_uuid: user.id,
        tenant_uuid: activeTenant.tenant_id
      });

      if (error) {
        console.error('Erro ao buscar configuração do dashboard:', error);
        throw error;
      }

      // Se houver erro no resultado
      if (data && typeof data === 'object' && 'error' in data) {
        throw new Error(data.error as string);
      }

      return data as unknown as DashboardConfig;
    },
    enabled: enabled && !!user?.id && !!activeTenant?.tenant_id,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    refetchOnWindowFocus: false,
  });
}