import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useUserMenuConfig = () => {
  const { activeTenant, user } = useAuth();

  return useQuery({
    queryKey: ['user-menu-config', user?.id, activeTenant?.tenant_id],
    queryFn: async () => {
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

      // Adicionar configuração para tela de usuários
      const menuConfig = data || {};
      if (menuConfig.modules) {
        menuConfig.modules.users = menuConfig.role === 'owner' || menuConfig.role === 'admin';
      }

      console.log('✅ Menu config loaded:', menuConfig);
      return menuConfig;
    },
    enabled: !!user?.id && !!activeTenant?.tenant_id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
