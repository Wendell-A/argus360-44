
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface OfficeData {
  id: string;
  name: string;
  type: string;
}

interface DepartmentData {
  id: string;
  name: string;
}

interface CurrentUserData {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  office?: OfficeData;
  department?: DepartmentData;
  role?: string;
}

export function useCurrentUser() {
  const { user, activeTenant } = useAuth();

  const query = useQuery({
    queryKey: ['current-user', user?.id, activeTenant?.tenant_id],
    queryFn: async (): Promise<CurrentUserData> => {
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
          )
        `)
        .eq('user_id', user.id)
        .eq('tenant_id', activeTenant.tenant_id)
        .eq('active', true)
        .single();

      if (userError && userError.code !== 'PGRST116') {
        console.error('Error fetching user data:', userError);
      }

      // Buscar departamento se o usuário tiver escritório
      let departmentData: DepartmentData | null = null;
      if (userData?.offices) {
        const { data: deptData, error: deptError } = await supabase
          .from('departments')
          .select('id, name')
          .eq('tenant_id', activeTenant.tenant_id)
          .eq('active', true)
          .limit(1)
          .single();

        if (!deptError) {
          departmentData = deptData;
        }
      }

      const currentUserData: CurrentUserData = {
        id: user.id,
        email: user.email || '',
        full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuário',
        avatar_url: user.user_metadata?.avatar_url,
        office: userData?.offices ? {
          id: userData.offices.id,
          name: userData.offices.name,
          type: userData.offices.type
        } : undefined,
        department: departmentData || undefined,
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
