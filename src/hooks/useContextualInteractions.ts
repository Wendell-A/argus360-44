import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ContextualInteraction {
  id: string;
  tenant_id: string;
  client_id: string;
  seller_id: string;
  status: string;
  title: string;
  description?: string;
  interaction_type: string;
  outcome?: string;
  priority: string;
  next_action?: string;
  scheduled_at?: string;
  completed_at?: string;
  next_action_date?: string;
  settings?: any;
  created_at: string;
  updated_at: string;
}

export interface ContextualInteractionInsert {
  tenant_id: string;
  client_id: string;
  seller_id?: string;
  status?: string;
  title: string;
  description?: string;
  interaction_type: string;
  outcome?: string;
  priority?: string;
  next_action?: string;
  scheduled_at?: string;
  next_action_date?: string;
  settings?: any;
}

export interface ContextualInteractionUpdate {
  status?: string;
  title?: string;
  description?: string;
  interaction_type?: string;
  outcome?: string;
  priority?: string;
  next_action?: string;
  scheduled_at?: string;
  completed_at?: string;
  next_action_date?: string;
  settings?: any;
}

export function useContextualInteractions(clientId?: string, enabled: boolean = true) {
  const { user, activeTenant } = useAuth();

  return useQuery({
    queryKey: ['contextual-interactions', user?.id, activeTenant?.tenant_id, clientId],
    queryFn: async (): Promise<ContextualInteraction[]> => {
      if (!user?.id || !activeTenant?.tenant_id) {
        console.log('❌ [useContextualInteractions] Usuário ou tenant não encontrado');
        throw new Error('Usuário ou tenant não encontrado');
      }

      console.log('🔍 [useContextualInteractions] Buscando interações contextuais:', {
        user_id: user.id,
        tenant_id: activeTenant.tenant_id,
        client_id: clientId
      });

      const { data, error } = await supabase.rpc('get_contextual_interactions', {
        user_uuid: user.id,
        tenant_uuid: activeTenant.tenant_id
      });

      if (error) {
        console.error('❌ [useContextualInteractions] Erro ao buscar interações contextuais:', error);
        throw error;
      }

      console.log('✅ [useContextualInteractions] Interações encontradas:', data?.length || 0);

      // Filtrar por cliente específico se fornecido
      const filteredData = clientId 
        ? (data || []).filter((interaction: ContextualInteraction) => interaction.client_id === clientId)
        : (data || []);

      console.log('🎯 [useContextualInteractions] Interações após filtro de cliente:', {
        total: data?.length || 0,
        filtered: filteredData.length,
        client_id: clientId
      });

      return filteredData;
    },
    enabled: enabled && !!user?.id && !!activeTenant?.tenant_id,
    staleTime: 2 * 60 * 1000, // 2 minutos
    gcTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: false,
  });
}

export function useCreateContextualInteraction() {
  const { user, activeTenant } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (interaction: ContextualInteractionInsert): Promise<ContextualInteraction> => {
      if (!user?.id || !activeTenant?.tenant_id) {
        throw new Error('Usuário ou tenant não encontrado');
      }

      console.log('📝 [useCreateContextualInteraction] Criando nova interação:', interaction);

      const { data, error } = await supabase
        .from('client_interactions')
        .insert({
          ...interaction,
          tenant_id: activeTenant.tenant_id,
          seller_id: interaction.seller_id || user.id,
        })
        .select()
        .single();

      if (error) {
        console.error('❌ [useCreateContextualInteraction] Erro ao criar interação:', error);
        throw error;
      }

      console.log('✅ [useCreateContextualInteraction] Interação criada com sucesso:', data.id);
      return data;
    },
    onSuccess: () => {
      // Invalidar todas as queries relacionadas a interações contextuais
      queryClient.invalidateQueries({ queryKey: ['contextual-interactions'] });
      queryClient.invalidateQueries({ queryKey: ['client_interactions'] });
    },
  });
}

export function useUpdateContextualInteraction() {
  const { user, activeTenant } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: ContextualInteractionUpdate }): Promise<ContextualInteraction> => {
      if (!user?.id || !activeTenant?.tenant_id) {
        throw new Error('Usuário ou tenant não encontrado');
      }

      console.log('📝 [useUpdateContextualInteraction] Atualizando interação:', { id, updates });

      const { data, error } = await supabase
        .from('client_interactions')
        .update(updates)
        .eq('id', id)
        .eq('tenant_id', activeTenant.tenant_id)
        .select()
        .single();

      if (error) {
        console.error('❌ [useUpdateContextualInteraction] Erro ao atualizar interação:', error);
        throw error;
      }

      console.log('✅ [useUpdateContextualInteraction] Interação atualizada com sucesso:', data.id);
      return data;
    },
    onSuccess: () => {
      // Invalidar todas as queries relacionadas a interações contextuais
      queryClient.invalidateQueries({ queryKey: ['contextual-interactions'] });
      queryClient.invalidateQueries({ queryKey: ['client_interactions'] });
    },
  });
}