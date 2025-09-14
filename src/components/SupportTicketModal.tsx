import { useState, useEffect } from 'react';
import { X, Save, MessageCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  useCreateSupportTicket,
  useUpdateSupportTicket,
  useSupportTicket,
  SupportTicketCategory,
  SupportTicketPriority,
  SupportTicketStatus,
  CreateTicketData,
} from '@/hooks/useSupportTickets';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const createTicketSchema = z.object({
  title: z.string().min(3, 'Título deve ter pelo menos 3 caracteres'),
  description: z.string().min(10, 'Descrição deve ter pelo menos 10 caracteres'),
  category: z.enum(['bug', 'feature_request', 'technical_support', 'account', 'billing', 'training', 'other']),
  priority: z.enum(['low', 'normal', 'high', 'urgent']),
});

const updateTicketSchema = z.object({
  title: z.string().min(3, 'Título deve ter pelo menos 3 caracteres').optional(),
  description: z.string().min(10, 'Descrição deve ter pelo menos 10 caracteres').optional(),
  category: z.enum(['bug', 'feature_request', 'technical_support', 'account', 'billing', 'training', 'other']).optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  status: z.enum(['open', 'in_progress', 'pending_user', 'resolved', 'closed']).optional(),
  resolution: z.string().optional(),
});

interface SupportTicketModalProps {
  open: boolean;
  onClose: () => void;
  ticketId?: string; // Se fornecido, é modo edição/visualização
}

const statusLabels: Record<SupportTicketStatus, string> = {
  open: 'Aberto',
  in_progress: 'Em Andamento',
  pending_user: 'Aguardando Usuário',
  resolved: 'Resolvido',
  closed: 'Fechado'
};

const statusColors: Record<SupportTicketStatus, string> = {
  open: 'destructive',
  in_progress: 'default',
  pending_user: 'secondary',
  resolved: 'outline',
  closed: 'outline'
};

const priorityLabels: Record<SupportTicketPriority, string> = {
  low: 'Baixa',
  normal: 'Normal',
  high: 'Alta',
  urgent: 'Urgente'
};

const categoryLabels: Record<SupportTicketCategory, string> = {
  bug: 'Bug/Erro',
  feature_request: 'Nova Funcionalidade',
  technical_support: 'Suporte Técnico',
  account: 'Conta',
  billing: 'Faturamento',
  training: 'Treinamento',
  other: 'Outros'
};

export function SupportTicketModal({ open, onClose, ticketId }: SupportTicketModalProps) {
  const [isEditing, setIsEditing] = useState(!ticketId);
  
  const { data: ticket, isLoading: loadingTicket } = useSupportTicket(ticketId || '');
  const createMutation = useCreateSupportTicket();
  const updateMutation = useUpdateSupportTicket();

  const isViewMode = !!ticketId;
  const isCreateMode = !ticketId;

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset,
    setValue,
    watch
  } = useForm({
    resolver: zodResolver(isCreateMode ? createTicketSchema : updateTicketSchema),
    defaultValues: {
      title: '',
      description: '',
      category: 'technical_support' as SupportTicketCategory,
      priority: 'normal' as SupportTicketPriority,
      status: 'open' as SupportTicketStatus,
      resolution: '',
    },
  });

  // Preencher formulário quando ticket for carregado
  useEffect(() => {
    if (ticket) {
      reset({
        title: ticket.title,
        description: ticket.description,
        category: ticket.category,
        priority: ticket.priority,
        status: ticket.status,
        resolution: ticket.resolution || '',
      });
    }
  }, [ticket, reset]);

  const onSubmit = async (data: any) => {
    try {
      if (isCreateMode) {
        await createMutation.mutateAsync(data as CreateTicketData);
      } else if (ticketId) {
        await updateMutation.mutateAsync({ id: ticketId, data });
        setIsEditing(false);
      }
      onClose();
    } catch (error) {
      console.error('Erro ao salvar ticket:', error);
    }
  };

  const handleClose = () => {
    reset();
    setIsEditing(!ticketId);
    onClose();
  };

  if (isViewMode && loadingTicket) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <div className="flex justify-center p-8">
            <div className="text-muted-foreground">Carregando ticket...</div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>
              {isCreateMode ? 'Novo Chamado de Suporte' : 
               isEditing ? 'Editar Chamado' : 'Detalhes do Chamado'}
            </DialogTitle>
            <div className="flex items-center gap-2">
              {isViewMode && !isEditing && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                >
                  Editar
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Status e metadados (somente no modo visualização) */}
          {isViewMode && ticket && (
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <Badge variant={statusColors[ticket.status] as any}>
                  {statusLabels[ticket.status]}
                </Badge>
                <Badge variant="outline">
                  Prioridade: {priorityLabels[ticket.priority]}
                </Badge>
                <Badge variant="secondary">
                  {categoryLabels[ticket.category]}
                </Badge>
              </div>
              
              <div className="text-sm text-muted-foreground space-y-1">
                <p>Criado {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true, locale: ptBR })}</p>
                {ticket.updated_at !== ticket.created_at && (
                  <p>Atualizado {formatDistanceToNow(new Date(ticket.updated_at), { addSuffix: true, locale: ptBR })}</p>
                )}
              </div>
              
              <Separator />
            </div>
          )}

          {/* Título */}
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            {isEditing ? (
              <Input
                id="title"
                {...register('title')}
                placeholder="Descreva brevemente o problema ou solicitação"
                disabled={createMutation.isPending || updateMutation.isPending}
              />
            ) : (
              <div className="p-3 bg-muted rounded-md">
                <p className="font-medium">{ticket?.title}</p>
              </div>
            )}
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          {/* Categoria e Prioridade */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Categoria *</Label>
              {isEditing ? (
                <Select
                  value={watch('category')}
                  onValueChange={(value) => setValue('category', value as SupportTicketCategory)}
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(categoryLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="p-3 bg-muted rounded-md">
                  <p>{categoryLabels[ticket?.category || 'other']}</p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Prioridade *</Label>
              {isEditing ? (
                <Select
                  value={watch('priority')}
                  onValueChange={(value) => setValue('priority', value as SupportTicketPriority)}
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a prioridade" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(priorityLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="p-3 bg-muted rounded-md">
                  <p>{priorityLabels[ticket?.priority || 'normal']}</p>
                </div>
              )}
            </div>
          </div>

          {/* Status (somente no modo edição de ticket existente) */}
          {isViewMode && isEditing && (
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={watch('status')}
                onValueChange={(value) => setValue('status', value as SupportTicketStatus)}
                disabled={updateMutation.isPending}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(statusLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrição *</Label>
            {isEditing ? (
              <Textarea
                id="description"
                {...register('description')}
                placeholder="Descreva em detalhes o problema, erro ou solicitação..."
                rows={6}
                disabled={createMutation.isPending || updateMutation.isPending}
              />
            ) : (
              <div className="p-3 bg-muted rounded-md min-h-[120px]">
                <p className="whitespace-pre-wrap">{ticket?.description}</p>
              </div>
            )}
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
            )}
          </div>

          {/* Resolução (somente se ticket estiver resolvido/fechado) */}
          {isViewMode && (ticket?.status === 'resolved' || ticket?.status === 'closed') && (
            <div className="space-y-2">
              <Label htmlFor="resolution">Resolução</Label>
              {isEditing ? (
                <Textarea
                  id="resolution"
                  {...register('resolution')}
                  placeholder="Descreva como o problema foi resolvido..."
                  rows={4}
                  disabled={updateMutation.isPending}
                />
              ) : (
                <div className="p-3 bg-green-50 border border-green-200 rounded-md min-h-[100px]">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">Resolução</span>
                  </div>
                  <p className="whitespace-pre-wrap text-green-700">
                    {ticket?.resolution || 'Nenhuma resolução documentada.'}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Botões */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              Cancelar
            </Button>
            
            {isEditing && (
              <Button
                type="submit"
                disabled={!isValid || createMutation.isPending || updateMutation.isPending}
              >
                <Save className="w-4 h-4 mr-2" />
                {isCreateMode ? 'Criar Chamado' : 'Salvar Alterações'}
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}