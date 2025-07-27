import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePublicInvitations } from '@/hooks/usePublicInvitations';
import { useOffices } from '@/hooks/useOffices';
import { useDepartments } from '@/hooks/useDepartments';
import { useTeams } from '@/hooks/useTeams';

interface PublicLinkModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const roleOptions = [
  { value: 'user', label: 'Usuário' },
  { value: 'manager', label: 'Gerente' },
  { value: 'admin', label: 'Administrador' },
];

export function PublicLinkModal({ open, onOpenChange }: PublicLinkModalProps) {
  const { createPublicLink } = usePublicInvitations();
  const { offices = [] } = useOffices();
  const { departments = [] } = useDepartments();
  const { teams = [] } = useTeams();

  const [formData, setFormData] = useState({
    role: 'user',
    office_id: 'none',
    department_id: 'none',
    team_id: 'none',
    max_uses: '',
    expires_at: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await createPublicLink.mutateAsync({
        role: formData.role,
        office_id: formData.office_id === 'none' ? undefined : formData.office_id,
        department_id: formData.department_id === 'none' ? undefined : formData.department_id,
        team_id: formData.team_id === 'none' ? undefined : formData.team_id,
        max_uses: formData.max_uses ? parseInt(formData.max_uses) : undefined,
        expires_at: formData.expires_at || undefined,
      });
      
      // Reset form
      setFormData({
        role: 'user',
        office_id: 'none',
        department_id: 'none',
        team_id: 'none',
        max_uses: '',
        expires_at: '',
      });
      
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao criar link público:', error);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Criar Link de Convite Público</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="role">Perfil</Label>
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
            <Label htmlFor="office_id">Escritório (Opcional)</Label>
            <Select value={formData.office_id} onValueChange={(value) => handleChange('office_id', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o escritório" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum escritório específico</SelectItem>
                {offices.map((office) => (
                  <SelectItem key={office.id} value={office.id}>
                    {office.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="department_id">Departamento (Opcional)</Label>
            <Select value={formData.department_id} onValueChange={(value) => handleChange('department_id', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o departamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum departamento específico</SelectItem>
                {departments.map((department) => (
                  <SelectItem key={department.id} value={department.id}>
                    {department.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="max_uses">Limite de Usos (Opcional)</Label>
            <Input
              id="max_uses"
              type="number"
              min="1"
              value={formData.max_uses}
              onChange={(e) => handleChange('max_uses', e.target.value)}
              placeholder="Ex: 10 (deixe vazio para ilimitado)"
            />
          </div>

          <div>
            <Label htmlFor="expires_at">Data de Expiração (Opcional)</Label>
            <Input
              id="expires_at"
              type="datetime-local"
              value={formData.expires_at}
              onChange={(e) => handleChange('expires_at', e.target.value)}
            />
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
              disabled={createPublicLink.isPending}
              className="flex-1"
            >
              {createPublicLink.isPending ? 'Criando...' : 'Criar Link'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}