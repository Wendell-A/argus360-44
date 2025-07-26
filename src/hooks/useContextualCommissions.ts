import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ContextualCommission {
  id: string;
  sale_id: string;
  recipient_id: string;
  recipient_type: string;
  commission_type?: string;
  base_amount: number;
  commission_rate: number;
  commission_amount: number;
  installment_number?: number;
  total_installments?: number;
  installment_amount?: number;
  due_date: string;
  payment_date?: string;
  approval_date?: string;
  status?: string;
  payment_method?: string;
  payment_reference?: string;
  notes?: string;
  settings?: any;
  parent_commission_id?: string;
  created_at: string;
  updated_at: string;
  tenant_id: string;
}

export function useContextualCommissions(enabled: boolean = true) {
  const { user, activeTenant } = useAuth();

  return useQuery({
    queryKey: ['contextual-commissions', user?.id, activeTenant?.tenant_id],
    queryFn: async (): Promise<ContextualCommission[]> => {
      if (!user?.id || !activeTenant?.tenant_id) {
        throw new Error('Usuário ou tenant não encontrado');
      }

      const { data, error } = await supabase.rpc('get_contextual_commissions', {
        user_uuid: user.id,
        tenant_uuid: activeTenant.tenant_id
      });

      if (error) {
        console.error('Erro ao buscar comissões contextuais:', error);
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