
import React from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuth } from '@/contexts/AuthContext';

interface PermissionCheck {
  module: string;
  resource: string;
  action: string;
}

interface PermissionGuardProps {
  children: React.ReactNode;
  permission?: PermissionCheck;
  permissions?: PermissionCheck[];
  requireAll?: boolean;
  fallback?: React.ReactNode;
  roles?: string[];
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  children,
  permission,
  permissions = [],
  requireAll = false,
  fallback = null,
  roles = [],
}) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions();
  const { activeTenant } = useAuth();

  // Verificar roles se especificadas
  if (roles.length > 0 && activeTenant?.user_role) {
    const hasRole = roles.includes(activeTenant.user_role);
    if (!hasRole) {
      return <>{fallback}</>;
    }
  }

  let hasAccess = false;

  if (permission) {
    hasAccess = hasPermission(permission);
  } else if (permissions.length > 0) {
    hasAccess = requireAll 
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions);
  } else {
    // Se não há permissões especificadas, permite acesso
    hasAccess = true;
  }

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

// Componente de fallback para acesso negado
export const AccessDenied: React.FC<{ message?: string }> = ({ 
  message = "Você não tem permissão para acessar esta funcionalidade." 
}) => (
  <div className="flex items-center justify-center h-64">
    <div className="text-center">
      <div className="text-muted-foreground mb-2">🔒</div>
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  </div>
);

// HOC para proteger componentes inteiros
export const withPermission = (
  Component: React.ComponentType<any>,
  permission: PermissionCheck,
  fallback?: React.ReactNode
) => {
  return (props: any) => (
    <PermissionGuard permission={permission} fallback={fallback}>
      <Component {...props} />
    </PermissionGuard>
  );
};
