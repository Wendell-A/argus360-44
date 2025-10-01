import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type ConversionRateSummary = {
  current_conversions: number;
  conversion_goal: number;
  conversion_rate: number;
  total_entered: number;
  progress_percentage: number;
};

interface UseConversionRateSummaryParams {
  startDate?: string;
  endDate?: string;
  officeId?: string;
}

export const useConversionRateSummary = ({ 
  startDate, 
  endDate,
  officeId 
}: UseConversionRateSummaryParams = {}) => {
  const { activeTenant } = useAuth();

  // Se não houver datas definidas, usar período do mês atual
  const getDefaultDates = () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    return {
      start: firstDay.toISOString().split('T')[0],
      end: lastDay.toISOString().split('T')[0],
    };
  };

  const dates = startDate && endDate 
    ? { start: startDate, end: endDate }
    : getDefaultDates();

  return useQuery({
    queryKey: ['conversion-rate-summary', activeTenant?.tenant_id, officeId, dates.start, dates.end],
    queryFn: async (): Promise<ConversionRateSummary> => {
      if (!activeTenant?.tenant_id) {
        throw new Error('No tenant selected');
      }

      if (!officeId) {
        throw new Error('Office ID is required for conversion rate summary');
      }

      console.debug('[useConversionRateSummary] Fetching data', {
        tenant: activeTenant.tenant_id,
        officeId,
        start: dates.start,
        end: dates.end,
      });

      const { data, error } = await supabase.rpc('get_conversion_rate_summary', {
        p_tenant_id: activeTenant.tenant_id,
        p_office_id: officeId,
        p_start_date: dates.start,
        p_end_date: dates.end,
      });

      if (error) {
        console.error('[useConversionRateSummary] RPC error:', error);
        throw error;
      }

      // A RPC retorna um array com um único registro
      const result = data?.[0];
      
      if (!result) {
        // Retornar valores padrão se não houver dados
        return {
          current_conversions: 0,
          conversion_goal: 0,
          conversion_rate: 0,
          total_entered: 0,
          progress_percentage: 0,
        };
      }

      return {
        current_conversions: result.current_conversions || 0,
        conversion_goal: result.conversion_goal || 0,
        conversion_rate: result.conversion_rate || 0,
        total_entered: result.total_entered || 0,
        progress_percentage: result.progress_percentage || 0,
      };
    },
    enabled: !!activeTenant?.tenant_id && !!officeId,
    staleTime: 2 * 60 * 1000, // Cache por 2 minutos
    refetchOnWindowFocus: false,
  });
};
