import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { useUserManagement } from "@/hooks/useUserManagement";
import { useCreateClientTransfer } from "@/hooks/useClientTransfers";
import { UserCheck, ArrowRight } from "lucide-react";

interface ClientTransferModalProps {
  client: {
    id: string;
    name: string;
    responsible_user_id: string;
  } | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ClientTransferModal({ client, isOpen, onClose }: ClientTransferModalProps) {
  const [selectedUserId, setSelectedUserId] = useState("");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");

  const { users = [] } = useUserManagement();
  const createTransfer = useCreateClientTransfer();

  if (!client) return null;

  // Filtrar usuários disponíveis (excluir o responsável atual)
  const availableUsers = users.filter(user => 
    user.user_id !== client.responsible_user_id && user.active
  );

  const currentUser = users.find(user => user.user_id === client.responsible_user_id);
  const selectedUser = users.find(user => user.user_id === selectedUserId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedUserId) return;

    try {
      await createTransfer.mutateAsync({
        client_id: client.id,
        to_user_id: selectedUserId,
        reason,
        notes,
      });
      
      handleClose();
    } catch (error) {
      console.error("Erro ao repassar cliente:", error);
    }
  };

  const handleClose = () => {
    setSelectedUserId("");
    setReason("");
    setNotes("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            Repassar Cliente
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-lg border p-4 bg-muted/50">
            <h3 className="font-medium mb-2">Cliente</h3>
            <p className="text-sm font-medium">{client.name}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Responsável atual: {currentUser?.full_name || 'N/A'}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-responsible">Novo Responsável *</Label>
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o novo responsável" />
              </SelectTrigger>
              <SelectContent>
                {availableUsers.map((user) => (
                  <SelectItem key={user.user_id} value={user.user_id}>
                    <div className="flex items-center gap-2">
                      <span>{user.full_name}</span>
                      <span className="text-xs text-muted-foreground">
                        ({user.email})
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedUser && (
            <div className="rounded-lg border p-4 bg-muted/10">
              <div className="flex items-center justify-between text-sm">
                <div className="text-center">
                  <p className="font-medium">{currentUser?.full_name}</p>
                  <p className="text-xs text-muted-foreground">De</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <div className="text-center">
                  <p className="font-medium">{selectedUser.full_name}</p>
                  <p className="text-xs text-muted-foreground">Para</p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="reason">Motivo</Label>
            <Input
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ex: Redistribuição de carteira, especialização, etc."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Informações adicionais sobre o repasse..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={createTransfer.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!selectedUserId || createTransfer.isPending}
            >
              {createTransfer.isPending ? "Repassando..." : "Confirmar Repasse"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}