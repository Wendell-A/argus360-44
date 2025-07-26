import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface UserContext {
  user_id: string;
  tenant_id: string;
  role: 'owner' | 'admin' | 'manager' | 'user' | 'viewer';
  accessible_offices: string[];
  accessible_departments: string[];
  accessible_teams: string[];
  is_owner_or_admin: boolean;
  is_manager: boolean;
  is_user: boolean;
  context_level: number;
}

export interface UseUserContextReturn {
  userContext: UserContext | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  canAccessUserData: (targetUserId: string) => Promise<boolean>;
  getAccessibleOffices: () => string[];
  hasGlobalAccess: () => boolean;
  hasOfficeAccess: (officeId: string) => boolean;
  hasManagerPermissions: () => boolean;
}

export const useUserContext = (): UseUserContextReturn => {
  const { user, activeTenant } = useAuth();

  const { 
    data: userContext, 
    isLoading, 
    error, 
    refetch 
  } = useQuery({
    queryKey: ['userContext', user?.id, activeTenant?.tenant_id],
    queryFn: async (): Promise<UserContext | null> => {
      if (!user?.id || !activeTenant?.tenant_id) {
        return null;
      }

      try {
        // Chamar função para obter contexto completo do usuário
        const { data, error } = await supabase.rpc('get_user_full_context', {
          user_uuid: user.id,
          tenant_uuid: activeTenant.tenant_id
        });

        if (error) {
          console.error('Erro ao buscar contexto do usuário:', error);
          throw new Error(`Erro ao buscar contexto: ${error.message}`);
        }

        if (!data) {
          return null;
        }

        return data as unknown as UserContext;
      } catch (error) {
        console.error('Erro na consulta de contexto:', error);
        throw error;
      }
    },
    enabled: !!user?.id && !!activeTenant?.tenant_id,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
  });

  // Função auxiliar para verificar se pode acessar dados de outro usuário
  const canAccessUserData = async (targetUserId: string): Promise<boolean> => {
    if (!user?.id || !activeTenant?.tenant_id) {
      return false;
    }

    try {
      const { data, error } = await supabase.rpc('can_access_user_data', {
        accessing_user_id: user.id,
        target_user_id: targetUserId,
        tenant_uuid: activeTenant.tenant_id
      });

      if (error) {
        console.error('Erro ao verificar acesso a dados do usuário:', error);
        return false;
      }

      return data || false;
    } catch (error) {
      console.error('Erro na verificação de acesso:', error);
      return false;
    }
  };

  // Função para obter escritórios acessíveis
  const getAccessibleOffices = (): string[] => {
    return userContext?.accessible_offices || [];
  };

  // Função para verificar se tem acesso global
  const hasGlobalAccess = (): boolean => {
    return userContext?.is_owner_or_admin || false;
  };

  // Função para verificar se tem acesso a um escritório específico
  const hasOfficeAccess = (officeId: string): boolean => {
    if (hasGlobalAccess()) {
      return true;
    }
    return getAccessibleOffices().includes(officeId);
  };

  // Função para verificar se tem permissões de manager
  const hasManagerPermissions = (): boolean => {
    return userContext?.is_owner_or_admin || userContext?.is_manager || false;
  };

  return {
    userContext,
    isLoading,
    error: error as Error | null,
    refetch,
    canAccessUserData,
    getAccessibleOffices,
    hasGlobalAccess,
    hasOfficeAccess,
    hasManagerPermissions,
  };
};