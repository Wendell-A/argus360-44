import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ContextualSale {
  id: string;
  client_id: string;
  seller_id: string;
  product_id: string;
  office_id: string;
  sale_value: number;
  commission_rate: number;
  commission_amount: number;
  monthly_payment: number;
  installments: number;
  down_payment?: number;
  status?: string;
  sale_date: string;
  approval_date?: string;
  completion_date?: string;
  cancellation_date?: string;
  contract_number?: string;
  notes?: string;
  settings?: any;
  created_at: string;
  updated_at: string;
  tenant_id: string;
}

export function useContextualSales(enabled: boolean = true) {
  const { user, activeTenant } = useAuth();

  return useQuery({
    queryKey: ['contextual-sales', user?.id, activeTenant?.tenant_id],
    queryFn: async (): Promise<ContextualSale[]> => {
      if (!user?.id || !activeTenant?.tenant_id) {
        throw new Error('Usuário ou tenant não encontrado');
      }

      const { data, error } = await supabase.rpc('get_contextual_sales', {
        user_uuid: user.id,
        tenant_uuid: activeTenant.tenant_id
      });

      if (error) {
        console.error('Erro ao buscar vendas contextuais:', error);
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