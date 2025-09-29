import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Send, User, Clock } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useAdminSupportTicket,
  useTicketComments,
  useCreateTicketComment,
  useUpdateTicketStatus,
} from '@/hooks/useAdminSupport';

const statusLabels: Record<string, string> = {
  open: 'Aberto',
  in_progress: 'Em Andamento',
  pending_user: 'Aguardando Cliente',
  resolved: 'Resolvido',
  closed: 'Fechado',
};

interface TicketDetailModalProps {
  ticketId: string;
  open: boolean;
  onClose: () => void;
}

export function TicketDetailModal({ ticketId, open, onClose }: TicketDetailModalProps) {
  const [response, setResponse] = useState('');
  const [newStatus, setNewStatus] = useState('');

  const { data: ticket } = useAdminSupportTicket(ticketId);
  const { data: comments } = useTicketComments(ticketId);
  const createComment = useCreateTicketComment();
  const updateStatus = useUpdateTicketStatus();

  const handleSendResponse = () => {
    if (!response.trim()) return;

    createComment.mutate(
      {
        ticket_id: ticketId,
        content: response,
        is_internal: false, // Resposta visível para o cliente
      },
      {
        onSuccess: () => {
          setResponse('');
          // Atualizar status para "Aguardando Cliente" após responder
          if (ticket?.status === 'open' || ticket?.status === 'in_progress') {
            updateStatus.mutate({
              ticketId,
              status: 'pending_user',
            });
          }
        },
      }
    );
  };

  const handleStatusChange = (status: string) => {
    updateStatus.mutate(
      {
        ticketId,
        status,
      },
      {
        onSuccess: () => {
          setNewStatus('');
        },
      }
    );
  };

  if (!ticket) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="text-xl">{ticket.title}</DialogTitle>
              <DialogDescription className="flex items-center gap-2 mt-2">
                <span>Tenant: {(ticket as any).tenants?.name || 'N/A'}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {format(new Date(ticket.created_at), "dd/MM/yyyy 'às' HH:mm", {
                    locale: ptBR,
                  })}
                </span>
              </DialogDescription>
            </div>
            <div className="flex gap-2">
              <Badge>{ticket.priority}</Badge>
              <Badge>{ticket.category}</Badge>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Descrição Original */}
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <User className="h-4 w-4" />
              <span className="font-semibold">Descrição do Cliente</span>
            </div>
            <p className="text-sm whitespace-pre-wrap">{ticket.description}</p>
          </div>

          <Separator />

          {/* Histórico de Comentários */}
          <div className="space-y-3">
            <h3 className="font-semibold">Histórico de Respostas</h3>
            {comments && comments.length > 0 ? (
              comments.map((comment: any) => (
                <div
                  key={comment.id}
                  className={`p-4 rounded-lg ${
                    comment.is_internal
                      ? 'bg-blue-50 border border-blue-200'
                      : 'bg-green-50 border border-green-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span className="font-medium text-sm">
                        {comment.profiles?.full_name || 'Usuário'}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {comment.is_internal ? 'Interno' : 'Cliente'}
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(comment.created_at), 'dd/MM/yyyy HH:mm', {
                        locale: ptBR,
                      })}
                    </span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground italic">
                Nenhuma resposta ainda
              </p>
            )}
          </div>

          <Separator />

          {/* Alterar Status */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Atualizar Status</label>
            <div className="flex gap-2">
              <Select value={ticket.status} onValueChange={handleStatusChange}>
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Aberto</SelectItem>
                  <SelectItem value="in_progress">Em Andamento</SelectItem>
                  <SelectItem value="pending_user">Aguardando Cliente</SelectItem>
                  <SelectItem value="resolved">Resolvido</SelectItem>
                  <SelectItem value="closed">Fechado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Enviar Resposta */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Enviar Resposta</label>
            <Textarea
              placeholder="Digite sua resposta ao cliente..."
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={onClose}>
                Fechar
              </Button>
              <Button
                onClick={handleSendResponse}
                disabled={!response.trim() || createComment.isPending}
              >
                <Send className="h-4 w-4 mr-2" />
                Enviar Resposta
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
