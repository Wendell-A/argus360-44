
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
import { Shield, Users, Settings, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';

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

const ITEMS_PER_PAGE = 10;

export default function Permissoes() {
  const { 
    allPermissions, 
    isLoading, 
    updateRolePermissions,
    grantUserPermission,
    revokeUserPermission 
  } = usePermissions();
  
  const { activeTenant } = useAuth();
  
  // Buscar usuários do tenant com profiles usando query separada
  const { data: tenantUsersData = [], isLoading: loadingUsers } = useQuery({
    queryKey: ['tenant-users-with-profiles', activeTenant?.tenant_id],
    queryFn: async () => {
      if (!activeTenant?.tenant_id) return [];

      // Primeira query: buscar tenant_users
      const { data: tenantUsers, error: tenantUsersError } = await supabase
        .from('tenant_users')
        .select('id, user_id, tenant_id, role, active, created_at, updated_at')
        .eq('tenant_id', activeTenant.tenant_id)
        .eq('active', true);

      if (tenantUsersError) throw tenantUsersError;
      if (!tenantUsers?.length) return [];

      // Segunda query: buscar profiles dos usuários
      const userIds = tenantUsers.map(tu => tu.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, email, avatar_url')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      // Combinar os dados
      return tenantUsers.map(tenantUser => ({
        ...tenantUser,
        profiles: profiles?.find(p => p.id === tenantUser.user_id) || null
      }));
    },
    enabled: !!activeTenant?.tenant_id,
  });
  
  const [selectedRole, setSelectedRole] = useState<string>('user');
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
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

  // Filtrar usuários com type guards
  const filteredUsers = tenantUsersData.filter(tenantUser => {
    const profile = tenantUser.profiles;
    
    // Type guard para verificar se profile existe e tem as propriedades necessárias
    if (!profile || 
        typeof profile !== 'object' || 
        !('full_name' in profile) || 
        !('email' in profile) ||
        !profile.full_name || 
        !profile.email) {
      return false;
    }
    
    const fullName = String(profile.full_name);
    const email = String(profile.email);
    const searchLower = searchTerm.toLowerCase();
    
    return fullName.toLowerCase().includes(searchLower) ||
           email.toLowerCase().includes(searchLower);
  });

  // Paginação
  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages, prev + 1));
  };

  if (isLoading || loadingUsers) {
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
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setCurrentPage(1); // Reset to first page when searching
                      }}
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
                      {paginatedUsers.length > 0 ? (
                        paginatedUsers.map(tenantUser => {
                          const profile = tenantUser.profiles;
                          if (!profile || 
                              typeof profile !== 'object' || 
                              !('full_name' in profile) || 
                              !('email' in profile)) {
                            return null;
                          }

                          const fullName = String(profile.full_name || 'Sem nome');
                          const email = String(profile.email);
                          
                          return (
                            <TableRow key={tenantUser.id}>
                              <TableCell className="font-medium">
                                {fullName}
                              </TableCell>
                              <TableCell>{email}</TableCell>
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
                        })
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                            {searchTerm ? 'Nenhum usuário encontrado com os critérios de busca.' : 'Nenhum usuário encontrado.'}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Paginação */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      Mostrando {startIndex + 1} a {Math.min(startIndex + ITEMS_PER_PAGE, filteredUsers.length)} de {filteredUsers.length} usuários
                    </div>
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handlePreviousPage}
                            disabled={currentPage === 1}
                            className="gap-1 pl-2.5"
                          >
                            <ChevronLeft className="h-4 w-4" />
                            Anterior
                          </Button>
                        </PaginationItem>
                        
                        <PaginationItem className="mx-2">
                          <span className="text-sm font-medium">
                            Página {currentPage} de {totalPages}
                          </span>
                        </PaginationItem>
                        
                        <PaginationItem>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleNextPage}
                            disabled={currentPage === totalPages}
                            className="gap-1 pr-2.5"
                          >
                            Próxima
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PermissionGuard>
  );
}
