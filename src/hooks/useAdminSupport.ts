import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface SupportTicket {
  id: string;
  tenant_id: string;
  user_id: string;
  assigned_to: string | null;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  resolution: string | null;
  resolved_at: string | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
  settings: any;
}

export interface TicketComment {
  id: string;
  ticket_id: string;
  user_id: string;
  content: string;
  is_internal: boolean;
  attachments: any;
  created_at: string;
  updated_at: string;
}

export interface TicketWithTenant extends SupportTicket {
  tenants?: {
    name: string;
  };
  profiles?: {
    full_name: string;
    email: string;
  };
}

// ============ TICKETS ============

export const useAdminSupportTickets = (filters?: {
  status?: string;
  priority?: string;
  category?: string;
}) => {
  return useQuery({
    queryKey: ['admin-support-tickets', filters],
    queryFn: async () => {
      let query = supabase
        .from('support_tickets')
        .select(`
          *,
          tenants:tenant_id (name)
        `)
        .order('created_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status as any);
      }
      if (filters?.priority) {
        query = query.eq('priority', filters.priority as any);
      }
      if (filters?.category) {
        query = query.eq('category', filters.category as any);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as any[];
    },
  });
};

export const useAdminSupportTicket = (ticketId: string) => {
  return useQuery({
    queryKey: ['admin-support-ticket', ticketId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('support_tickets')
        .select(`
          *,
          tenants:tenant_id (name)
        `)
        .eq('id', ticketId)
        .single();

      if (error) throw error;
      return data as any;
    },
    enabled: !!ticketId,
  });
};

export const useTicketComments = (ticketId: string) => {
  return useQuery({
    queryKey: ['ticket-comments', ticketId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('support_ticket_comments')
        .select(`
          *,
          profiles:user_id (full_name, email)
        `)
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!ticketId,
  });
};

export const useCreateTicketComment = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      ticket_id,
      content,
      is_internal = true,
    }: {
      ticket_id: string;
      content: string;
      is_internal?: boolean;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('support_ticket_comments')
        .insert({
          ticket_id,
          user_id: user.id,
          content,
          is_internal,
          attachments: [],
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ticket-comments', variables.ticket_id] });
      queryClient.invalidateQueries({ queryKey: ['admin-support-ticket', variables.ticket_id] });
      toast({
        title: 'Resposta enviada',
        description: 'Sua resposta foi enviada com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao enviar resposta',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

export const useUpdateTicketStatus = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      ticketId,
      status,
      resolution,
    }: {
      ticketId: string;
      status: string;
      resolution?: string;
    }) => {
      const updates: any = { status };

      if (status === 'resolved' && resolution) {
        updates.resolution = resolution;
        updates.resolved_at = new Date().toISOString();
      }

      if (status === 'closed') {
        updates.closed_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('support_tickets')
        .update(updates)
        .eq('id', ticketId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-support-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['admin-support-ticket', variables.ticketId] });
      toast({
        title: 'Status atualizado',
        description: 'O status do ticket foi atualizado com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao atualizar status',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

// ============ ESTATÍSTICAS ============

export const useTicketStats = () => {
  return useQuery({
    queryKey: ['admin-ticket-stats'],
    queryFn: async () => {
      const { data: tickets, error } = await supabase
        .from('support_tickets')
        .select('status, priority, category');

      if (error) throw error;

      const stats = {
        total: tickets.length,
        open: tickets.filter(t => t.status === 'open').length,
        in_progress: tickets.filter(t => t.status === 'in_progress').length,
        resolved: tickets.filter(t => t.status === 'resolved').length,
        closed: tickets.filter(t => t.status === 'closed').length,
        high_priority: tickets.filter(t => t.priority === 'high').length,
        urgent_priority: tickets.filter(t => t.priority === 'urgent').length,
      };

      return stats;
    },
  });
};
