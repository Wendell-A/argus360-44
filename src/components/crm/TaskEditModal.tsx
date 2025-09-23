import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock } from 'lucide-react';
import { useUpdateClientInteraction } from '@/hooks/useClientInteractions';
import { useToast } from '@/hooks/use-toast';

interface TaskEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: {
    id: string;
    title: string;
    description?: string;
    priority: string;
    status: string;
    interaction_type: string;
    scheduled_at?: string;
    next_action_date?: string;
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

const statusOptions = [
  { value: 'pending', label: 'Pendente' },
  { value: 'scheduled', label: 'Agendada' },
  { value: 'completed', label: 'Concluída' },
  { value: 'cancelled', label: 'Cancelada' },
];

export function TaskEditModal({ isOpen, onClose, task }: TaskEditModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    status: 'pending',
    interaction_type: 'call',
    due_date: '',
  });

  const { updateInteractionAsync, isUpdating } = useUpdateClientInteraction();
  const { toast } = useToast();

  useEffect(() => {
    if (task && isOpen) {
      const dueDate = task.next_action_date || 
                      (task.scheduled_at ? new Date(task.scheduled_at).toISOString().split('T')[0] : '');
      
      setFormData({
        title: task.title,
        description: task.description || '',
        priority: task.priority,
        status: task.status,
        interaction_type: task.interaction_type,
        due_date: dueDate,
      });
    }
  }, [task, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!task) return;

    if (!formData.title.trim()) {
      toast({
        title: "Erro",
        description: "Título é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.due_date) {
      toast({
        title: "Erro",
        description: "Data é obrigatória.",
        variant: "destructive",
      });
      return;
    }

    try {
      const scheduledAtISO = new Date(formData.due_date + 'T09:00:00.000Z').toISOString();
      
      await updateInteractionAsync({
        id: task.id,
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        status: formData.status,
        interaction_type: formData.interaction_type,
        next_action_date: formData.due_date,
        scheduled_at: scheduledAtISO,
        next_action: `${taskTypeOptions.find(opt => opt.value === formData.interaction_type)?.label}: ${formData.title}`,
        ...(formData.status === 'completed' && { completed_at: new Date().toISOString() })
      });

      toast({
        title: "Sucesso",
        description: "Tarefa atualizada com sucesso.",
      });

      onClose();
    } catch (error) {
      console.error('Error updating task:', error);
      toast({
        title: "Erro ao atualizar tarefa",
        description: error instanceof Error ? error.message : "Não foi possível atualizar a tarefa.",
        variant: "destructive",
      });
    }
  };

  if (!task) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Editar Tarefa
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="interaction_type">Tipo de Tarefa</Label>
              <Select
                value={formData.interaction_type}
                onValueChange={(value) => setFormData(prev => ({ ...prev, interaction_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
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
                onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
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
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
                {taskTypeOptions.find(opt => opt.value === formData.interaction_type)?.label}: {formData.title}
              </p>
              <p className="text-xs text-blue-600">
                Status: {statusOptions.find(opt => opt.value === formData.status)?.label} | 
                Vencimento: {new Date(formData.due_date + 'T00:00:00').toLocaleDateString('pt-BR')}
              </p>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isUpdating}>
              {isUpdating ? 'Atualizando...' : 'Atualizar Tarefa'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}