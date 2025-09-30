/**
 * Modal de Alteração de E-mail
 * Data: 30 de Setembro de 2025
 */

import { useState } from 'react';
import { Mail } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface ChangeEmailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentEmail: string;
  onConfirm: (newEmail: string) => void;
  isLoading: boolean;
}

export const ChangeEmailModal = ({
  open,
  onOpenChange,
  currentEmail,
  onConfirm,
  isLoading,
}: ChangeEmailModalProps) => {
  const [newEmail, setNewEmail] = useState('');
  const [error, setError] = useState('');

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newEmail) {
      setError('Digite o novo e-mail');
      return;
    }

    if (!validateEmail(newEmail)) {
      setError('Digite um e-mail válido');
      return;
    }

    if (newEmail === currentEmail) {
      setError('O novo e-mail deve ser diferente do atual');
      return;
    }

    setError('');
    onConfirm(newEmail);
    handleClose();
  };

  const handleClose = () => {
    setNewEmail('');
    setError('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Alterar E-mail
          </DialogTitle>
          <DialogDescription>
            Um e-mail de confirmação será enviado para o novo endereço.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-email">E-mail Atual</Label>
            <Input
              id="current-email"
              type="email"
              value={currentEmail}
              disabled
              className="bg-muted"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-email">Novo E-mail</Label>
            <Input
              id="new-email"
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="Digite seu novo e-mail"
              className={error ? 'border-destructive' : ''}
            />
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>

          <div className="bg-muted p-3 rounded-md">
            <p className="text-sm text-muted-foreground">
              <strong>Importante:</strong> Você receberá um e-mail de confirmação no novo endereço. 
              Será necessário clicar no link de confirmação para concluir a alteração.
            </p>
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Enviando...' : 'Confirmar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
