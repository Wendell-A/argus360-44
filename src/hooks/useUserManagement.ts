
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  avatar_url?: string;
  department?: string;
  position?: string;
  position_id?: string;
  hire_date?: string;
  last_access?: string;
  settings?: any;
  created_at: string;
  updated_at: string;
}

export interface UserTenantAssociation {
  user_id: string;
  tenant_id: string;
  role: Database['public']['Enums']['user_role'];
  office_id?: string;
  department_id?: string;
  team_id?: string;
  active: boolean;
  joined_at?: string;
  profile: UserProfile;
}

export interface UserDependencies {
  sales_count: number;
  commissions_count: number;
  clients_count: number;
  can_delete: boolean;
  dependencies: string[];
}

export const useUserManagement = () => {
  const { activeTenant } = useAuth();
  const queryClient = useQueryClient();

  // Buscar todos os usuários do tenant
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['user-management', activeTenant?.tenant_id],
    queryFn: async (): Promise<UserTenantAssociation[]> => {
      if (!activeTenant?.tenant_id) {
        throw new Error('Tenant não encontrado');
      }

      console.log('🔍 Buscando usuários para gestão:', activeTenant.tenant_id);

      const { data, error } = await supabase
        .from('tenant_users')
        .select(`
          user_id,
          tenant_id,
          role,
          office_id,
          department_id,
          team_id,
          active,
          joined_at,
          created_at,
          updated_at
        `)
        .eq('tenant_id', activeTenant.tenant_id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Erro ao buscar tenant_users:', error);
        throw error;
      }

      // Buscar perfis dos usuários separadamente
      if (!data || data.length === 0) {
        console.log('✅ Nenhum tenant_user encontrado');
        return [];
      }

      const userIds = data.map(item => item.user_id);
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles_masked')
        .select('id, email, full_name, phone, avatar_url, department, position, position_id, hire_date, created_at, updated_at, data_masked')
        .in('id', userIds);

      if (profilesError) {
        console.error('❌ Erro ao buscar profiles:', profilesError);
        throw profilesError;
      }

      console.log('✅ Usuários encontrados:', data?.length || 0);
      
      // Transformar os dados para o formato esperado
      const transformedData = data?.map((item: any) => {
        const profile = profilesData?.find(p => p.id === item.user_id);
        
        return {
          user_id: item.user_id,
          tenant_id: item.tenant_id,
          role: item.role,
          office_id: item.office_id,
          department_id: item.department_id,
          team_id: item.team_id,
          active: item.active,
          joined_at: item.joined_at,
          profile: {
            id: profile?.id || item.user_id,
            email: profile?.email || 'Email não informado',
            full_name: profile?.full_name || 'Nome não informado',
            phone: profile?.phone,
            avatar_url: profile?.avatar_url,
            department: profile?.department,
            position: profile?.position,
            position_id: profile?.position_id,
            hire_date: profile?.hire_date,
            last_access: undefined, // Não disponível na view mascarada
            settings: undefined, // Não disponível na view mascarada
            created_at: profile?.created_at || item.created_at,
            updated_at: profile?.updated_at || item.updated_at,
          }
        };
      }) || [];

      return transformedData as UserTenantAssociation[];
    },
    enabled: !!activeTenant?.tenant_id,
  });

  // Buscar dependências de um usuário específico
  const checkUserDependencies = async (userId: string): Promise<UserDependencies> => {
    if (!activeTenant?.tenant_id) {
      throw new Error('Tenant não encontrado');
    }

    console.log('🔍 Verificando dependências do usuário:', userId);

    // Verificar vendas
    const { count: salesCount } = await supabase
      .from('sales')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', activeTenant.tenant_id)
      .eq('seller_id', userId);

    // Verificar comissões
    const { count: commissionsCount } = await supabase
      .from('commissions')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', activeTenant.tenant_id)
      .eq('recipient_id', userId)
      .eq('recipient_type', 'seller');

    // Verificar clientes responsáveis
    const { count: clientsCount } = await supabase
      .from('clients')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', activeTenant.tenant_id)
      .eq('responsible_user_id', userId);

    const dependencies: string[] = [];
    if (salesCount && salesCount > 0) dependencies.push(`${salesCount} vendas`);
    if (commissionsCount && commissionsCount > 0) dependencies.push(`${commissionsCount} comissões`);
    if (clientsCount && clientsCount > 0) dependencies.push(`${clientsCount} clientes`);

    const canDelete = dependencies.length === 0;

    console.log('📊 Dependências encontradas:', {
      salesCount: salesCount || 0,
      commissionsCount: commissionsCount || 0,
      clientsCount: clientsCount || 0,
      canDelete,
      dependencies
    });

    return {
      sales_count: salesCount || 0,
      commissions_count: commissionsCount || 0,
      clients_count: clientsCount || 0,
      can_delete: canDelete,
      dependencies
    };
  };

  // Atualizar perfil de usuário
  const updateUserProfile = useMutation({
    mutationFn: async ({ userId, profileData }: { userId: string, profileData: Partial<UserProfile> }) => {
      console.log('📝 Atualizando perfil do usuário:', userId, profileData);

      const { error } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', userId);

      if (error) {
        console.error('❌ Erro ao atualizar perfil:', error);
        throw error;
      }

      console.log('✅ Perfil atualizado com sucesso');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-management'] });
      toast.success('Perfil do usuário atualizado com sucesso!');
    },
    onError: (error: any) => {
      console.error('💥 Erro ao atualizar perfil:', error);
      toast.error('Erro ao atualizar perfil: ' + error.message);
    },
  });

  // Atualizar associação tenant_user
  const updateTenantUser = useMutation({
    mutationFn: async ({ 
      userId, 
      tenantData 
    }: { 
      userId: string, 
      tenantData: {
        role?: Database['public']['Enums']['user_role'];
        office_id?: string;
        department_id?: string;
        team_id?: string;
        active?: boolean;
      }
    }) => {
      if (!activeTenant?.tenant_id) {
        throw new Error('Tenant não encontrado');
      }

      console.log('📝 Atualizando associação tenant_user:', userId, tenantData);

      const { error } = await supabase
        .from('tenant_users')
        .update(tenantData)
        .eq('user_id', userId)
        .eq('tenant_id', activeTenant.tenant_id);

      if (error) {
        console.error('❌ Erro ao atualizar tenant_user:', error);
        throw error;
      }

      // Se mudou o office_id, atualizar office_users também
      if (tenantData.office_id !== undefined) {
        if (tenantData.office_id) {
          // Criar ou atualizar office_users
          await supabase
            .from('office_users')
            .upsert({
              user_id: userId,
              office_id: tenantData.office_id,
              tenant_id: activeTenant.tenant_id,
              role: tenantData.role || 'user' as Database['public']['Enums']['user_role'],
              active: tenantData.active !== false
            });
        } else {
          // Remover de office_users se office_id foi removido
          await supabase
            .from('office_users')
            .update({ active: false })
            .eq('user_id', userId)
            .eq('tenant_id', activeTenant.tenant_id);
        }
      }

      console.log('✅ Associação tenant_user atualizada com sucesso');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-management'] });
      toast.success('Dados do usuário atualizados com sucesso!');
    },
    onError: (error: any) => {
      console.error('💥 Erro ao atualizar tenant_user:', error);
      toast.error('Erro ao atualizar dados: ' + error.message);
    },
  });

  // Inativar usuário (soft delete)
  const deactivateUser = useMutation({
    mutationFn: async (userId: string) => {
      if (!activeTenant?.tenant_id) {
        throw new Error('Tenant não encontrado');
      }

      console.log('🔒 Inativando usuário:', userId);

      // Verificar dependências antes de inativar
      const dependencies = await checkUserDependencies(userId);
      
      // Inativar na tenant_users
      const { error: tenantError } = await supabase
        .from('tenant_users')
        .update({ active: false })
        .eq('user_id', userId)
        .eq('tenant_id', activeTenant.tenant_id);

      if (tenantError) {
        console.error('❌ Erro ao inativar tenant_user:', tenantError);
        throw tenantError;
      }

      // Inativar em office_users
      const { error: officeError } = await supabase
        .from('office_users')
        .update({ active: false })
        .eq('user_id', userId)
        .eq('tenant_id', activeTenant.tenant_id);

      if (officeError) {
        console.warn('⚠️ Erro ao inativar office_users:', officeError);
      }

      console.log('✅ Usuário inativado com sucesso', { dependencies });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-management'] });
      toast.success('Usuário inativado com sucesso! Dados históricos foram preservados.');
    },
    onError: (error: any) => {
      console.error('💥 Erro ao inativar usuário:', error);
      toast.error('Erro ao inativar usuário: ' + error.message);
    },
  });

  // Reativar usuário
  const reactivateUser = useMutation({
    mutationFn: async (userId: string) => {
      if (!activeTenant?.tenant_id) {
        throw new Error('Tenant não encontrado');
      }

      console.log('🔓 Reativando usuário:', userId);

      const { error } = await supabase
        .from('tenant_users')
        .update({ active: true })
        .eq('user_id', userId)
        .eq('tenant_id', activeTenant.tenant_id);

      if (error) {
        console.error('❌ Erro ao reativar usuário:', error);
        throw error;
      }

      console.log('✅ Usuário reativado com sucesso');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-management'] });
      toast.success('Usuário reativado com sucesso!');
    },
    onError: (error: any) => {
      console.error('💥 Erro ao reativar usuário:', error);
      toast.error('Erro ao reativar usuário: ' + error.message);
    },
  });

  return {
    users,
    isLoading,
    checkUserDependencies,
    updateUserProfile,
    updateTenantUser,
    deactivateUser,
    reactivateUser,
  };
};
