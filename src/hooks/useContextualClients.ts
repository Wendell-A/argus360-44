import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ContextualClient {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  document: string;
  type: string;
  status?: string;
  office_id?: string;
  responsible_user_id?: string;
  classification?: string;
  monthly_income?: number;
  birth_date?: string;
  occupation?: string;
  secondary_phone?: string;
  address?: any;
  notes?: string;
  source?: string;
  settings?: any;
  created_at: string;
  updated_at: string;
  tenant_id: string;
}

export function useContextualClients(enabled: boolean = true) {
  const { user, activeTenant } = useAuth();

  return useQuery({
    queryKey: ['contextual-clients', user?.id, activeTenant?.tenant_id],
    queryFn: async (): Promise<ContextualClient[]> => {
      if (!user?.id || !activeTenant?.tenant_id) {
        throw new Error('Usuário ou tenant não encontrado');
      }

      const { data, error } = await supabase.rpc('get_contextual_clients', {
        user_uuid: user.id,
        tenant_uuid: activeTenant.tenant_id
      });

      if (error) {
        console.error('Erro ao buscar clientes contextuais:', error);
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