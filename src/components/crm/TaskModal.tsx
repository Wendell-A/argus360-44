import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock, User } from 'lucide-react';
import { useCreateClientInteraction } from '@/hooks/useClientInteractions';
import { useClients } from '@/hooks/useClients';
import { useToast } from '@/hooks/use-toast';
import { fromLocalISOString, toLocalISOString, formatDateBR } from '@/lib/dateUtils';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  client?: {
    id: string;
    name: string;
  } | null;
}

const taskTypeOptions = [
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'call', label: 'Ligação' },
  { value: 'email', label: 'E-mail' },
  { value: 'meeting', label: 'Reunião' },
  { value: 'visit', label: 'Visita' },
  { value: 'proposal_sent', label: 'Proposta Enviada' },
  { value: 'follow_up', label: 'Follow-up' },
];

const priorityOptions = [
  { value: 'low', label: 'Baixa' },
  { value: 'medium', label: 'Média' },
  { value: 'high', label: 'Alta' },
  { value: 'urgent', label: 'Urgente' },
];

export function TaskModal({ isOpen, onClose, client }: TaskModalProps) {
  const [formData, setFormData] = useState({
    client_id: '',
    task_type: 'call' as const,
    title: '',
    description: '',
    priority: 'medium' as const,
    due_date: '',
  });

  const { createInteractionAsync, isCreating } = useCreateClientInteraction();
  const { clients } = useClients();
  const { toast } = useToast();

  const resetForm = () => {
    setFormData({
      client_id: client?.id || '',
      task_type: 'call',
      title: '',
      description: '',
      priority: 'medium',
      due_date: '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('=== INICIANDO CRIAÇÃO DE TAREFA ===');
    console.log('Cliente fornecido via prop:', client);
    console.log('Cliente no formulário:', formData.client_id);
    console.log('Dados do formulário:', formData);
    
    // Determinar o cliente a ser usado (prop ou selecionado no form)
    const clientId = client?.id || formData.client_id;
    
    // Validar se cliente foi fornecido
    if (!clientId || clientId.trim() === '') {
      console.error('Erro: Cliente inválido ou não fornecido');
      toast({
        title: "Erro",
        description: "Cliente deve ser selecionado para criar tarefa.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.title.trim()) {
      console.error('Erro: Título não fornecido');
      toast({
        title: "Erro",
        description: "Título é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.due_date) {
      console.error('Erro: Data não fornecida');
      toast({
        title: "Erro",
        description: "Data é obrigatória.",
        variant: "destructive",
      });
      return;
    }

  // Validar se a data não é anterior a hoje - usando utilitários de data para evitar problemas de timezone
  const { fromLocalISOString, toLocalISOString } = require('@/lib/dateUtils');
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = fromLocalISOString(formData.due_date);
  
  console.log('Validação de data:', {
    today: toLocalISOString(today),
    dueDate: toLocalISOString(dueDate),
    dueDateString: formData.due_date
  });

  if (dueDate < today) {
      console.error('Erro: Data anterior a hoje');
      toast({
        title: "Erro",
        description: "A data da tarefa não pode ser anterior a hoje.",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('=== CRIANDO INTERAÇÃO ===');
      
      // Criar ISO string consistente para scheduled_at - usando utilitários de data
      const localDate = fromLocalISOString(formData.due_date);
      localDate.setHours(12, 0, 0, 0); // Meio-dia para evitar problemas de timezone
      const scheduledAtISO = localDate.toISOString();
      
      const interactionData = {
        client_id: clientId,
        interaction_type: formData.task_type,
        title: formData.title,
        description: formData.description || '',
        priority: formData.priority,
        status: 'pending',
        next_action: `${taskTypeOptions.find(opt => opt.value === formData.task_type)?.label}: ${formData.title}`,
        next_action_date: formData.due_date,
        scheduled_at: scheduledAtISO,
      };
      
      console.log('Dados para criação:', interactionData);
      
      await createInteractionAsync(interactionData);

      console.log('=== TAREFA CRIADA COM SUCESSO ===');
      toast({
        title: "Sucesso",
        description: "Tarefa criada com sucesso.",
      });

      onClose();
      resetForm();
    } catch (error) {
      console.error('=== ERRO AO CRIAR TAREFA ===');
      console.error('Detalhes do erro:', error);
      console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
      
      let errorMessage = "Não foi possível criar a tarefa.";
      
      if (error instanceof Error) {
        if (error.message.includes('violates check constraint')) {
          errorMessage = "Erro de validação nos dados da tarefa.";
        } else if (error.message.includes('violates row-level security')) {
          errorMessage = "Erro de permissão. Verifique se você tem acesso a este cliente.";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Erro ao criar tarefa",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen, client]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Nova Tarefa
            {(client || formData.client_id) && (
              <span className="text-sm text-muted-foreground">
                - {client?.name || clients.find(c => c.id === formData.client_id)?.name}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Seletor de Cliente (apenas se não houver cliente pré-selecionado) */}
          {!client && (
            <div>
              <Label htmlFor="client_id">Cliente *</Label>
              <Select
                value={formData.client_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, client_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um cliente">
                    {formData.client_id && (
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        {clients.find(c => c.id === formData.client_id)?.name}
                      </div>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="z-50">
                  {clients.map(clientOption => (
                    <SelectItem key={clientOption.id} value={clientOption.id}>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        {clientOption.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="task_type">Tipo de Tarefa</Label>
              <Select
                value={formData.task_type}
                onValueChange={(value: any) => setFormData(prev => ({ ...prev, task_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-50">
                  {taskTypeOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="priority">Prioridade</Label>
              <Select
                value={formData.priority}
                onValueChange={(value: any) => setFormData(prev => ({ ...prev, priority: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-50">
                  {priorityOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Ex: Ligar para cliente sobre proposta"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Descreva detalhes da tarefa..."
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="due_date">Data de Vencimento *</Label>
            <Input
              id="due_date"
              type="date"
              value={formData.due_date}
              onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
              min={new Date().toISOString().split('T')[0]}
              required
            />
          </div>

          {formData.due_date && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-sm text-blue-800">Prévia da Tarefa:</span>
              </div>
              <p className="text-sm text-blue-700 mt-1">
                {taskTypeOptions.find(opt => opt.value === formData.task_type)?.label}: {formData.title}
              </p>
              <p className="text-xs text-blue-600">
                Vencimento: {formatDateBR(fromLocalISOString(formData.due_date))}
              </p>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isCreating}>
              {isCreating ? 'Criando...' : 'Criar Tarefa'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}