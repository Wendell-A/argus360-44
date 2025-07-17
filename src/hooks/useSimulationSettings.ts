
import { useCachedQuery } from '@/hooks/useCachedQuery';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { InterestRateConfig, getDefaultRates } from '@/lib/financial/InterestRates';
import { toast } from 'sonner';

export const useSimulationSettings = () => {
  const { activeTenant } = useAuth();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useCachedQuery(
    ['simulation-settings', activeTenant?.tenant_id],
    {
      queryFn: async () => {
        if (!activeTenant?.tenant_id) return getDefaultRates();

        const { data, error } = await supabase
          .from('simulation_settings')
          .select('setting_key, setting_value')
          .eq('tenant_id', activeTenant.tenant_id)
          .eq('setting_type', 'interest_rates')
          .eq('is_active', true);

        if (error) throw error;

        // Se não há configurações, retorna valores padrão
        if (!data || data.length === 0) {
          return getDefaultRates();
        }

        // Monta objeto de configuração
        const config: Partial<InterestRateConfig> = {};
        data.forEach(item => {
          if (item.setting_key && item.setting_value) {
            const value = typeof item.setting_value === 'object' 
              ? (item.setting_value as any).value 
              : item.setting_value;
            (config as any)[item.setting_key] = value;
          }
        });

        return { ...getDefaultRates(), ...config };
      },
      enabled: !!activeTenant?.tenant_id
    }
  );

  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: InterestRateConfig) => {
      if (!activeTenant?.tenant_id) throw new Error('Tenant não encontrado');

      const settingsToUpdate = [
        { key: 'vehicleFinancingRate', value: newSettings.vehicleFinancingRate },
        { key: 'realEstateFinancingRate', value: newSettings.realEstateFinancingRate },
        { key: 'consortiumAdminRate', value: newSettings.consortiumAdminRate },
        { key: 'consortiumFundRate', value: newSettings.consortiumFundRate },
        { key: 'lastUpdated', value: new Date().toISOString() }
      ];

      for (const setting of settingsToUpdate) {
        await supabase
          .from('simulation_settings')
          .upsert({
            tenant_id: activeTenant.tenant_id,
            setting_type: 'interest_rates',
            setting_key: setting.key,
            setting_value: { value: setting.value },
            description: `Taxa de ${setting.key}`,
            is_active: true
          }, {
            onConflict: 'tenant_id,setting_type,setting_key'
          });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['simulation-settings'] });
      toast.success('Configurações de simulação atualizadas!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar configurações: ' + error.message);
    }
  });

  return {
    settings: settings || getDefaultRates(),
    isLoading,
    updateSettings: updateSettingsMutation.mutate,
    isUpdating: updateSettingsMutation.isPending
  };
};
