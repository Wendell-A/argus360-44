
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  User, 
  Mail, 
  Phone, 
  Building, 
  Calendar, 
  Shield,
  AlertCircle,
  Save,
  X
} from 'lucide-react';
import { useUserManagement, UserTenantAssociation, UserDependencies } from '@/hooks/useUserManagement';
import { useOffices } from '@/hooks/useOffices';
import { useDepartments } from '@/hooks/useDepartments';
import { useTeams } from '@/hooks/useTeams';
import { toast } from 'sonner';

interface UserEditModalProps {
  user: UserTenantAssociation | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserEditModal({ user, open, onOpenChange }: UserEditModalProps) {
  const { updateUserProfile, updateTenantUser, checkUserDependencies } = useUserManagement();
  const { offices = [] } = useOffices();
  const { departments = [] } = useDepartments();
  const { teams = [] } = useTeams();

  const [profileData, setProfileData] = useState({
    full_name: '',
    phone: '',
    department: '',
    position: '',
  });

  const [tenantData, setTenantData] = useState({
    role: 'user' as 'owner' | 'admin' | 'manager' | 'user' | 'viewer',
    office_id: '',
    department_id: '',
    team_id: '',
    active: true,
  });

  const [dependencies, setDependencies] = useState<UserDependencies | null>(null);
  const [loadingDependencies, setLoadingDependencies] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    if (user) {
      setProfileData({
        full_name: user.profile?.full_name || '',
        phone: user.profile?.phone || '',
        department: user.profile?.department || '',
        position: user.profile?.position || '',
      });

      setTenantData({
        role: user.role,
        office_id: user.office_id || '',
        department_id: user.department_id || '',
        team_id: user.team_id || '',
        active: user.active,
      });

      // Carregar dependências do usuário
      loadUserDependencies();
    }
  }, [user]);

  const loadUserDependencies = async () => {
    if (!user) return;

    try {
      setLoadingDependencies(true);
      const deps = await checkUserDependencies(user.user_id);
      setDependencies(deps);
    } catch (error) {
      console.error('Erro ao carregar dependências:', error);
    } finally {
      setLoadingDependencies(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    try {
      await updateUserProfile.mutateAsync({
        userId: user.user_id,
        profileData
      });
    } catch (error) {
      console.error('Erro ao salvar perfil:', error);
    }
  };

  const handleSaveTenant = async () => {
    if (!user) return;

    try {
      await updateTenantUser.mutateAsync({
        userId: user.user_id,
        tenantData
      });
    } catch (error) {
      console.error('Erro ao salvar dados do tenant:', error);
    }
  };

  const handleSaveAll = async () => {
    if (!user) return;

    try {
      await Promise.all([
        updateUserProfile.mutateAsync({
          userId: user.user_id,
          profileData
        }),
        updateTenantUser.mutateAsync({
          userId: user.user_id,
          tenantData
        })
      ]);
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao salvar dados:', error);
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

  const getOfficeLabel = (officeId?: string) => {
    if (!officeId) return 'Sem escritório';
    const office = offices.find(o => o.id === officeId);
    return office?.name || 'Escritório não encontrado';
  };

  const getDepartmentLabel = (departmentId?: string) => {
    if (!departmentId) return 'Sem departamento';
    const department = departments.find(d => d.id === departmentId);
    return department?.name || 'Departamento não encontrado';
  };

  const getTeamLabel = (teamId?: string) => {
    if (!teamId) return 'Sem equipe';
    const team = teams.find(t => t.id === teamId);
    return team?.name || 'Equipe não encontrada';
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Editar Usuário
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header com informações básicas */}
          <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
            <Avatar className="w-16 h-16">
              <AvatarImage src={user.profile?.avatar_url} />
              <AvatarFallback className="text-lg font-semibold">
                {user.profile?.full_name?.charAt(0)?.toUpperCase() || '?'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="text-lg font-semibold">
                {user.profile?.full_name || 'Nome não informado'}
              </h3>
              <p className="text-muted-foreground flex items-center gap-1">
                <Mail className="w-4 h-4" />
                {user.profile?.email || 'Email não informado'}
              </p>
              <div className="flex items-center gap-3 mt-2">
                <Badge variant={tenantData.active ? "default" : "secondary"}>
                  {tenantData.active ? "Ativo" : "Inativo"}
                </Badge>
                <Badge>{getRoleLabel(user.role)}</Badge>
              </div>
            </div>
          </div>

          {/* Dependências do usuário */}
          {dependencies && (
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="w-5 h-5 text-orange-600" />
                <h4 className="font-medium">Dependências do Sistema</h4>
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="text-center">
                  <p className="font-semibold text-lg">{dependencies.sales_count}</p>
                  <p className="text-muted-foreground">Vendas</p>
                </div>
                <div className="text-center">
                  <p className="font-semibold text-lg">{dependencies.commissions_count}</p>
                  <p className="text-muted-foreground">Comissões</p>
                </div>
                <div className="text-center">
                  <p className="font-semibold text-lg">{dependencies.clients_count}</p>
                  <p className="text-muted-foreground">Clientes</p>
                </div>
              </div>
              {!dependencies.can_delete && (
                <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded text-sm">
                  <p className="font-medium text-orange-800">
                    ⚠️ Este usuário possui dependências no sistema
                  </p>
                  <p className="text-orange-700">
                    Dados históricos: {dependencies.dependencies.join(', ')}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Tabs para edição */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="profile">Dados Pessoais</TabsTrigger>
              <TabsTrigger value="system">Configurações do Sistema</TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="full_name">Nome Completo</Label>
                  <Input
                    id="full_name"
                    value={profileData.full_name}
                    onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                    placeholder="Nome completo do usuário"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                    placeholder="(00) 00000-0000"
                  />
                </div>
                <div>
                  <Label htmlFor="department">Departamento</Label>
                  <Input
                    id="department"
                    value={profileData.department}
                    onChange={(e) => setProfileData({ ...profileData, department: e.target.value })}
                    placeholder="Nome do departamento"
                  />
                </div>
                <div>
                  <Label htmlFor="position">Cargo</Label>
                  <Input
                    id="position"
                    value={profileData.position}
                    onChange={(e) => setProfileData({ ...profileData, position: e.target.value })}
                    placeholder="Cargo do usuário"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSaveProfile} disabled={updateUserProfile.isPending}>
                  <Save className="w-4 h-4 mr-2" />
                  Salvar Dados Pessoais
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="system" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="role">Perfil do Usuário</Label>
                  <Select
                    value={tenantData.role}
                    onValueChange={(value: any) => setTenantData({ ...tenantData, role: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="viewer">Visualizador</SelectItem>
                      <SelectItem value="user">Usuário</SelectItem>
                      <SelectItem value="manager">Gerente</SelectItem>
                      <SelectItem value="admin">Administrador</SelectItem>
                      <SelectItem value="owner">Proprietário</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="office">Escritório</Label>
                  <Select
                    value={tenantData.office_id}
                    onValueChange={(value) => setTenantData({ ...tenantData, office_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um escritório" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Sem escritório</SelectItem>
                      {offices.map((office) => (
                        <SelectItem key={office.id} value={office.id}>
                          {office.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="department">Departamento</Label>
                  <Select
                    value={tenantData.department_id}
                    onValueChange={(value) => setTenantData({ ...tenantData, department_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um departamento" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Sem departamento</SelectItem>
                      {departments.map((department) => (
                        <SelectItem key={department.id} value={department.id}>
                          {department.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="team">Equipe</Label>
                  <Select
                    value={tenantData.team_id}
                    onValueChange={(value) => setTenantData({ ...tenantData, team_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma equipe" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Sem equipe</SelectItem>
                      {teams.map((team) => (
                        <SelectItem key={team.id} value={team.id}>
                          {team.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="active"
                  checked={tenantData.active}
                  onCheckedChange={(checked) => setTenantData({ ...tenantData, active: checked })}
                />
                <Label htmlFor="active">Usuário Ativo</Label>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSaveTenant} disabled={updateTenantUser.isPending}>
                  <Shield className="w-4 h-4 mr-2" />
                  Salvar Configurações do Sistema
                </Button>
              </div>
            </TabsContent>
          </Tabs>

          {/* Ações finais */}
          <div className="flex justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
            <Button
              onClick={handleSaveAll}
              disabled={updateUserProfile.isPending || updateTenantUser.isPending}
            >
              <Save className="w-4 h-4 mr-2" />
              Salvar Todas as Alterações
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
