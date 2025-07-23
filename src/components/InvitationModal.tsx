
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useInvitations } from '@/hooks/useInvitations';
import { Mail, UserPlus, Info } from 'lucide-react';

interface InvitationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const roleOptions = [
  { 
    value: 'admin', 
    label: 'Administrador', 
    description: 'Gestão completa exceto configurações críticas',
    permissions: 'Pode gerenciar usuários, vendas, clientes e relatórios'
  },
  { 
    value: 'manager', 
    label: 'Gerente', 
    description: 'Gestão de vendas e equipes',
    permissions: 'Pode aprovar vendas, gerenciar equipe e ver relatórios'
  },
  { 
    value: 'user', 
    label: 'Usuário', 
    description: 'Operações básicas do dia a dia',
    permissions: 'Pode criar vendas, gerenciar clientes e suas comissões'
  },
  { 
    value: 'viewer', 
    label: 'Visualizador', 
    description: 'Apenas visualização',
    permissions: 'Pode apenas visualizar dados, sem editar'
  },
];

export function InvitationModal({ open, onOpenChange }: InvitationModalProps) {
  const { sendInvitation } = useInvitations();
  const [formData, setFormData] = useState({
    email: '',
    role: 'user',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.role) {
      return;
    }

    try {
      await sendInvitation.mutateAsync({
        email: formData.email,
        role: formData.role,
      });
      
      setFormData({ email: '', role: 'user' });
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao enviar convite:', error);
    }
  };

  const selectedRoleInfo = roleOptions.find(role => role.value === formData.role);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Enviar Convite
          </DialogTitle>
        </DialogHeader>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            O usuário receberá um email com link para se cadastrar ou aceitar o convite. 
            Após aceitar, ele aparecerá na lista de usuários disponíveis.
          </AlertDescription>
        </Alert>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email do Convidado</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="usuario@exemplo.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Função no Sistema</Label>
            <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {roleOptions.map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    <div className="flex flex-col text-left">
                      <span className="font-medium">{role.label}</span>
                      <span className="text-xs text-muted-foreground">
                        {role.description}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {selectedRoleInfo && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-1">{selectedRoleInfo.label}</p>
                <p className="text-xs text-muted-foreground mb-2">{selectedRoleInfo.description}</p>
                <p className="text-xs text-muted-foreground">
                  <strong>Permissões:</strong> {selectedRoleInfo.permissions}
                </p>
              </div>
            )}
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
              disabled={sendInvitation.isPending || !formData.email || !formData.role}
            >
              {sendInvitation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Enviando...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Enviar Convite
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
