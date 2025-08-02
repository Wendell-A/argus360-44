import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Users, 
  Search, 
  Filter, 
  Edit3, 
  UserX, 
  UserCheck, 
  Building, 
  Mail, 
  Phone,
  Calendar,
  Shield,
  AlertCircle
} from 'lucide-react';
import { UserTenantAssociation, useUserManagement } from '@/hooks/useUserManagement';
import { useUserManagementOptimized } from '@/hooks/useUserManagementOptimized';
import { UserEditModal } from '@/components/UserEditModal';
import { useOffices } from '@/hooks/useOffices';
import { toast } from 'sonner';

export default function Usuarios() {
  const { users: legacyUsers, deactivateUser, reactivateUser } = useUserManagement();
  const { data: optimizedUsers, isLoading } = useUserManagementOptimized(50, 0);
  
  // Usar dados otimizados quando disponíveis, senão fallback para legacy
  const users = optimizedUsers?.map(user => ({
    id: user.id,
    user_id: user.id, // UserCompleteData usa 'id' como user_id
    tenant_id: 'current-tenant', // Assumindo tenant atual
    role: user.role,
    active: true, // Assumindo que usuários retornados estão ativos
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    joined_at: new Date().toISOString(),
    profile: {
      id: user.id,
      full_name: user.profile.full_name || '',
      email: user.email, // UserCompleteData tem email direto
      phone: user.profile.phone || '',
      avatar_url: user.profile.avatar_url || '',
      position: user.profile.position || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    office_id: user.office?.name || '', // Usando name como fallback
    office: user.office,
    department: user.department,
    position: user.position
  } as UserTenantAssociation)) || legacyUsers;
  const { offices = [] } = useOffices();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [officeFilter, setOfficeFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<UserTenantAssociation | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Filtrar usuários
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.profile?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.profile?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && user.active) ||
                         (statusFilter === 'inactive' && !user.active);
    const matchesOffice = officeFilter === 'all' || user.office_id === officeFilter;

    return matchesSearch && matchesRole && matchesStatus && matchesOffice;
  });

  const handleEdit = (user: UserTenantAssociation) => {
    setSelectedUser(user);
    setModalOpen(true);
  };

  const handleDeactivate = async (user: UserTenantAssociation) => {
    if (!user.profile?.full_name) return;
    
    const confirm = window.confirm(
      `Tem certeza que deseja inativar o usuário "${user.profile.full_name}"?\n\n` +
      'O usuário será inativado mas todos os dados históricos (vendas, comissões, etc.) serão preservados.'
    );
    
    if (confirm) {
      try {
        await deactivateUser.mutateAsync(user.user_id);
      } catch (error) {
        console.error('Erro ao inativar usuário:', error);
      }
    }
  };

  const handleReactivate = async (user: UserTenantAssociation) => {
    if (!user.profile?.full_name) return;
    
    const confirm = window.confirm(
      `Tem certeza que deseja reativar o usuário "${user.profile.full_name}"?`
    );
    
    if (confirm) {
      try {
        await reactivateUser.mutateAsync(user.user_id);
      } catch (error) {
        console.error('Erro ao reativar usuário:', error);
      }
    }
  };

  const getRoleLabel = (role: string) => {
    const roleMap = {
      owner: 'Proprietário',
      admin: 'Administrador', 
      manager: 'Gerente',
      user: 'Usuário',
      viewer: 'Visualizador'
    };
    return roleMap[role as keyof typeof roleMap] || role;
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'owner': return 'default';
      case 'admin': return 'destructive';
      case 'manager': return 'secondary';
      default: return 'outline';
    }
  };

  const getOfficeLabel = (officeId?: string) => {
    if (!officeId) return 'Sem escritório';
    const office = offices.find(o => o.id === officeId);
    return office?.name || 'Escritório não encontrado';
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-64"></div>
          <div className="grid gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="w-8 h-8" />
            Gestão de Usuários
          </h1>
          <p className="text-muted-foreground">
            Gerencie todos os usuários da organização
          </p>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{users.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Ativos</p>
                <p className="text-2xl font-bold">{users.filter(u => u.active).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <UserX className="w-5 h-5 text-destructive" />
              <div>
                <p className="text-sm text-muted-foreground">Inativos</p>
                <p className="text-2xl font-bold">{users.filter(u => !u.active).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-secondary" />
              <div>
                <p className="text-sm text-muted-foreground">Admins</p>
                <p className="text-2xl font-bold">{users.filter(u => u.role === 'admin' || u.role === 'owner').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os perfis" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os perfis</SelectItem>
                <SelectItem value="owner">Proprietário</SelectItem>
                <SelectItem value="admin">Administrador</SelectItem>
                <SelectItem value="manager">Gerente</SelectItem>
                <SelectItem value="user">Usuário</SelectItem>
                <SelectItem value="viewer">Visualizador</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="inactive">Inativos</SelectItem>
              </SelectContent>
            </Select>
            <Select value={officeFilter} onValueChange={setOfficeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os escritórios" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os escritórios</SelectItem>
                {offices.map((office) => (
                  <SelectItem key={office.id} value={office.id}>
                    {office.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              variant="outline" 
              onClick={() => {
                setSearchTerm('');
                setRoleFilter('all');
                setStatusFilter('all');
                setOfficeFilter('all');
              }}
              className="w-full"
            >
              <Filter className="w-4 h-4 mr-2" />
              Limpar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Usuários */}
      <div className="space-y-4">
        {filteredUsers.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhum usuário encontrado</h3>
              <p className="text-muted-foreground">
                Ajuste os filtros ou tente uma busca diferente.
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredUsers.map((user) => (
            <Card key={user.user_id} className={`transition-all hover:shadow-md ${!user.active ? 'opacity-60' : ''}`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={user.profile?.avatar_url} />
                      <AvatarFallback className="text-lg font-semibold">
                        {user.profile?.full_name?.charAt(0)?.toUpperCase() || '?'}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">
                          {user.profile?.full_name || 'Nome não informado'}
                        </h3>
                        <Badge variant={getRoleBadgeVariant(user.role)}>
                          {getRoleLabel(user.role)}
                        </Badge>
                        <Badge variant={user.active ? "default" : "secondary"}>
                          {user.active ? "Ativo" : "Inativo"}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          {user.profile?.email || 'Email não informado'}
                        </div>
                        {user.profile?.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            {user.profile.phone}
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4" />
                          {getOfficeLabel(user.office_id)}
                        </div>
                        {user.joined_at && (
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            Membro desde {new Date(user.joined_at).toLocaleDateString('pt-BR')}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(user)}
                    >
                      <Edit3 className="w-4 h-4" />
                      Editar
                    </Button>
                    
                    {user.active ? (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeactivate(user)}
                        disabled={deactivateUser.isPending}
                      >
                        <UserX className="w-4 h-4" />
                        Inativar
                      </Button>
                    ) : (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleReactivate(user)}
                        disabled={reactivateUser.isPending}
                      >
                        <UserCheck className="w-4 h-4" />
                        Reativar
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Modal de Edição */}
      <UserEditModal
        user={selectedUser}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </div>
  );
}