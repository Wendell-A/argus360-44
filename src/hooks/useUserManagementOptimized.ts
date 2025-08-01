/**
 * Hook de Usuários Otimizado - ETAPA 2
 * Data: 31 de Janeiro de 2025, 03:05 UTC
 * 
 * Hook que utiliza a nova RPC otimizada para eliminar N+1 queries
 * e integra com o sistema de cache híbrido.
 */

import { useOptimizedUserQuery } from '@/hooks/useOptimizedQuery';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface UserCompleteData {
  id: string;
  email: string;
  role: string;
  active: boolean;
  office_id?: string;
  department_id?: string;
  profile: {
    full_name?: string;
    phone?: string;
    avatar_url?: string;
    position?: string;
  };
  office: {
    name?: string;
    type?: string;
  };
  department: {
    name?: string;
  };
  position: {
    name?: string;
  };
  permissions: Record<string, any>;
  stats: {
    total_sales: number;
    total_commission: number;
    last_activity?: string;
    active_goals: number;
  };
}

export const useUserManagementOptimized = (limit: number = 50, offset: number = 0) => {
  const { activeTenant } = useAuth();

  return useOptimizedUserQuery<UserCompleteData[]>(
    ['users-complete-optimized', activeTenant?.tenant_id, limit, offset],
    {
      queryFn: async () => {
        if (!activeTenant) {
          throw new Error('Tenant não selecionado');
        }

        const { data, error } = await supabase
          .rpc('get_users_complete_optimized', {
            tenant_uuid: activeTenant.tenant_id,
            limit_param: limit,
            offset_param: offset
          });

        if (error) {
          console.error('Erro ao buscar usuários:', error);
          throw error;
        }

        // Transform para estrutura esperada
        return (data || []).map((row: any) => ({
          id: row.user_id,
          ...row.user_data,
          profile: row.profile_data || {},
          office: row.office_data || {},
          department: row.department_data || {},
          position: row.position_data || {},
          permissions: row.permissions_data || {},
          stats: row.stats_data || {
            total_sales: 0,
            total_commission: 0,
            active_goals: 0
          }
        }));
      },
      enabled: Boolean(activeTenant?.tenant_id),
      staleTime: 300000, // 5 minutos
      gcTime: 600000 // 10 minutos
    }
  );
};