/**
 * Hook de CRM Otimizado - ETAPA 2
 * Data: 31 de Janeiro de 2025, 03:07 UTC
 * 
 * Hook que utiliza a nova RPC otimizada para CRM
 * retornando clientes + funil + interações + vendas em uma query.
 */

import { useOptimizedBusinessQuery } from '@/hooks/useOptimizedQuery';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface CRMCompleteData {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  classification: string;
  responsible_user_id: string;
  office_id: string;
  created_at: string;
  funnel_position: {
    stage_id?: string;
    stage_name?: string;
    stage_color?: string;
    probability?: number;
    expected_value?: number;
    entered_at?: string;
  };
  recent_interactions: Array<{
    id: string;
    interaction_type: string;
    title: string;
    description: string;
    status: string;
    created_at: string;
    seller_name: string;
  }>;
  pending_tasks: Array<{
    id: string;
    title: string;
    description: string;
    status: string;
    priority: string;
    due_date: string;
  }>;
  sales: Array<{
    id: string;
    sale_value: number;
    status: string;
    sale_date: string;
    commission_amount: number;
  }>;
}

export const useCRMOptimized = (limit: number = 100) => {
  const { activeTenant } = useAuth();

  return useOptimizedBusinessQuery<CRMCompleteData[]>(
    ['crm-complete-optimized', activeTenant?.tenant_id, limit],
    {
      queryFn: async () => {
        if (!activeTenant) {
          throw new Error('Tenant não selecionado');
        }

        const { data, error } = await supabase
          .rpc('get_crm_complete_optimized', {
            tenant_uuid: activeTenant.tenant_id,
            limit_param: limit
          });

        if (error) {
          console.error('Erro ao buscar dados do CRM:', error);
          throw error;
        }

        // Transform para estrutura esperada
        return (data || []).map((row: any) => ({
          id: row.client_id,
          ...row.client_data,
          funnel_position: row.funnel_position || {},
          recent_interactions: row.recent_interactions || [],
          pending_tasks: row.pending_tasks || [],
          sales: row.sales_data || []
        }));
      },
      enabled: Boolean(activeTenant?.tenant_id),
      staleTime: 600000, // 10 minutos  
      gcTime: 1200000 // 20 minutos
    }
  );
};