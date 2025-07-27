
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
  metadata: any;
  created_at: string;
  updated_at: string;
}

export const useInvitations = () => {
  const { activeTenant, user } = useAuth();
  const queryClient = useQueryClient();

  // Buscar convites do tenant
  const { data: invitations = [], isLoading } = useQuery({
    queryKey: ['invitations', activeTenant?.tenant_id],
    queryFn: async () => {
      if (!activeTenant?.tenant_id) {
        console.log('❌ Tenant não encontrado');
        return [];
      }

      console.log('🔍 Buscando convites para tenant:', activeTenant.tenant_id);

      try {
        const { data, error } = await supabase
          .from('invitations')
          .select(`
            id,
            tenant_id,
            email,
            invited_by,
            role,
            metadata,
            created_at,
            updated_at
          `)
          .eq('tenant_id', activeTenant.tenant_id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('❌ Erro ao buscar convites:', error);
          throw error;
        }

        console.log('✅ Convites encontrados:', data?.length || 0);
        return data as Invitation[];
      } catch (error) {
        console.error('💥 Erro completo na busca de convites:', error);
        throw error;
      }
    },
    enabled: !!activeTenant?.tenant_id,
  });

  // Enviar convite usando padrão Supabase
  const sendInvitation = useMutation({
    mutationFn: async ({ email, role }: { email: string; role: string }) => {
      if (!activeTenant?.tenant_id) throw new Error('Tenant não encontrado');
      if (!user?.id) throw new Error('Usuário não autenticado');

      console.log('📤 Enviando convite via Supabase Auth:', { email, role, tenant_id: activeTenant.tenant_id });

      // Usar função que salva convite no banco e orienta usar o admin panel
      const { data, error } = await supabase.rpc('send_invitation_via_auth', {
        p_tenant_id: activeTenant.tenant_id,
        p_email: email,
        p_role: role as 'owner' | 'admin' | 'manager' | 'user' | 'viewer',
        p_redirect_to: '/dashboard'
      });

      if (error) {
        console.error('❌ Erro ao processar convite:', error);
        throw error;
      }

      console.log('✅ Convite processado:', data);
      return data;
    },
    onSuccess: (data) => {
      console.log('🎉 Convite criado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
      toast.success('Convite criado e email será enviado automaticamente!');
    },
    onError: (error: any) => {
      console.error('💥 Erro ao criar convite:', error);
      if (error.code === '23505') {
        toast.error('Usuário já foi convidado para este tenant');
      } else if (error.code === '42501') {
        toast.error('Permissão negada. Verifique se você tem permissão para enviar convites.');
      } else {
        toast.error('Erro ao criar convite: ' + error.message);
      }
    },
  });

  // Cancelar convite
  const cancelInvitation = useMutation({
    mutationFn: async (invitationId: string) => {
      console.log('❌ Cancelando convite:', invitationId);
      
      const { error } = await supabase
        .from('invitations')
        .delete()
        .eq('id', invitationId);

      if (error) {
        console.error('❌ Erro ao cancelar convite:', error);
        throw error;
      }

      console.log('✅ Convite cancelado com sucesso');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
      toast.success('Convite cancelado com sucesso!');
    },
    onError: (error: any) => {
      console.error('💥 Erro ao cancelar convite:', error);
      if (error.code === '42501') {
        toast.error('Permissão negada. Você não tem permissão para cancelar este convite.');
      } else {
        toast.error('Erro ao cancelar convite: ' + error.message);
      }
    },
  });

  // Reenviar convite (atualizar timestamp)
  const resendInvitation = useMutation({
    mutationFn: async (invitationId: string) => {
      console.log('🔄 Reenviando convite:', invitationId);
      
      const { error } = await supabase
        .from('invitations')
        .update({
          updated_at: new Date().toISOString(),
        })
        .eq('id', invitationId);

      if (error) {
        console.error('❌ Erro ao atualizar convite:', error);
        throw error;
      }

      console.log('✅ Convite marcado para reenvio');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
      toast.success('Convite atualizado! Use o painel administrativo do Supabase para reenviar o email.');
    },
    onError: (error: any) => {
      console.error('💥 Erro ao atualizar convite:', error);
      if (error.code === '42501') {
        toast.error('Permissão negada. Você não tem permissão para atualizar este convite.');
      } else {
        toast.error('Erro ao atualizar convite: ' + error.message);
      }
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
