
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface CurrentUserData {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  office?: {
    id: string;
    name: string;
    type: string;
  };
  department?: {
    id: string;
    name: string;
  };
  role?: string;
}

export function useCurrentUser() {
  const { user, activeTenant } = useAuth();

  const query = useQuery({
    queryKey: ['current-user', user?.id, activeTenant?.tenant_id],
    queryFn: async () => {
      if (!user?.id || !activeTenant?.tenant_id) {
        throw new Error('User or tenant not found');
      }

      // Buscar dados do usuário com informações do escritório e departamento
      const { data: userData, error: userError } = await supabase
        .from('office_users')
        .select(`
          role,
          offices (
            id,
            name,
            type
          ),
          departments (
            id,
            name
          )
        `)
        .eq('user_id', user.id)
        .eq('tenant_id', activeTenant.tenant_id)
        .eq('active', true)
        .single();

      if (userError && userError.code !== 'PGRST116') {
        console.error('Error fetching user data:', userError);
      }

      const currentUserData: CurrentUserData = {
        id: user.id,
        email: user.email || '',
        full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuário',
        avatar_url: user.user_metadata?.avatar_url,
        office: userData?.offices || undefined,
        department: userData?.departments || undefined,
        role: userData?.role || 'user',
      };

      return currentUserData;
    },
    enabled: !!user?.id && !!activeTenant?.tenant_id,
  });

  return {
    currentUser: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
