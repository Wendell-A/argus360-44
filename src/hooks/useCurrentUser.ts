
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

      // Buscar papel e escritório a partir de tenant_users (fonte de verdade)
      const { data: tenantUser, error: tenantUserError } = await supabase
        .from('tenant_users')
        .select('role, office_id')
        .eq('user_id', user.id)
        .eq('tenant_id', activeTenant.tenant_id)
        .eq('active', true)
        .maybeSingle();

      if (tenantUserError && tenantUserError.code !== 'PGRST116') {
        console.error('Error fetching tenant_users:', tenantUserError);
      }

      // Detalhes do escritório (quando existir)
      let officeData: { id: string; name: string; type: string } | undefined;
      if (tenantUser?.office_id) {
        const { data: office, error: officeError } = await supabase
          .from('offices')
          .select('id, name, type')
          .eq('id', tenantUser.office_id)
          .maybeSingle();
        if (!officeError && office) {
          officeData = office;
        }
      }

      // Fallback: caso não exista em tenant_users, procurar em office_users (legado)
      let fallbackRole: string | undefined = undefined;
      if (!tenantUser) {
        const { data: officeUser, error: officeUserError } = await supabase
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
          .maybeSingle();

        if (officeUserError && officeUserError.code !== 'PGRST116') {
          console.error('Error fetching office_users:', officeUserError);
        }

        if (officeUser) {
          fallbackRole = officeUser.role;
          if (officeUser.offices) {
            officeData = {
              id: (officeUser as any).offices.id,
              name: (officeUser as any).offices.name,
              type: (officeUser as any).offices.type
            };
          }
        }
      }

      // Buscar departamento (opcional)
      let departmentData = null;
      if (officeData) {
        const { data: deptData, error: deptError } = await supabase
          .from('departments')
          .select('id, name')
          .eq('tenant_id', activeTenant.tenant_id)
          .limit(1)
          .maybeSingle();

        if (!deptError) {
          departmentData = deptData;
        }
      }

      const resolvedRole = (tenantUser?.role || fallbackRole || 'user') as string;

      const currentUserData: CurrentUserData = {
        id: user.id,
        email: user.email || '',
        full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuário',
        avatar_url: user.user_metadata?.avatar_url,
        office: officeData,
        department: departmentData || undefined,
        role: resolvedRole,
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
