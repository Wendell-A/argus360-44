
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle, User, Building, Users, Briefcase } from 'lucide-react';
import { UserTenantAssociation, UserDependencies, useUserManagement } from '@/hooks/useUserManagement';
import { useOffices } from '@/hooks/useOffices';
import { useDepartments } from '@/hooks/useDepartments';
import { useTeams } from '@/hooks/useTeams';

interface UserEditModalProps {
  user: UserTenantAssociation | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const roleOptions = [
  { value: 'user', label: 'Usuário' },
  { value: 'manager', label: 'Gerente' },
  { value: 'admin', label: 'Administrador' },
  { value: 'owner', label: 'Proprietário' },
];

export function UserEditModal({ user, open, onOpenChange }: UserEditModalProps) {
  const { updateUserProfile, updateTenantUser, checkUserDependencies } = useUserManagement();
  const { offices = [] } = useOffices();
  const { departments = [] } = useDepartments();
  const { teams = [] } = useTeams();

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    department: '',
    position: '',
    role: 'user',
    office_id: '',
    department_id: '',
    team_id: '',
  });

  const [dependencies, setDependencies] = useState<UserDependencies | null>(null);
  const [loadingDeps, setLoadingDeps] = useState(false);

  useEffect(() => {
    if (user?.profile) {
      setFormData({
        full_name: user.profile.full_name || '',
        email: user.profile.email || '',
        phone: user.profile.phone || '',
        department: user.profile.department || '',
        position: user.profile.position || '',
        role: user.role || 'user',
        office_id: user.office_id || '',
        department_id: user.department_id || '',
        team_id: user.team_id || '',
      });

      // Carregar dependências
      if (user.user_id) {
        setLoadingDeps(true);
        checkUserDependencies(user.user_id)
          .then(setDependencies)
          .catch(console.error)
          .finally(() => setLoadingDeps(false));
      }
    }
  }, [user, checkUserDependencies]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      // Atualizar perfil
      await updateUserProfile.mutateAsync({
        userId: user.user_id,
        profileData: {
          full_name: formData.full_name,
          phone: formData.phone,
          department: formData.department,
          position: formData.position,
        }
      });

      // Atualizar tenant_user
      await updateTenantUser.mutateAsync({
        userId: user.user_id,
        tenantData: {
          role: formData.role as any,
          office_id: formData.office_id || null,
          department_id: formData.department_id || null,
          team_id: formData.team_id || null,
        }
      });

      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao salvar usuário:', error);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Editar Usuário
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações Básicas */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <User className="w-4 h-4" />
              Informações Pessoais
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="full_name">Nome Completo</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => handleChange('full_name', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Email não pode ser alterado
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="position">Cargo</Label>
                <Input
                  id="position"
                  value={formData.position}
                  onChange={(e) => handleChange('position', e.target.value)}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Configurações do Sistema */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Briefcase className="w-4 h-4" />
              Configurações do Sistema
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="role">Perfil de Acesso</Label>
                <Select value={formData.role} onValueChange={(value) => handleChange('role', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o perfil" />
                  </SelectTrigger>
                  <SelectContent>
                    {roleOptions.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="office_id">Escritório</Label>
                <Select value={formData.office_id} onValueChange={(value) => handleChange('office_id', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o escritório" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Nenhum escritório</SelectItem>
                    {offices.map((office) => (
                      <SelectItem key={office.id} value={office.id}>
                        {office.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="department_id">Departamento</Label>
                <Select value={formData.department_id} onValueChange={(value) => handleChange('department_id', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o departamento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Nenhum departamento</SelectItem>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="team_id">Equipe</Label>
                <Select value={formData.team_id} onValueChange={(value) => handleChange('team_id', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a equipe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Nenhuma equipe</SelectItem>
                    {teams.map((team) => (
                      <SelectItem key={team.id} value={team.id}>
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator />

          {/* Status e Dependências */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <AlertTriangle className="w-4 h-4" />
              Status e Dependências
            </div>

            <div className="flex items-center gap-4">
              <Badge variant={user.active ? "default" : "secondary"}>
                {user.active ? "Ativo" : "Inativo"}
              </Badge>
              {user.joined_at && (
                <span className="text-sm text-muted-foreground">
                  Membro desde: {new Date(user.joined_at).toLocaleDateString('pt-BR')}
                </span>
              )}
            </div>

            {dependencies && !loadingDeps && (
              <div className="p-3 bg-muted rounded-lg">
                <h4 className="font-medium text-sm mb-2">Dependências no Sistema:</h4>
                {dependencies.dependencies.length > 0 ? (
                  <div className="space-y-1">
                    {dependencies.dependencies.map((dep, index) => (
                      <div key={index} className="text-sm text-muted-foreground">
                        • {dep}
                      </div>
                    ))}
                    <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded text-sm text-yellow-800 dark:text-yellow-200">
                      ⚠️ Usuário possui dependências. Inativação preservará dados históricos.
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-green-600 dark:text-green-400">
                    ✅ Usuário pode ser removido sem perda de dados.
                  </div>
                )}
              </div>
            )}

            {loadingDeps && (
              <div className="p-3 bg-muted rounded-lg animate-pulse">
                <div className="text-sm text-muted-foreground">
                  Verificando dependências...
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={updateUserProfile.isPending || updateTenantUser.isPending}
              className="flex-1"
            >
              {updateUserProfile.isPending || updateTenantUser.isPending ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
