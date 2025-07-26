import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useVendedores } from '@/hooks/useVendedores';
import { useOffices } from '@/hooks/useOffices';
import { useTeams } from '@/hooks/useTeams';
import { toast } from 'sonner';

interface VendedorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendedor?: any;
  availableUsers?: any[];
}

export function VendedorModal({ open, onOpenChange, vendedor, availableUsers = [] }: VendedorModalProps) {
  const { createVendedor, updateVendedor } = useVendedores();
  const { offices } = useOffices();
  const { teams } = useTeams();
  
  const [formData, setFormData] = useState({
    user_id: '',
    office_id: '',
    team_id: '',
    commission_rate: 0,
    active: true,
    hierarchy_level: 1,
    sales_goal: 0,
    whatsapp: '',
    specialties: [] as string[],
    notes: '',
  });

  useEffect(() => {
    if (vendedor) {
      setFormData({
        user_id: vendedor.id || '',
        office_id: vendedor.office_id || '',
        team_id: vendedor.team_id || 'no-team',
        commission_rate: vendedor.commission_rate || 0,
        active: vendedor.active ?? true,
        hierarchy_level: vendedor.hierarchical_level || 1,
        sales_goal: vendedor.sales_goal || 0,
        whatsapp: vendedor.phone || '',
        specialties: vendedor.settings?.specialties || [],
        notes: vendedor.settings?.notes || '',
      });
    } else {
      setFormData({
        user_id: '',
        office_id: '',
        team_id: 'no-team',
        commission_rate: 0,
        active: true,
        hierarchy_level: 1,
        sales_goal: 0,
        whatsapp: '',
        specialties: [],
        notes: '',
      });
    }
  }, [vendedor]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.user_id || !formData.office_id) {
      toast.error('Usuário e escritório são obrigatórios');
      return;
    }

    // Buscar dados do usuário selecionado
    const selectedUser = availableUsers.find(user => 
      user.profiles?.id === formData.user_id || user.user_id === formData.user_id
    );

    if (!selectedUser && !vendedor) {
      toast.error('Usuário não encontrado');
      return;
    }

    try {
      if (vendedor) {
        // Atualizando vendedor existente
        const updateData = {
          full_name: vendedor.full_name, // Manter o nome atual
          email: vendedor.email, // Manter o email atual
          phone: formData.whatsapp,
          department: vendedor.department,
          position: vendedor.position,
          hierarchical_level: formData.hierarchy_level,
          settings: {
            ...vendedor.settings,
            whatsapp: formData.whatsapp,
            specialties: formData.specialties,
            notes: formData.notes,
            active: formData.active,
            commission_rate: formData.commission_rate,
            sales_goal: formData.sales_goal,
            office_id: formData.office_id,
            team_id: formData.team_id === 'no-team' ? null : formData.team_id,
          },
        };

        await updateVendedor.mutateAsync({
          id: vendedor.id,
          data: updateData,
        });
        toast.success('Vendedor atualizado com sucesso!');
      } else {
        // Criando novo vendedor
        const vendedorData = {
          id: selectedUser.profiles?.id || selectedUser.user_id,
          email: selectedUser.profiles?.email || selectedUser.email,
          full_name: selectedUser.profiles?.full_name || selectedUser.full_name,
          phone: formData.whatsapp,
          hierarchical_level: formData.hierarchy_level,
          settings: {
            whatsapp: formData.whatsapp,
            specialties: formData.specialties,
            notes: formData.notes,
            active: formData.active,
            commission_rate: formData.commission_rate,
            sales_goal: formData.sales_goal,
          },
          office_id: formData.office_id,
        };

        await createVendedor.mutateAsync(vendedorData);
        toast.success('Vendedor criado com sucesso!');
      }
      
      onOpenChange(false);
    } catch (error: any) {
      if (error.code === '23505') {
        toast.error('Este usuário já está cadastrado como vendedor');
      } else {
        toast.error('Erro ao salvar vendedor: ' + error.message);
      }
    }
  };

  // Filtrar usuários disponíveis que ainda não são vendedores
  const filteredUsers = availableUsers.filter(user => {
    // Se estamos editando, incluir o usuário atual
    if (vendedor && (user.profiles?.id === vendedor.id || user.user_id === vendedor.id)) {
      return true;
    }
    // Caso contrário, só mostrar usuários que não são vendedores ainda
    return !vendedor;
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {vendedor ? 'Editar Vendedor' : 'Novo Vendedor'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="user_id">Usuário *</Label>
            <Select 
              value={formData.user_id} 
              onValueChange={(value) => setFormData({ ...formData, user_id: value })}
              disabled={!!vendedor} // Não permite alterar usuário ao editar
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um usuário" />
              </SelectTrigger>
              <SelectContent>
                {filteredUsers.map((user) => (
                  <SelectItem 
                    key={user.profiles?.id || user.user_id} 
                    value={user.profiles?.id || user.user_id}
                  >
                    <div className="flex flex-col">
                      <span>{user.profiles?.full_name || user.full_name}</span>
                      <span className="text-sm text-muted-foreground">
                        {user.profiles?.email || user.email}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {filteredUsers.length === 0 && !vendedor && (
              <p className="text-sm text-muted-foreground">
                Nenhum usuário disponível. Envie convites para novos usuários primeiro.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="office_id">Escritório *</Label>
            <Select 
              value={formData.office_id} 
              onValueChange={(value) => setFormData({ ...formData, office_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um escritório" />
              </SelectTrigger>
              <SelectContent>
                {offices?.map((office) => (
                  <SelectItem key={office.id} value={office.id}>
                    {office.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="team_id">Equipe</Label>
            <Select 
              value={formData.team_id} 
              onValueChange={(value) => setFormData({ ...formData, team_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma equipe (opcional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="no-team">Sem equipe</SelectItem>
                {teams?.map((team) => (
                  <SelectItem key={team.id} value={team.id}>
                    {team.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="commission_rate">Taxa de Comissão (%)</Label>
              <Input
                id="commission_rate"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={formData.commission_rate}
                onChange={(e) => setFormData({ ...formData, commission_rate: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hierarchy_level">Nível Hierárquico</Label>
              <Input
                id="hierarchy_level"
                type="number"
                min="1"
                max="10"
                value={formData.hierarchy_level}
                onChange={(e) => setFormData({ ...formData, hierarchy_level: parseInt(e.target.value) || 1 })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sales_goal">Meta de Vendas (R$)</Label>
            <Input
              id="sales_goal"
              type="number"
              step="0.01"
              min="0"
              value={formData.sales_goal}
              onChange={(e) => setFormData({ ...formData, sales_goal: parseFloat(e.target.value) || 0 })}
              placeholder="0.00"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="whatsapp">WhatsApp</Label>
            <Input
              id="whatsapp"
              type="tel"
              value={formData.whatsapp}
              onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
              placeholder="(11) 99999-9999"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Input
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Observações sobre o vendedor"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="active"
              checked={formData.active}
              onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
            />
            <Label htmlFor="active">Ativo</Label>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={
                createVendedor.isPending || 
                updateVendedor.isPending || 
                !formData.user_id || 
                !formData.office_id
              }
            >
              {(createVendedor.isPending || updateVendedor.isPending) ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
