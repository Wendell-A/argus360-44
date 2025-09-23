import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Crown, 
  Shield, 
  Users, 
  User, 
  Eye,
  Zap,
  CheckCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PermissionPreset {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
  badgeColor: string;
  permissions: {
    module: string;
    resource: string;
    actions: string[];
  }[];
}

const PERMISSION_PRESETS: PermissionPreset[] = [
  {
    id: 'owner',
    name: 'Proprietário',
    description: 'Acesso total ao sistema - todas as permissões',
    icon: Crown,
    color: 'text-red-600',
    badgeColor: 'bg-red-100 text-red-800 border-red-200',
    permissions: [
      { module: 'system', resource: 'permissions', actions: ['read', 'write', 'create', 'delete'] },
      { module: 'system', resource: 'settings', actions: ['read', 'write'] },
      { module: 'system', resource: 'audit', actions: ['read'] },
      { module: 'users', resource: 'management', actions: ['create', 'read', 'update', 'delete'] },
      { module: 'users', resource: 'invitations', actions: ['create', 'read', 'update', 'delete'] },
      { module: 'users', resource: 'roles', actions: ['read', 'write'] },
      { module: 'sales', resource: 'management', actions: ['create', 'read', 'update', 'delete'] },
      { module: 'sales', resource: 'approval', actions: ['write'] },
      { module: 'sales', resource: 'view', actions: ['read'] },
      { module: 'clients', resource: 'management', actions: ['create', 'read', 'update', 'delete'] },
      { module: 'clients', resource: 'interactions', actions: ['create', 'read', 'update'] },
      { module: 'reports', resource: 'view', actions: ['read'] },
      { module: 'reports', resource: 'export', actions: ['create'] },
      { module: 'offices', resource: 'management', actions: ['create', 'read', 'update', 'delete'] },
      { module: 'commissions', resource: 'management', actions: ['create', 'read', 'update', 'write'] }
    ]
  },
  {
    id: 'admin',
    name: 'Administrador',
    description: 'Gestão completa exceto configurações críticas',
    icon: Shield,
    color: 'text-purple-600',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
    permissions: [
      { module: 'users', resource: 'management', actions: ['create', 'read', 'update', 'delete'] },
      { module: 'users', resource: 'invitations', actions: ['create', 'read', 'update', 'delete'] },
      { module: 'users', resource: 'roles', actions: ['read', 'write'] },
      { module: 'sales', resource: 'management', actions: ['create', 'read', 'update', 'delete'] },
      { module: 'sales', resource: 'approval', actions: ['write'] },
      { module: 'sales', resource: 'view', actions: ['read'] },
      { module: 'clients', resource: 'management', actions: ['create', 'read', 'update', 'delete'] },
      { module: 'clients', resource: 'interactions', actions: ['create', 'read', 'update'] },
      { module: 'reports', resource: 'view', actions: ['read'] },
      { module: 'reports', resource: 'export', actions: ['create'] },
      { module: 'offices', resource: 'management', actions: ['create', 'read', 'update', 'delete'] },
      { module: 'commissions', resource: 'management', actions: ['create', 'read', 'update', 'write'] }
    ]
  },
  {
    id: 'manager',
    name: 'Gerente',
    description: 'Gestão de vendas, equipes e aprovações',
    icon: Users,
    color: 'text-blue-600',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
    permissions: [
      { module: 'sales', resource: 'management', actions: ['create', 'read', 'update', 'delete'] },
      { module: 'sales', resource: 'approval', actions: ['write'] },
      { module: 'sales', resource: 'view', actions: ['read'] },
      { module: 'clients', resource: 'management', actions: ['create', 'read', 'update', 'delete'] },
      { module: 'clients', resource: 'interactions', actions: ['create', 'read', 'update'] },
      { module: 'reports', resource: 'view', actions: ['read'] },
      { module: 'reports', resource: 'export', actions: ['create'] },
      { module: 'commissions', resource: 'management', actions: ['read', 'update'] }
    ]
  },
  {
    id: 'user',
    name: 'Usuário',
    description: 'Operações básicas do dia a dia',
    icon: User,
    color: 'text-green-600',
    badgeColor: 'bg-green-100 text-green-800 border-green-200',
    permissions: [
      { module: 'sales', resource: 'management', actions: ['create', 'read', 'update'] },
      { module: 'sales', resource: 'view', actions: ['read'] },
      { module: 'clients', resource: 'management', actions: ['create', 'read', 'update'] },
      { module: 'clients', resource: 'interactions', actions: ['create', 'read', 'update'] },
      { module: 'reports', resource: 'view', actions: ['read'] },
      { module: 'commissions', resource: 'management', actions: ['read'] }
    ]
  },
  {
    id: 'viewer',
    name: 'Visualizador',
    description: 'Apenas visualização de dados',
    icon: Eye,
    color: 'text-gray-600',
    badgeColor: 'bg-gray-100 text-gray-800 border-gray-200',
    permissions: [
      { module: 'sales', resource: 'view', actions: ['read'] },
      { module: 'clients', resource: 'management', actions: ['read'] },
      { module: 'reports', resource: 'view', actions: ['read'] },
      { module: 'commissions', resource: 'management', actions: ['read'] }
    ]
  }
];

interface PermissionPresetsProps {
  onApplyPreset: (permissions: string[]) => void;
  selectedRole: string;
  allPermissions: any[];
  isLoading?: boolean;
}

export const PermissionPresets: React.FC<PermissionPresetsProps> = ({
  onApplyPreset,
  selectedRole,
  allPermissions,
  isLoading = false
}) => {
  const { toast } = useToast();

  const handleApplyPreset = (preset: PermissionPreset) => {
    // Converter preset para IDs de permissões
    const permissionIds = preset.permissions.map(presetPerm => {
      const permission = allPermissions.find(p => 
        p.module === presetPerm.module && 
        p.resource === presetPerm.resource &&
        presetPerm.actions.every(action => p.actions.includes(action))
      );
      return permission?.id;
    }).filter(Boolean);

    onApplyPreset(permissionIds);

    toast({
      title: "Preset aplicado",
      description: `Configuração "${preset.name}" aplicada com ${permissionIds.length} permissões.`,
      duration: 3000,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-orange-500" />
          Presets de Permissões
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Aplique configurações pré-definidas para acelerar a configuração
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {PERMISSION_PRESETS.map((preset) => {
            const IconComponent = preset.icon;
            const isCurrentRole = preset.id === selectedRole;

            return (
              <div 
                key={preset.id} 
                className={`border rounded-lg p-4 transition-all hover:shadow-md ${
                  isCurrentRole ? 'ring-2 ring-primary ring-offset-2 bg-primary/5' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-2 rounded-lg bg-muted ${preset.color}`}>
                    <IconComponent className="h-5 w-5" />
                  </div>
                  {isCurrentRole && (
                    <Badge variant="outline" className="text-primary border-primary">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Atual
                    </Badge>
                  )}
                </div>

                <div className="mb-3">
                  <h4 className="font-medium flex items-center gap-2 mb-1">
                    {preset.name}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {preset.description}
                  </p>
                </div>

                <div className="mb-4">
                  <p className="text-xs text-muted-foreground mb-2">
                    {preset.permissions.length} permissões incluídas
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {preset.permissions.slice(0, 3).map((perm, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {perm.module}
                      </Badge>
                    ))}
                    {preset.permissions.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{preset.permissions.length - 3}
                      </Badge>
                    )}
                  </div>
                </div>

                <Button
                  size="sm"
                  variant={isCurrentRole ? "secondary" : "outline"}
                  className="w-full"
                  onClick={() => handleApplyPreset(preset)}
                  disabled={isLoading}
                >
                  {isCurrentRole ? "Aplicado" : "Aplicar Preset"}
                </Button>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};