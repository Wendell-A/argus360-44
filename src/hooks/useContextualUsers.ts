import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ContextualUser {
  user_id: string;
  tenant_id: string;
  role: string;
  office_id?: string;
  department_id?: string;
  team_id?: string;
  profile_id?: string;
  active: boolean;
  context_level?: number;
  permissions?: any;
  invited_at?: string;
  joined_at?: string;
  created_at: string;
  updated_at: string;
}

export function useContextualUsers(enabled: boolean = true) {
  const { user, activeTenant } = useAuth();

  return useQuery({
    queryKey: ['contextual-users', user?.id, activeTenant?.tenant_id],
    queryFn: async (): Promise<ContextualUser[]> => {
      if (!user?.id || !activeTenant?.tenant_id) {
        throw new Error('Usuário ou tenant não encontrado');
      }

      const { data, error } = await supabase.rpc('get_contextual_users', {
        user_uuid: user.id,
        tenant_uuid: activeTenant.tenant_id
      });

      if (error) {
        console.error('Erro ao buscar usuários contextuais:', error);
        throw error;
      }

      return data || [];
    },
    enabled: enabled && !!user?.id && !!activeTenant?.tenant_id,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    refetchOnWindowFocus: false,
  });
}