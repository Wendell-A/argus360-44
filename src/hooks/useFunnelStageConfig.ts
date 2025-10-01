import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { z } from 'zod';

// Schema de validação para configuração de etapas
const stageConfigSchema = z.object({
  stageId: z.string().uuid({ message: 'ID da etapa inválido' }),
  isInitialStage: z.boolean(),
  isFinalStage: z.boolean(),
});

type StageConfigUpdate = z.infer<typeof stageConfigSchema>;

export function useUpdateFunnelStageConfig() {
  const queryClient = useQueryClient();
  const { activeTenant } = useAuth();

  return useMutation({
    mutationFn: async (data: StageConfigUpdate) => {
      if (!activeTenant?.tenant_id) {
        throw new Error('Nenhum tenant selecionado');
      }

      // Validar dados de entrada
      const validated = stageConfigSchema.parse(data);

      console.log('🔧 Atualizando configuração da etapa:', validated);

      // Se estamos marcando como inicial, desmarcar outras etapas iniciais
      if (validated.isInitialStage) {
        const { error: clearInitialError } = await supabase
          .from('sales_funnel_stages')
          .update({ is_initial_stage: false })
          .eq('tenant_id', activeTenant.tenant_id)
          .neq('id', validated.stageId);

        if (clearInitialError) {
          console.error('Erro ao limpar etapas iniciais:', clearInitialError);
          throw clearInitialError;
        }
      }

      // Se estamos marcando como final, desmarcar outras etapas finais
      if (validated.isFinalStage) {
        const { error: clearFinalError } = await supabase
          .from('sales_funnel_stages')
          .update({ is_final_stage: false })
          .eq('tenant_id', activeTenant.tenant_id)
          .neq('id', validated.stageId);

        if (clearFinalError) {
          console.error('Erro ao limpar etapas finais:', clearFinalError);
          throw clearFinalError;
        }
      }

      // Atualizar a etapa selecionada
      const { data: result, error } = await supabase
        .from('sales_funnel_stages')
        .update({
          is_initial_stage: validated.isInitialStage,
          is_final_stage: validated.isFinalStage,
        })
        .eq('id', validated.stageId)
        .eq('tenant_id', activeTenant.tenant_id)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar configuração da etapa:', error);
        throw error;
      }

      console.log('✅ Configuração da etapa atualizada:', result);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales_funnel_stages'] });
      queryClient.invalidateQueries({ queryKey: ['conversion-rate-summary'] });
      toast.success('Configuração do funil atualizada!', {
        description: 'As etapas de conversão foram configuradas com sucesso.',
      });
    },
    onError: (error: any) => {
      console.error('❌ Erro na mutação de configuração:', error);
      toast.error('Erro ao configurar funil', {
        description: error?.message || 'Não foi possível atualizar a configuração. Tente novamente.',
      });
    },
  });
}

export function useClearFunnelStageConfig() {
  const queryClient = useQueryClient();
  const { activeTenant } = useAuth();

  return useMutation({
    mutationFn: async (stageId: string) => {
      if (!activeTenant?.tenant_id) {
        throw new Error('Nenhum tenant selecionado');
      }

      // Validar stageId
      const validated = z.string().uuid().parse(stageId);

      console.log('🔧 Limpando configuração da etapa:', validated);

      const { data: result, error } = await supabase
        .from('sales_funnel_stages')
        .update({
          is_initial_stage: false,
          is_final_stage: false,
        })
        .eq('id', validated)
        .eq('tenant_id', activeTenant.tenant_id)
        .select()
        .single();

      if (error) {
        console.error('Erro ao limpar configuração da etapa:', error);
        throw error;
      }

      console.log('✅ Configuração da etapa limpa:', result);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales_funnel_stages'] });
      queryClient.invalidateQueries({ queryKey: ['conversion-rate-summary'] });
      toast.success('Configuração removida!');
    },
    onError: (error: any) => {
      console.error('❌ Erro ao limpar configuração:', error);
      toast.error('Erro ao limpar configuração', {
        description: error?.message || 'Não foi possível limpar a configuração.',
      });
    },
  });
}
