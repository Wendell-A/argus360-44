/**
 * Hook de Perfil do Usuário
 * Data: 30 de Setembro de 2025
 * 
 * Gerencia dados do perfil, upload de avatar e alterações de credenciais
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface ProfileData {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
}

interface OrganizationData {
  tenant_id: string;
  tenant_name: string;
  office_id: string | null;
  office_name: string | null;
  role: string;
  department_id: string | null;
  department_name: string | null;
  position_id: string | null;
  position_name: string | null;
}

interface CompleteProfile {
  profile: ProfileData;
  organization: OrganizationData;
}

export const useProfile = () => {
  const queryClient = useQueryClient();
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // Buscar dados completos do perfil
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['user-profile-complete'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      console.log('[useProfile] Buscando dados do perfil para usuário:', user.id);

      const { data, error } = await supabase
        .rpc('get_user_profile_complete', { user_uuid: user.id });

      if (error) {
        console.error('[useProfile] Erro ao buscar perfil:', error);
        throw error;
      }

      console.log('[useProfile] Dados recebidos:', data);
      return data as unknown as CompleteProfile;
    },
    staleTime: 300000, // 5 minutos
  });

  // Atualizar informações pessoais
  const updateProfileMutation = useMutation({
    mutationFn: async (updates: Partial<Pick<ProfileData, 'full_name' | 'phone'>>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profile-complete'] });
      toast({
        title: 'Perfil atualizado',
        description: 'Suas informações foram atualizadas com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao atualizar perfil',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Upload de avatar
  const uploadAvatar = async (file: File) => {
    try {
      setIsUploadingAvatar(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      console.log('[useProfile] Iniciando upload de avatar para usuário:', user.id);

      // Validar arquivo
      if (!file.type.startsWith('image/')) {
        throw new Error('O arquivo deve ser uma imagem');
      }

      if (file.size > 5 * 1024 * 1024) { // 5MB
        throw new Error('O arquivo não pode ter mais de 5MB');
      }

      // Upload para Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      console.log('[useProfile] Fazendo upload para:', fileName);

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) {
        console.error('[useProfile] Erro no upload:', uploadError);
        throw uploadError;
      }

      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      console.log('[useProfile] URL pública gerada:', publicUrl);

      // Atualizar perfil com nova URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) {
        console.error('[useProfile] Erro ao atualizar perfil:', updateError);
        throw updateError;
      }

      console.log('[useProfile] Avatar atualizado com sucesso');
      await refetch();

      toast({
        title: 'Avatar atualizado',
        description: 'Seu avatar foi atualizado com sucesso.',
      });
    } catch (error: any) {
      console.error('[useProfile] Erro geral no upload:', error);
      toast({
        title: 'Erro ao fazer upload',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // Alterar email
  const changeEmailMutation = useMutation({
    mutationFn: async (newEmail: string) => {
      const { error } = await supabase.auth.updateUser({
        email: newEmail,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'E-mail de confirmação enviado',
        description: 'Verifique seu novo e-mail para confirmar a alteração.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao alterar e-mail',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Alterar senha
  const changePasswordMutation = useMutation({
    mutationFn: async (newPassword: string) => {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Senha alterada',
        description: 'Sua senha foi alterada com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao alterar senha',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    profileData: data?.profile,
    organizationData: data?.organization,
    isLoading,
    error,
    isUploadingAvatar,
    updateProfile: updateProfileMutation.mutate,
    isUpdatingProfile: updateProfileMutation.isPending,
    uploadAvatar,
    changeEmail: changeEmailMutation.mutate,
    isChangingEmail: changeEmailMutation.isPending,
    changePassword: changePasswordMutation.mutate,
    isChangingPassword: changePasswordMutation.isPending,
    refetch,
  };
};
