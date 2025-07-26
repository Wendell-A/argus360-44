import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface MenuModules {
  dashboard: boolean;
  crm: boolean;
  clients: boolean;
  sales: boolean;
  commissions: boolean;
  goals: boolean;
  reports: boolean;
  sellers: boolean;
  offices: boolean;
  departments: boolean;
  positions: boolean;
  teams: boolean;
  invitations: boolean;
  permissions: boolean;
  configurations: boolean;
  audit: boolean;
}

export interface MenuFeatures {
  create_sales: boolean;
  edit_own_sales: boolean;
  edit_all_sales: boolean;
  delete_sales: boolean;
  view_all_clients: boolean;
  create_clients: boolean;
  edit_own_clients: boolean;
  edit_all_clients: boolean;
  view_commission_details: boolean;
  manage_goals: boolean;
  view_team_performance: boolean;
}

export interface UserMenuConfig {
  role: string;
  context_level: number;
  modules: MenuModules;
  features: MenuFeatures;
}

export function useUserMenuConfig(enabled: boolean = true) {
  const { user, activeTenant } = useAuth();

  return useQuery({
    queryKey: ['user-menu-config', user?.id, activeTenant?.tenant_id],
    queryFn: async (): Promise<UserMenuConfig> => {
      if (!user?.id || !activeTenant?.tenant_id) {
        throw new Error('Usuário ou tenant não encontrado');
      }

      const { data, error } = await supabase.rpc('get_user_menu_config', {
        user_uuid: user.id,
        tenant_uuid: activeTenant.tenant_id
      });

      if (error) {
        console.error('Erro ao buscar configuração do menu:', error);
        throw error;
      }

      // Se houver erro no resultado
      if (data && typeof data === 'object' && 'error' in data) {
        throw new Error(data.error as string);
      }

      return data as unknown as UserMenuConfig;
    },
    enabled: enabled && !!user?.id && !!activeTenant?.tenant_id,
    staleTime: 10 * 60 * 1000, // 10 minutos
    gcTime: 15 * 60 * 1000, // 15 minutos
    refetchOnWindowFocus: false,
  });
}