import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useDashboardFiltersStore } from '@/stores/useDashboardFiltersStore';

export function useDashboardFilteredData() {
  const { activeTenant } = useAuth();
  const { filters, isActive } = useDashboardFiltersStore();

  return useQuery({
    queryKey: [
      'dashboard-filtered-data',
      activeTenant?.tenant_id,
      filters.year,
      filters.month,
      filters.startDate?.toISOString(),
      filters.endDate?.toISOString(),
      filters.officeIds,
      filters.productIds,
      isActive,
    ],
    queryFn: async () => {
      if (!activeTenant?.tenant_id) {
        throw new Error('Tenant não encontrado');
      }

      // Se não há filtros ativos, retornar null para usar dados padrão
      if (!isActive) {
        return null;
      }

      const { data, error } = await supabase.rpc('get_filtered_dashboard_data', {
        p_tenant_id: activeTenant.tenant_id,
        p_start_date: filters.startDate?.toISOString().split('T')[0] || null,
        p_end_date: filters.endDate?.toISOString().split('T')[0] || null,
        p_office_ids: filters.officeIds.length > 0 ? filters.officeIds : null,
        p_product_ids: filters.productIds.length > 0 ? filters.productIds : null,
      });

      if (error) {
        console.error('Erro ao buscar dados filtrados:', error);
        throw error;
      }

      return data;
    },
    enabled: !!activeTenant?.tenant_id && isActive,
    staleTime: 1000 * 60 * 2, // 2 minutos
    gcTime: 1000 * 60 * 5, // 5 minutos (antes era cacheTime)
    refetchOnWindowFocus: false,
  });
}
