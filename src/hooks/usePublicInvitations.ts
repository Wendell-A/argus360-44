import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface PublicInvitationLink {
  id: string;
  tenant_id: string;
  created_by: string;
  token: string;
  role: string;
  office_id?: string;
  department_id?: string;
  team_id?: string;
  max_uses?: number;
  current_uses: number;
  expires_at?: string;
  is_active: boolean;
  metadata: any;
  created_at: string;
  updated_at: string;
}

export const usePublicInvitations = () => {
  const { activeTenant, user } = useAuth();
  const queryClient = useQueryClient();

  // Buscar links públicos do tenant
  const { data: publicLinks = [], isLoading } = useQuery({
    queryKey: ['public-invitation-links', activeTenant?.tenant_id],
    queryFn: async () => {
      if (!activeTenant?.tenant_id) {
        console.log('❌ Tenant não encontrado');
        return [];
      }

      console.log('🔍 Buscando links públicos para tenant:', activeTenant.tenant_id);

      try {
        const { data, error } = await supabase
          .from('public_invitation_links')
          .select('*')
          .eq('tenant_id', activeTenant.tenant_id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('❌ Erro ao buscar links públicos:', error);
          throw error;
        }

        console.log('✅ Links públicos encontrados:', data?.length || 0);
        return data as PublicInvitationLink[];
      } catch (error) {
        console.error('💥 Erro completo na busca de links públicos:', error);
        throw error;
      }
    },
    enabled: !!activeTenant?.tenant_id,
  });

  // Criar link público
  const createPublicLink = useMutation({
    mutationFn: async ({
      role,
      office_id,
      department_id,
      team_id,
      max_uses,
      expires_at,
    }: {
      role: string;
      office_id?: string;
      department_id?: string;
      team_id?: string;
      max_uses?: number;
      expires_at?: string;
    }) => {
      if (!activeTenant?.tenant_id) throw new Error('Tenant não encontrado');
      if (!user?.id) throw new Error('Usuário não autenticado');

      console.log('📤 Criando link público:', { role, office_id, max_uses, expires_at });

      // Gerar token
      const { data: tokenData, error: tokenError } = await supabase.rpc('generate_public_invitation_token');
      
      if (tokenError) {
        console.error('❌ Erro ao gerar token:', tokenError);
        throw tokenError;
      }

      // Criar link
      const { data, error } = await supabase
        .from('public_invitation_links')
        .insert({
          tenant_id: activeTenant.tenant_id,
          created_by: user.id,
          token: tokenData,
          role: role as 'owner' | 'admin' | 'manager' | 'user' | 'viewer',
          office_id,
          department_id,
          team_id,
          max_uses,
          expires_at,
          is_active: true,
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao criar link público:', error);
        throw error;
      }

      console.log('✅ Link público criado:', data);
      return data;
    },
    onSuccess: () => {
      console.log('🎉 Link público criado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['public-invitation-links'] });
      toast.success('Link de convite público criado com sucesso!');
    },
    onError: (error: any) => {
      console.error('💥 Erro ao criar link público:', error);
      if (error.code === '42501') {
        toast.error('Permissão negada. Você não tem permissão para criar links públicos.');
      } else {
        toast.error('Erro ao criar link público: ' + error.message);
      }
    },
  });

  // Desativar link público
  const deactivatePublicLink = useMutation({
    mutationFn: async (linkId: string) => {
      console.log('❌ Desativando link público:', linkId);
      
      const { error } = await supabase
        .from('public_invitation_links')
        .update({ is_active: false })
        .eq('id', linkId);

      if (error) {
        console.error('❌ Erro ao desativar link público:', error);
        throw error;
      }

      console.log('✅ Link público desativado com sucesso');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['public-invitation-links'] });
      toast.success('Link público desativado com sucesso!');
    },
    onError: (error: any) => {
      console.error('💥 Erro ao desativar link público:', error);
      if (error.code === '42501') {
        toast.error('Permissão negada. Você não tem permissão para desativar este link.');
      } else {
        toast.error('Erro ao desativar link público: ' + error.message);
      }
    },
  });

  // Ativar link público
  const activatePublicLink = useMutation({
    mutationFn: async (linkId: string) => {
      console.log('✅ Ativando link público:', linkId);
      
      const { error } = await supabase
        .from('public_invitation_links')
        .update({ is_active: true })
        .eq('id', linkId);

      if (error) {
        console.error('❌ Erro ao ativar link público:', error);
        throw error;
      }

      console.log('✅ Link público ativado com sucesso');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['public-invitation-links'] });
      toast.success('Link público ativado com sucesso!');
    },
    onError: (error: any) => {
      console.error('💥 Erro ao ativar link público:', error);
      if (error.code === '42501') {
        toast.error('Permissão negada. Você não tem permissão para ativar este link.');
      } else {
        toast.error('Erro ao ativar link público: ' + error.message);
      }
    },
  });

  return {
    publicLinks,
    isLoading,
    createPublicLink,
    deactivatePublicLink,
    activatePublicLink,
  };
};