
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar, Clock, AlertCircle, CheckCircle2, Plus, User } from 'lucide-react';
import { useContextualInteractions, useUpdateContextualInteraction } from '@/hooks/useContextualInteractions';
import { useClients } from '@/hooks/useClients';
import { format, isAfter, isToday, isTomorrow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { TaskModal } from './TaskModal';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface UpcomingTasksProps {
  clientId?: string;
}

const getDateLabel = (date: Date) => {
  if (isToday(date)) return 'Hoje';
  if (isTomorrow(date)) return 'Amanhã';
  if (isAfter(new Date(), date)) return 'Atrasado';
  return format(date, 'dd/MM/yyyy', { locale: ptBR });
};

const getDateColor = (date: Date) => {
  if (isAfter(new Date(), date)) return 'bg-red-100 text-red-800';
  if (isToday(date)) return 'bg-orange-100 text-orange-800';
  if (isTomorrow(date)) return 'bg-yellow-100 text-yellow-800';
  return 'bg-blue-100 text-blue-800';
};

export function UpcomingTasks({ clientId }: UpcomingTasksProps) {
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  
  const { data: interactions = [], isLoading } = useContextualInteractions(clientId);
  const { clients } = useClients();
  const { mutateAsync: updateInteractionAsync, isPending: isUpdating } = useUpdateContextualInteraction();
  const { toast } = useToast();

  // Filtrar interações que têm próximas ações agendadas ou são tarefas pendentes
  const upcomingTasks = interactions
    .filter(interaction => 
      (interaction.next_action && interaction.next_action_date && interaction.status !== 'completed') ||
      (interaction.status === 'pending' && interaction.scheduled_at)
    )
    .sort((a, b) => {
      const dateA = new Date(a.next_action_date || a.scheduled_at!).getTime();
      const dateB = new Date(b.next_action_date || b.scheduled_at!).getTime();
      return dateA - dateB;
    });

  const handleCompleteTask = async (taskId: string) => {
    try {
      await updateInteractionAsync({
        id: taskId,
        updates: {
          status: 'completed',
          completed_at: new Date().toISOString(),
          next_action: '',
          next_action_date: null,
        }
      });

      toast({
        title: "Tarefa concluída",
        description: "A tarefa foi marcada como concluída com sucesso.",
      });
    } catch (error) {
      console.error('Error completing task:', error);
      toast({
        title: "Erro",
        description: "Não foi possível concluir a tarefa.",
        variant: "destructive",
      });
    }
  };

  const handleNewTask = () => {
    if (clientId) {
      // Se há um cliente específico, usar esse cliente
      setSelectedClientId(clientId);
    } else if (selectedClientId) {
      // Se cliente foi selecionado no dropdown
      // Manter o cliente selecionado
    } else {
      toast({
        title: "Selecione um cliente",
        description: "É necessário selecionar um cliente para criar uma tarefa.",
        variant: "destructive",
      });
      return;
    }
    setIsTaskModalOpen(true);
  };

  const getSelectedClient = () => {
    const targetClientId = clientId || selectedClientId;
    if (!targetClientId) return null;
    
    const client = clients.find(c => c.id === targetClientId);
    return client ? { id: client.id, name: client.name } : null;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Carregando tarefas...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Próximas Tarefas ({upcomingTasks.length})
            </div>
            <div className="flex items-center gap-2">
              {!clientId && (
                <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                  <SelectTrigger className="w-48 h-7 text-xs">
                    <SelectValue placeholder="Selecionar cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map(client => (
                      <SelectItem key={client.id} value={client.id}>
                        <div className="flex items-center gap-2">
                          <User className="w-3 h-3" />
                          {client.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Button 
                size="sm" 
                onClick={handleNewTask}
                className="h-7 text-xs"
              >
                <Plus className="w-3 h-3 mr-1" />
                Nova Tarefa
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingTasks.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-sm text-gray-500 mb-3">Nenhuma tarefa agendada.</p>
              <div className="space-y-2">
                {!clientId && (
                  <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecionar cliente para criar tarefa" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map(client => (
                        <SelectItem key={client.id} value={client.id}>
                          <div className="flex items-center gap-2">
                            <User className="w-3 h-3" />
                            {client.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={handleNewTask}
                  className="text-xs"
                  disabled={!clientId && !selectedClientId}
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Criar primeira tarefa
                </Button>
              </div>
            </div>
          ) : (
            <ScrollArea className="h-64">
              <div className="space-y-3">
                {upcomingTasks.map((task) => {
                  const taskDate = new Date(task.next_action_date || task.scheduled_at!);
                  const isOverdue = isAfter(new Date(), taskDate);
                  const taskTitle = task.next_action || task.title;
                  const taskClient = clients.find(c => c.id === task.client_id);
                  
                  return (
                    <div key={task.id} className="border rounded-lg p-3 space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          {isOverdue ? (
                            <AlertCircle className="w-4 h-4 text-red-500" />
                          ) : (
                            <Clock className="w-4 h-4 text-blue-500" />
                          )}
                          <span className="font-medium text-sm">{taskTitle}</span>
                        </div>
                        <Badge className={getDateColor(taskDate)}>
                          {getDateLabel(taskDate)}
                        </Badge>
                      </div>
                      
                      {task.description && (
                        <p className="text-sm text-gray-600">{task.description}</p>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Badge variant="outline" className="text-xs">
                            {task.priority}
                          </Badge>
                          <span>
                            {format(taskDate, 'dd/MM/yyyy', { locale: ptBR })}
                          </span>
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-6 text-xs"
                          onClick={() => handleCompleteTask(task.id)}
                          disabled={isUpdating}
                        >
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          {isUpdating ? 'Concluindo...' : 'Concluir'}
                        </Button>
                      </div>

                      {/* Mostrar informações do cliente se não foi filtrado por cliente específico */}
                      {!clientId && taskClient && (
                        <div className="text-xs text-gray-500 pt-1 border-t">
                          Cliente: <span className="font-medium">{taskClient.name}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        client={getSelectedClient()}
      />
    </>
  );
}
