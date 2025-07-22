
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useClientInteractions, useUpdateClientInteraction } from '@/hooks/useClientInteractions';
import { format, isAfter, isToday, isTomorrow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

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

const getInteractionTypeLabel = (type: string) => {
  const types = {
    'whatsapp': 'WhatsApp',
    'call': 'Ligação',
    'email': 'E-mail',
    'meeting': 'Reunião',
    'visit': 'Visita',
    'proposal_sent': 'Proposta Enviada',
    'follow_up': 'Follow-up'
  };
  return types[type as keyof typeof types] || type;
};

export function UpcomingTasks({ clientId }: UpcomingTasksProps) {
  const { interactions, isLoading } = useClientInteractions(clientId);
  const { updateInteractionAsync, isUpdating } = useUpdateClientInteraction();
  const { toast } = useToast();

  // Filtrar interações que têm próximas ações agendadas
  const upcomingTasks = interactions
    .filter(interaction => 
      interaction.next_action && 
      interaction.next_action_date && 
      interaction.status !== 'completed'
    )
    .sort((a, b) => 
      new Date(a.next_action_date!).getTime() - new Date(b.next_action_date!).getTime()
    );

  const handleCompleteTask = async (taskId: string) => {
    try {
      await updateInteractionAsync({
        id: taskId,
        status: 'completed',
        completed_at: new Date().toISOString(),
        next_action: null,
        next_action_date: null,
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

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Carregando tarefas...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  if (upcomingTasks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Próximas Tarefas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">Nenhuma tarefa agendada.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          Próximas Tarefas ({upcomingTasks.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-64">
          <div className="space-y-3">
            {upcomingTasks.map((task) => {
              const taskDate = new Date(task.next_action_date!);
              const isOverdue = isAfter(new Date(), taskDate);
              
              return (
                <div key={task.id} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {isOverdue ? (
                        <AlertCircle className="w-4 h-4 text-red-500" />
                      ) : (
                        <Clock className="w-4 h-4 text-blue-500" />
                      )}
                      <span className="font-medium text-sm">{task.title}</span>
                    </div>
                    <Badge className={getDateColor(taskDate)}>
                      {getDateLabel(taskDate)}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-gray-600">{task.next_action}</p>
                  
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
                  {!clientId && (
                    <div className="text-xs text-gray-500 pt-1 border-t">
                      Cliente: <span className="font-medium">Cliente #{task.client_id}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
