
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Tables, Enums } from '@/integrations/supabase/types';

type Permission = Tables<'permissions'>;
type RolePermission = Tables<'role_permissions'>;
type UserPermission = Tables<'user_permissions'>;
type UserRole = Enums<'user_role'>;

interface PermissionCheck {
  module: string;
  resource: string;
  action: string;
}

// Tipo para permissões granulares
interface GranularPermissions {
  [key: string]: {
    create: boolean;
    read: boolean;
    update: boolean;
    delete: boolean;
    manage?: boolean;
  };
}

// Tipo estendido de Tenant com granular_permissions
type TenantWithGranular = Tables<'tenant_users'> & {
  granular_permissions?: GranularPermissions;
};

export const usePermissions = () => {
  const { user, activeTenant } = useAuth();
  const queryClient = useQueryClient();

  // Buscar todas as permissões disponíveis
  const { data: allPermissions, isLoading: loadingPermissions } = useQuery({
    queryKey: ['permissions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('permissions')
        .select('*')
        .order('module', { ascending: true });

      if (error) throw error;
      return data as Permission[];
    },
    enabled: !!user,
  });

  // Buscar permissões específicas do usuário
  const { data: userPermissions, isLoading: loadingUserPermissions } = useQuery({
    queryKey: ['user-permissions', user?.id, activeTenant?.tenant_id],
    queryFn: async () => {
      if (!user?.id || !activeTenant?.tenant_id) return [];

      const { data, error } = await supabase
        .from('user_permissions')
        .select(`
          *,
          permissions (*)
        `)
        .eq('user_id', user.id)
        .eq('tenant_id', activeTenant.tenant_id);

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id && !!activeTenant?.tenant_id,
  });

  // Buscar permissões da função do usuário
  const { data: rolePermissions, isLoading: loadingRolePermissions } = useQuery({
    queryKey: ['role-permissions', activeTenant?.user_role, activeTenant?.tenant_id],
    queryFn: async () => {
      if (!activeTenant?.user_role || !activeTenant?.tenant_id) return [];

      const { data, error } = await supabase
        .from('role_permissions')
        .select(`
          *,
          permissions (*)
        `)
        .eq('role', activeTenant.user_role as UserRole)
        .eq('tenant_id', activeTenant.tenant_id);

      if (error) throw error;
      return data;
    },
    enabled: !!activeTenant?.user_role && !!activeTenant?.tenant_id,
  });

  // Nova função para buscar permissões de uma role específica
  const useRolePermissions = (role: string) => {
    return useQuery({
      queryKey: ['specific-role-permissions', role, activeTenant?.tenant_id],
      queryFn: async () => {
        if (!role || !activeTenant?.tenant_id) return [];

        const { data, error } = await supabase
          .from('role_permissions')
          .select(`
            *,
            permissions (*)
          `)
          .eq('role', role as UserRole)
          .eq('tenant_id', activeTenant.tenant_id);

        if (error) throw error;
        return data;
      },
      enabled: !!role && !!activeTenant?.tenant_id,
    });
  };

  // Verificar se o usuário tem uma permissão específica (suporta formato granular)
  const hasPermission = (check: PermissionCheck | string): boolean => {
    if (!user || !activeTenant) return false;

    // Suportar formato granular: "module:resource.action"
    let module: string, resource: string, action: string;
    
    if (typeof check === 'string') {
      const parts = check.split('.');
      if (parts.length === 2) {
        const [moduleResource, actionPart] = parts;
        const [modulePart, resourcePart] = moduleResource.split(':');
        module = modulePart;
        resource = resourcePart;
        action = actionPart;
      } else {
        console.warn('Formato de permissão inválido:', check);
        return false;
      }
    } else {
      ({ module, resource, action } = check);
    }

    // Owner e Admin sempre têm acesso
    if (['owner', 'admin'].includes(activeTenant.user_role)) {
      return true;
    }

    // 1. Verificar permissões granulares do usuário
    const tenantData = activeTenant as unknown as TenantWithGranular;
    const granularPerms = tenantData.granular_permissions;
    const moduleKey = `${module}:${resource}`;
    
    if (granularPerms && granularPerms[moduleKey]) {
      const permissions = granularPerms[moduleKey];
      
      // Se tem 'manage', tem todas as permissões
      if (permissions.manage) return true;
      
      // Verificar ação específica
      if (action === 'create' && permissions.create) return true;
      if (action === 'read' && permissions.read) return true;
      if (action === 'update' && permissions.update) return true;
      if (action === 'delete' && permissions.delete) return true;
    }

    // 2. Verificar permissões específicas do usuário (sistema antigo)
    const userHasPermission = userPermissions?.some(up => {
      const permission = up.permissions as Permission;
      return permission.module === module &&
             permission.resource === resource &&
             permission.actions.includes(action);
    });

    if (userHasPermission) return true;

    // 3. Verificar permissões da função (sistema antigo)
    const roleHasPermission = rolePermissions?.some(rp => {
      const permission = rp.permissions as Permission;
      return permission.module === module &&
             permission.resource === resource &&
             permission.actions.includes(action);
    });

    return roleHasPermission || false;
  };

  // Verificar múltiplas permissões (suporta formato granular)
  const hasAnyPermission = (checks: (PermissionCheck | string)[]): boolean => {
    return checks.some(check => hasPermission(check));
  };

  const hasAllPermissions = (checks: (PermissionCheck | string)[]): boolean => {
    return checks.every(check => hasPermission(check));
  };

  // Obter todas as permissões do usuário (da função + específicas)
  const getUserPermissions = (): Permission[] => {
    const rolePerms = rolePermissions?.map(rp => rp.permissions as Permission) || [];
    const userPerms = userPermissions?.map(up => up.permissions as Permission) || [];
    
    // Remover duplicadas
    const allPerms = [...rolePerms, ...userPerms];
    const uniquePerms = allPerms.filter((perm, index, self) => 
      index === self.findIndex(p => p.id === perm.id)
    );

    return uniquePerms;
  };

  // Mutation para conceder permissão específica a usuário
  const grantUserPermission = useMutation({
    mutationFn: async ({ userId, permissionId }: { userId: string; permissionId: string }) => {
      if (!activeTenant?.tenant_id) throw new Error('Tenant não encontrado');

      const { data, error } = await supabase
        .from('user_permissions')
        .insert({
          user_id: userId,
          tenant_id: activeTenant.tenant_id,
          permission_id: permissionId,
          granted_by: user?.id,
        });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-permissions'] });
    },
  });

  // Mutation para revogar permissão específica de usuário
  const revokeUserPermission = useMutation({
    mutationFn: async ({ userId, permissionId }: { userId: string; permissionId: string }) => {
      if (!activeTenant?.tenant_id) throw new Error('Tenant não encontrado');

      const { error } = await supabase
        .from('user_permissions')
        .delete()
        .eq('user_id', userId)
        .eq('tenant_id', activeTenant.tenant_id)
        .eq('permission_id', permissionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-permissions'] });
    },
  });

  // Mutation para configurar permissões de uma função
  const updateRolePermissions = useMutation({
    mutationFn: async ({ role, permissionIds }: { role: string; permissionIds: string[] }) => {
      if (!activeTenant?.tenant_id) throw new Error('Tenant não encontrado');

      // Remover permissões existentes da função
      await supabase
        .from('role_permissions')
        .delete()
        .eq('role', role as UserRole)
        .eq('tenant_id', activeTenant.tenant_id);

      // Adicionar novas permissões
      if (permissionIds.length > 0) {
        const { error } = await supabase
          .from('role_permissions')
          .insert(
            permissionIds.map(permissionId => ({
              role: role as UserRole,
              tenant_id: activeTenant.tenant_id,
              permission_id: permissionId,
            }))
          );

        if (error) throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['role-permissions'] });
      queryClient.invalidateQueries({ queryKey: ['specific-role-permissions', variables.role] });
    },
  });

  return {
    // Data
    allPermissions: allPermissions || [],
    userPermissions: getUserPermissions(),
    
    // Loading states
    isLoading: loadingPermissions || loadingUserPermissions || loadingRolePermissions,
    
    // Permission checks
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    
    // Mutations
    grantUserPermission,
    revokeUserPermission,
    updateRolePermissions,
    
    // New hook for specific role permissions
    useRolePermissions,
  };
};

// Hooks helper para permissões específicas comuns
export const useCanManageUsers = () => {
  const { hasPermission } = usePermissions();
  return hasPermission({ module: 'users', resource: 'management', action: 'write' });
};

export const useCanViewReports = () => {
  const { hasPermission } = usePermissions();
  return hasPermission({ module: 'reports', resource: 'view', action: 'read' });
};

export const useCanManageOffices = () => {
  const { hasPermission } = usePermissions();
  return hasPermission({ module: 'offices', resource: 'management', action: 'write' });
};

export const useCanManageSales = () => {
  const { hasPermission } = usePermissions();
  return hasPermission({ module: 'sales', resource: 'management', action: 'write' });
};

export const useCanApproveSales = () => {
  const { hasPermission } = usePermissions();
  return hasPermission({ module: 'sales', resource: 'approval', action: 'write' });
};

export const useCanManageCommissions = () => {
  const { hasPermission } = usePermissions();
  return hasPermission({ module: 'commissions', resource: 'management', action: 'write' });
};
