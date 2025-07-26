import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ContextualDashboardStats {
  total_clients: number;
  total_sales: number;
  total_commission: number;
  pending_tasks: number;
  month_sales: number;
  month_commission: number;
  user_role: string;
  accessible_offices: string[];
  context_level: number;
}

export function useContextualDashboard(enabled: boolean = true) {
  const { user, activeTenant } = useAuth();

  return useQuery({
    queryKey: ['contextual-dashboard', user?.id, activeTenant?.tenant_id],
    queryFn: async (): Promise<ContextualDashboardStats> => {
      if (!user?.id || !activeTenant?.tenant_id) {
        throw new Error('Usuário ou tenant não encontrado');
      }

      const { data, error } = await supabase.rpc('get_contextual_dashboard_stats', {
        user_uuid: user.id,
        tenant_uuid: activeTenant.tenant_id
      });

      if (error) {
        console.error('Erro ao buscar estatísticas contextuais:', error);
        throw error;
      }

      if (!data) {
        return {
          total_clients: 0,
          total_sales: 0,
          total_commission: 0,
          pending_tasks: 0,
          month_sales: 0,
          month_commission: 0,
          user_role: 'user',
          accessible_offices: [],
          context_level: 4
        };
      }

      // Garantir que data é um objeto e tem as propriedades esperadas
      if (typeof data !== 'object' || data === null || Array.isArray(data)) {
        throw new Error('Formato de dados inválido retornado do banco');
      }

      return data as unknown as ContextualDashboardStats;
    },
    enabled: enabled && !!user?.id && !!activeTenant?.tenant_id,
    staleTime: 2 * 60 * 1000, // 2 minutos (mais frequente para dashboard)
    gcTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: true, // Atualizar quando voltar à aba
    refetchInterval: 5 * 60 * 1000, // Atualizar a cada 5 minutos automaticamente
  });
}