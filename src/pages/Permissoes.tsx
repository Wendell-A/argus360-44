
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { usePermissions } from '@/hooks/usePermissions';
import { PermissionGuard, AccessDenied } from '@/components/PermissionGuard';
import { Shield, Users, Settings, Search } from 'lucide-react';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const roleNames = {
  owner: 'Proprietário',
  admin: 'Administrador',
  manager: 'Gerente',
  user: 'Usuário',
  viewer: 'Visualizador'
};

const roleDescriptions = {
  owner: 'Acesso total ao sistema',
  admin: 'Gestão completa do tenant',
  manager: 'Gestão de vendas e equipes',
  user: 'Operações básicas',
  viewer: 'Apenas visualização'
};

export default function Permissoes() {
  const { 
    allPermissions, 
    isLoading, 
    updateRolePermissions,
    grantUserPermission,
    revokeUserPermission 
  } = usePermissions();
  
  const { activeTenant } = useAuth();
  
  // Buscar usuários do tenant com profiles
  const { data: tenantUsers = [] } = useQuery({
    queryKey: ['tenant-users', activeTenant?.tenant_id],
    queryFn: async () => {
      if (!activeTenant?.tenant_id) return [];

      const { data, error } = await supabase
        .from('tenant_users')
        .select(`
          *,
          profiles!tenant_users_user_id_fkey (
            id,
            full_name,
            email,
            avatar_url
          )
        `)
        .eq('tenant_id', activeTenant.tenant_id)
        .eq('active', true);

      if (error) throw error;
      return data;
    },
    enabled: !!activeTenant?.tenant_id,
  });
  
  const [selectedRole, setSelectedRole] = useState<string>('user');
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [rolePermissions, setRolePermissions] = useState<Record<string, boolean>>({});

  // Agrupar permissões por módulo
  const permissionsByModule = React.useMemo(() => {
    const grouped: Record<string, typeof allPermissions> = {};
    allPermissions.forEach(permission => {
      if (!grouped[permission.module]) {
        grouped[permission.module] = [];
      }
      grouped[permission.module].push(permission);
    });
    return grouped;
  }, [allPermissions]);

  const handleRolePermissionChange = (permissionId: string, enabled: boolean) => {
    setRolePermissions(prev => ({
      ...prev,
      [permissionId]: enabled
    }));
  };

  const saveRolePermissions = async () => {
    const permissionIds = Object.entries(rolePermissions)
      .filter(([_, enabled]) => enabled)
      .map(([permissionId]) => permissionId);

    try {
      await updateRolePermissions.mutateAsync({
        role: selectedRole,
        permissionIds
      });
      toast.success('Permissões da função atualizadas com sucesso!');
    } catch (error) {
      toast.error('Erro ao atualizar permissões da função');
      console.error(error);
    }
  };

  const filteredUsers = tenantUsers.filter(tenantUser => {
    const profile = tenantUser.profiles;
    if (!profile || !profile.full_name || !profile.email) return false;
    
    return profile.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           profile.email.toLowerCase().includes(searchTerm.toLowerCase());
  });

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando permissões...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <PermissionGuard
      permission={{ module: 'system', resource: 'permissions', action: 'read' }}
      fallback={<AccessDenied message="Você não tem permissão para gerenciar permissões do sistema." />}
    >
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Gestão de Permissões</h1>
            <p className="text-muted-foreground">
              Configure permissões por função e usuários específicos
            </p>
          </div>
          <Shield className="h-8 w-8 text-primary" />
        </div>

        <Tabs defaultValue="roles" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="roles" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Permissões por Função
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Permissões por Usuário
            </TabsTrigger>
          </TabsList>

          <TabsContent value="roles" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Configurar Permissões por Função</CardTitle>
                <CardDescription>
                  Defina as permissões padrão para cada nível de acesso no sistema
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-4">
                  <Select value={selectedRole} onValueChange={setSelectedRole}>
                    <SelectTrigger className="w-64">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(roleNames).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          <div className="flex flex-col">
                            <span>{label}</span>
                            <span className="text-xs text-muted-foreground">
                              {roleDescriptions[value as keyof typeof roleDescriptions]}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button 
                    onClick={saveRolePermissions}
                    disabled={updateRolePermissions.isPending}
                  >
                    {updateRolePermissions.isPending ? 'Salvando...' : 'Salvar Permissões'}
                  </Button>
                </div>

                <div className="space-y-6">
                  {Object.entries(permissionsByModule).map(([module, permissions]) => (
                    <Card key={module}>
                      <CardHeader>
                        <CardTitle className="text-lg capitalize">{module}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {permissions.map(permission => (
                            <div key={permission.id} className="flex items-center justify-between p-3 border rounded-lg">
                              <div className="flex-1">
                                <div className="font-medium">{permission.resource}</div>
                                <div className="text-sm text-muted-foreground flex gap-1 mt-1">
                                  {permission.actions.map(action => (
                                    <Badge key={action} variant="outline" className="text-xs">
                                      {action}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                              <Switch
                                checked={rolePermissions[permission.id] || false}
                                onCheckedChange={(checked) => 
                                  handleRolePermissionChange(permission.id, checked)
                                }
                              />
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Permissões Específicas por Usuário</CardTitle>
                <CardDescription>
                  Conceda ou revogue permissões específicas para usuários individuais
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar usuários..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Usuário</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Função</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map(tenantUser => {
                        const profile = tenantUser.profiles;
                        if (!profile) return null;
                        
                        return (
                          <TableRow key={tenantUser.id}>
                            <TableCell className="font-medium">
                              {profile.full_name || 'Sem nome'}
                            </TableCell>
                            <TableCell>{profile.email}</TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {roleNames[tenantUser.role as keyof typeof roleNames] || tenantUser.role}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedUser(tenantUser.user_id)}
                              >
                                Gerenciar Permissões
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PermissionGuard>
  );
}
