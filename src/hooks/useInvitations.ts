
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
  const { activeTenant, user } = useAuth();
  const queryClient = useQueryClient();

  // Buscar convites do tenant - Política RLS corrigida
  const { data: invitations = [], isLoading } = useQuery({
    queryKey: ['invitations', activeTenant?.tenant_id],
    queryFn: async () => {
      if (!activeTenant?.tenant_id) {
        console.log('❌ Tenant não encontrado');
        return [];
      }

      console.log('🔍 Buscando convites para tenant:', activeTenant.tenant_id);

      try {
        // Query totalmente isolada - sem referências externas
        const { data, error } = await supabase
          .from('invitations')
          .select(`
            id,
            tenant_id,
            email,
            invited_by,
            role,
            token,
            status,
            expires_at,
            accepted_at,
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

  // Enviar convite
  const sendInvitation = useMutation({
    mutationFn: async ({ email, role }: { email: string; role: string }) => {
      if (!activeTenant?.tenant_id) throw new Error('Tenant não encontrado');
      if (!user?.id) throw new Error('Usuário não autenticado');

      console.log('📤 Iniciando envio de convite:', { email, role, tenant_id: activeTenant.tenant_id });

      try {
        // Gerar token usando a função corrigida
        console.log('🔑 Gerando token de convite...');
        const tokenResult = await supabase.rpc('generate_invitation_token');
        
        if (tokenResult.error) {
          console.error('❌ Erro ao gerar token:', tokenResult.error);
          throw tokenResult.error;
        }

        console.log('✅ Token gerado com sucesso:', tokenResult.data ? 'sim' : 'não');

        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // Expira em 7 dias

        console.log('💾 Salvando convite no banco...');
        const { data, error } = await supabase
          .from('invitations')
          .insert({
            tenant_id: activeTenant.tenant_id,
            email,
            invited_by: user.id,
            role: role as 'owner' | 'admin' | 'manager' | 'user' | 'viewer',
            token: tokenResult.data,
            expires_at: expiresAt.toISOString(),
          })
          .select()
          .single();

        if (error) {
          console.error('❌ Erro ao salvar convite:', error);
          throw error;
        }

        console.log('✅ Convite salvo com sucesso:', data.id);
        return data;
      } catch (error) {
        console.error('❌ Erro completo no envio de convite:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log('🎉 Convite enviado com sucesso! ID:', data.id);
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
      toast.success('Convite enviado com sucesso!');
    },
    onError: (error: any) => {
      console.error('💥 Erro final ao enviar convite:', error);
      if (error.code === '23505') {
        toast.error('Usuário já foi convidado para este tenant');
      } else if (error.message.includes('generate_invitation_token')) {
        toast.error('Erro interno no sistema de tokens. Entre em contato com suporte.');
      } else if (error.code === '42501') {
        toast.error('Permissão negada. Verifique se você tem permissão para enviar convites.');
      } else {
        toast.error('Erro ao enviar convite: ' + error.message);
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

  // Reenviar convite
  const resendInvitation = useMutation({
    mutationFn: async (invitationId: string) => {
      console.log('🔄 Reenviando convite:', invitationId);
      
      try {
        // Gerar novo token
        console.log('🔑 Gerando novo token...');
        const tokenResult = await supabase.rpc('generate_invitation_token');
        if (tokenResult.error) {
          console.error('❌ Erro ao gerar novo token:', tokenResult.error);
          throw tokenResult.error;
        }

        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        console.log('🔄 Atualizando convite...');
        const { error } = await supabase
          .from('invitations')
          .update({
            token: tokenResult.data,
            expires_at: expiresAt.toISOString(),
            status: 'pending',
          })
          .eq('id', invitationId);

        if (error) {
          console.error('❌ Erro ao atualizar convite:', error);
          throw error;
        }

        console.log('✅ Convite reenviado com sucesso');
      } catch (error) {
        console.error('💥 Erro no reenvio de convite:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
      toast.success('Convite reenviado com sucesso!');
    },
    onError: (error: any) => {
      console.error('💥 Erro ao reenviar convite:', error);
      if (error.code === '42501') {
        toast.error('Permissão negada. Você não tem permissão para reenviar este convite.');
      } else if (error.message.includes('generate_invitation_token')) {
        toast.error('Erro interno no sistema de tokens. Entre em contato com suporte.');
      } else {
        toast.error('Erro ao reenviar convite: ' + error.message);
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
