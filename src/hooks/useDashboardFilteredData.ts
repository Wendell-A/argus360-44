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
        console.log('🔍 [useDashboardFilteredData] Filtros não ativos, retornando null');
        return null;
      }

      // Converter year/month para start_date/end_date
      let startDate = filters.startDate?.toISOString().split('T')[0] || null;
      let endDate = filters.endDate?.toISOString().split('T')[0] || null;

      // Se year está definido mas não há startDate/endDate customizados
      if (filters.year && !filters.startDate && !filters.endDate) {
        if (filters.month) {
          // Ano e mês específicos
          const year = filters.year;
          const month = filters.month;
          startDate = `${year}-${String(month).padStart(2, '0')}-01`;
          const lastDay = new Date(year, month, 0).getDate();
          endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;
        } else {
          // Apenas ano
          startDate = `${filters.year}-01-01`;
          endDate = `${filters.year}-12-31`;
        }
      }

      console.log('🔍 [useDashboardFilteredData] Chamando RPC com parâmetros:', {
        p_tenant_id: activeTenant.tenant_id,
        p_start_date: startDate,
        p_end_date: endDate,
        p_office_ids: filters.officeIds.length > 0 ? filters.officeIds : null,
        p_product_ids: filters.productIds.length > 0 ? filters.productIds : null,
      });

      const { data, error } = await supabase.rpc('get_filtered_dashboard_data', {
        p_tenant_id: activeTenant.tenant_id,
        p_start_date: startDate,
        p_end_date: endDate,
        p_office_ids: filters.officeIds.length > 0 ? filters.officeIds : null,
        p_product_ids: filters.productIds.length > 0 ? filters.productIds : null,
      });

      if (error) {
        console.error('❌ [useDashboardFilteredData] Erro ao buscar dados filtrados:', error);
        throw error;
      }

      console.log('✅ [useDashboardFilteredData] Dados filtrados recebidos:', data);
      return data;
    },
    enabled: !!activeTenant?.tenant_id && isActive,
    staleTime: 1000 * 60 * 2, // 2 minutos
    gcTime: 1000 * 60 * 5, // 5 minutos (antes era cacheTime)
    refetchOnWindowFocus: false,
  });
}
