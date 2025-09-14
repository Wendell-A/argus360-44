import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export type SupportTicketStatus = 'open' | 'in_progress' | 'pending_user' | 'resolved' | 'closed';
export type SupportTicketPriority = 'low' | 'normal' | 'high' | 'urgent';
export type SupportTicketCategory = 'bug' | 'feature_request' | 'technical_support' | 'account' | 'billing' | 'training' | 'other';

export interface SupportTicket {
  id: string;
  tenant_id: string;
  user_id: string;
  assigned_to?: string;
  title: string;
  description: string;
  category: SupportTicketCategory;
  priority: SupportTicketPriority;
  status: SupportTicketStatus;
  resolution?: string;
  resolved_at?: string;
  closed_at?: string;
  created_at: string;
  updated_at: string;
  settings?: any;
}

export interface CreateTicketData {
  title: string;
  description: string;
  category: SupportTicketCategory;
  priority: SupportTicketPriority;
}

export interface UpdateTicketData {
  title?: string;
  description?: string;
  category?: SupportTicketCategory;
  priority?: SupportTicketPriority;
  status?: SupportTicketStatus;
  resolution?: string;
}

export const useSupportTickets = (filters?: {
  status?: SupportTicketStatus[];
  priority?: SupportTicketPriority[];
  category?: SupportTicketCategory[];
}) => {
  const { activeTenant } = useAuth();

  return useQuery({
    queryKey: ['support-tickets', activeTenant?.tenant_id, filters],
    queryFn: async (): Promise<SupportTicket[]> => {
      if (!activeTenant?.tenant_id) {
        throw new Error('Tenant não encontrado');
      }

      console.log('🎫 Buscando tickets de suporte...');

      let query = supabase
        .from('support_tickets')
        .select('*')
        .eq('tenant_id', activeTenant.tenant_id)
        .order('created_at', { ascending: false });

      // Aplicar filtros se fornecidos
      if (filters?.status && filters.status.length > 0) {
        query = query.in('status', filters.status);
      }
      if (filters?.priority && filters.priority.length > 0) {
        query = query.in('priority', filters.priority);
      }
      if (filters?.category && filters.category.length > 0) {
        query = query.in('category', filters.category);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ Erro ao buscar tickets:', error);
        throw error;
      }

      console.log('✅ Tickets carregados:', data?.length);
      return data || [];
    },
    enabled: !!activeTenant?.tenant_id,
    staleTime: 30 * 1000, // 30 segundos
  });
};

export const useSupportTicket = (ticketId: string) => {
  const { activeTenant } = useAuth();

  return useQuery({
    queryKey: ['support-ticket', ticketId],
    queryFn: async (): Promise<SupportTicket> => {
      if (!activeTenant?.tenant_id || !ticketId) {
        throw new Error('Dados insuficientes para buscar ticket');
      }

      console.log('🎫 Buscando ticket:', ticketId);

      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('id', ticketId)
        .eq('tenant_id', activeTenant.tenant_id)
        .single();

      if (error) {
        console.error('❌ Erro ao buscar ticket:', error);
        throw error;
      }

      console.log('✅ Ticket carregado:', data);
      return data;
    },
    enabled: !!activeTenant?.tenant_id && !!ticketId,
  });
};

export const useCreateSupportTicket = () => {
  const { activeTenant, user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateTicketData): Promise<SupportTicket> => {
      if (!activeTenant?.tenant_id || !user?.id) {
        throw new Error('Usuário ou tenant não encontrado');
      }

      console.log('🎫 Criando ticket de suporte:', data);

      const ticketData = {
        tenant_id: activeTenant.tenant_id,
        user_id: user.id,
        ...data,
      };

      const { data: newTicket, error } = await supabase
        .from('support_tickets')
        .insert([ticketData])
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao criar ticket:', error);
        throw error;
      }

      console.log('✅ Ticket criado:', newTicket);
      return newTicket;
    },
    onSuccess: () => {
      // Invalidar cache para atualizar lista
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      
      toast({
        title: "Ticket criado com sucesso",
        description: "Seu chamado foi registrado e será processado em breve.",
      });
    },
    onError: (error) => {
      console.error('❌ Erro ao criar ticket:', error);
      toast({
        title: "Erro ao criar ticket",
        description: "Ocorreu um erro ao registrar seu chamado. Tente novamente.",
        variant: "destructive",
      });
    },
  });
};

export const useUpdateSupportTicket = () => {
  const { activeTenant } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateTicketData }): Promise<SupportTicket> => {
      if (!activeTenant?.tenant_id) {
        throw new Error('Tenant não encontrado');
      }

      console.log('🎫 Atualizando ticket:', id, data);

      const updateData: any = { ...data };
      
      // Se está resolvendo ou fechando, adicionar timestamps
      if (data.status === 'resolved' && !updateData.resolved_at) {
        updateData.resolved_at = new Date().toISOString();
      }
      if (data.status === 'closed' && !updateData.closed_at) {
        updateData.closed_at = new Date().toISOString();
      }

      const { data: updatedTicket, error } = await supabase
        .from('support_tickets')
        .update(updateData)
        .eq('id', id)
        .eq('tenant_id', activeTenant.tenant_id)
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao atualizar ticket:', error);
        throw error;
      }

      console.log('✅ Ticket atualizado:', updatedTicket);
      return updatedTicket;
    },
    onSuccess: () => {
      // Invalidar cache para atualizar dados
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['support-ticket'] });
      
      toast({
        title: "Ticket atualizado com sucesso",
        description: "As alterações foram salvas.",
      });
    },
    onError: (error) => {
      console.error('❌ Erro ao atualizar ticket:', error);
      toast({
        title: "Erro ao atualizar ticket",
        description: "Ocorreu um erro ao salvar as alterações. Tente novamente.",
        variant: "destructive",
      });
    },
  });
};

export const useSupportTicketsStats = () => {
  const { activeTenant } = useAuth();

  return useQuery({
    queryKey: ['support-tickets-stats', activeTenant?.tenant_id],
    queryFn: async () => {
      if (!activeTenant?.tenant_id) {
        throw new Error('Tenant não encontrado');
      }

      console.log('📊 Buscando estatísticas de tickets...');

      // Buscar contadores por status
      const { data: statusCounts, error: statusError } = await supabase
        .from('support_tickets')
        .select('status')
        .eq('tenant_id', activeTenant.tenant_id);

      if (statusError) {
        console.error('❌ Erro ao buscar estatísticas:', statusError);
        throw statusError;
      }

      // Calcular estatísticas
      const stats = {
        total: statusCounts?.length || 0,
        open: statusCounts?.filter(t => t.status === 'open').length || 0,
        in_progress: statusCounts?.filter(t => t.status === 'in_progress').length || 0,
        resolved: statusCounts?.filter(t => t.status === 'resolved').length || 0,
        closed: statusCounts?.filter(t => t.status === 'closed').length || 0,
      };

      console.log('✅ Estatísticas carregadas:', stats);
      return stats;
    },
    enabled: !!activeTenant?.tenant_id,
    staleTime: 60 * 1000, // 1 minuto
  });
};