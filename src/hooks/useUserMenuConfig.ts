
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface MenuConfig {
  role: string;
  context_level: number;
  modules: {
    users?: boolean;
    [key: string]: boolean | undefined;
  };
  [key: string]: any;
}

export const useUserMenuConfig = () => {
  const { activeTenant, user } = useAuth();

  return useQuery({
    queryKey: ['user-menu-config', user?.id, activeTenant?.tenant_id],
    queryFn: async (): Promise<MenuConfig> => {
      if (!user?.id || !activeTenant?.tenant_id) {
        throw new Error('User or tenant not found');
      }

      console.log('🔍 Getting user menu config for:', user.id, activeTenant.tenant_id);

      const { data, error } = await supabase.rpc('get_user_menu_config', {
        user_uuid: user.id,
        tenant_uuid: activeTenant.tenant_id
      });

      if (error) {
        console.error('❌ Error getting menu config:', error);
        throw error;
      }

      // Garantir que data é um objeto e tem as propriedades necessárias
      const menuConfig = data as MenuConfig || {};
      
      // Adicionar configuração para tela de usuários se modules existe
      if (menuConfig.modules && typeof menuConfig.modules === 'object') {
        menuConfig.modules.users = menuConfig.role === 'owner' || menuConfig.role === 'admin';
      } else {
        // Se modules não existe, criar com configuração básica
        menuConfig.modules = {
          users: menuConfig.role === 'owner' || menuConfig.role === 'admin'
        };
      }

      console.log('✅ Menu config loaded:', menuConfig);
      return menuConfig;
    },
    enabled: !!user?.id && !!activeTenant?.tenant_id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
