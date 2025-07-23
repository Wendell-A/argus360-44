
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Invitation {
  id: string;
  tenant_id: string;
  email: string;
  invited_by: string;
  role: string;
  token: string;
  status: 'pending' | 'accepted' | 'expired';
  expires_at: string;
  accepted_at?: string;
  created_at: string;
  updated_at: string;
}

export const useInvitations = () => {
  const { activeTenant } = useAuth();
  const queryClient = useQueryClient();

  // Buscar convites do tenant
  const { data: invitations = [], isLoading } = useQuery({
    queryKey: ['invitations', activeTenant?.tenant_id],
    queryFn: async () => {
      if (!activeTenant?.tenant_id) return [];

      const { data, error } = await supabase
        .from('invitations')
        .select('*')
        .eq('tenant_id', activeTenant.tenant_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Invitation[];
    },
    enabled: !!activeTenant?.tenant_id,
  });

  // Enviar convite
  const sendInvitation = useMutation({
    mutationFn: async ({ email, role }: { email: string; role: string }) => {
      if (!activeTenant?.tenant_id) throw new Error('Tenant não encontrado');

      const token = await supabase.rpc('generate_invitation_token');
      if (token.error) throw token.error;

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // Expira em 7 dias

      const { data, error } = await supabase
        .from('invitations')
        .insert({
          tenant_id: activeTenant.tenant_id,
          email,
          role: role as 'owner' | 'admin' | 'manager' | 'user' | 'viewer',
          token: token.data,
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
      toast.success('Convite enviado com sucesso!');
    },
    onError: (error: any) => {
      if (error.code === '23505') {
        toast.error('Usuário já foi convidado para este tenant');
      } else {
        toast.error('Erro ao enviar convite: ' + error.message);
      }
    },
  });

  // Cancelar convite
  const cancelInvitation = useMutation({
    mutationFn: async (invitationId: string) => {
      const { error } = await supabase
        .from('invitations')
        .delete()
        .eq('id', invitationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
      toast.success('Convite cancelado com sucesso!');
    },
    onError: (error: any) => {
      toast.error('Erro ao cancelar convite: ' + error.message);
    },
  });

  // Reenviar convite
  const resendInvitation = useMutation({
    mutationFn: async (invitationId: string) => {
      const token = await supabase.rpc('generate_invitation_token');
      if (token.error) throw token.error;

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const { error } = await supabase
        .from('invitations')
        .update({
          token: token.data,
          expires_at: expiresAt.toISOString(),
          status: 'pending',
        })
        .eq('id', invitationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
      toast.success('Convite reenviado com sucesso!');
    },
    onError: (error: any) => {
      toast.error('Erro ao reenviar convite: ' + error.message);
    },
  });

  return {
    invitations,
    isLoading,
    sendInvitation,
    cancelInvitation,
    resendInvitation,
  };
};
