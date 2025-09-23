import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Calendar, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  Edit3, 
  User, 
  Plus,
  Kanban,
  Play,
  Pause,
  X
} from 'lucide-react';
import { useClientInteractions, useUpdateClientInteraction } from '@/hooks/useClientInteractions';
import { useClients } from '@/hooks/useClients';
import { format, isAfter, isToday, isTomorrow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { TaskModal } from './TaskModal';
import { TaskEditModal } from './TaskEditModal';

interface TaskKanbanProps {
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

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'urgent': return 'bg-red-500';
    case 'high': return 'bg-orange-500';
    case 'medium': return 'bg-blue-500';
    case 'low': return 'bg-gray-400';
    default: return 'bg-blue-500';
  }
};

const getStatusConfig = (status: string) => {
  switch (status) {
    case 'pending':
      return {
        title: 'Pendentes',
        icon: Pause,
        color: 'bg-yellow-50 border-yellow-200',
        headerColor: 'text-yellow-800',
        count: 0
      };
    case 'scheduled':
      return {
        title: 'Agendadas',
        icon: Calendar,
        color: 'bg-blue-50 border-blue-200',
        headerColor: 'text-blue-800',
        count: 0
      };
    case 'completed':
      return {
        title: 'Concluídas',
        icon: CheckCircle2,
        color: 'bg-green-50 border-green-200',
        headerColor: 'text-green-800',
        count: 0
      };
    case 'cancelled':
      return {
        title: 'Canceladas',
        icon: X,
        color: 'bg-gray-50 border-gray-200',
        headerColor: 'text-gray-800',
        count: 0
      };
    default:
      return {
        title: 'Outras',
        icon: Clock,
        color: 'bg-gray-50 border-gray-200',
        headerColor: 'text-gray-800',
        count: 0
      };
  }
};

export function TaskKanban({ clientId }: TaskKanbanProps) {
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  
  const { interactions, isLoading } = useClientInteractions(clientId);
  const { clients } = useClients();
  const { updateInteractionAsync, isUpdating } = useUpdateClientInteraction();
  const { toast } = useToast();

  // Filtrar apenas tarefas (interações pendentes ou com próximas ações)
  const tasks = useMemo(() => {
    return interactions.filter(interaction => 
      (interaction.status === 'pending' && interaction.scheduled_at) ||
      (interaction.next_action && interaction.next_action_date) ||
      interaction.status === 'scheduled' ||
      interaction.status === 'completed' ||
      interaction.status === 'cancelled'
    );
  }, [interactions]);

  // Agrupar tarefas por status
  const tasksByStatus = useMemo(() => {
    const grouped = {
      pending: [] as any[],
      scheduled: [] as any[],
      completed: [] as any[],
      cancelled: [] as any[]
    };

    tasks.forEach(task => {
      const status = task.status as keyof typeof grouped;
      if (grouped[status]) {
        grouped[status].push(task);
      }
    });

    // Ordenar por data dentro de cada status
    Object.keys(grouped).forEach(status => {
      grouped[status as keyof typeof grouped].sort((a, b) => {
        const dateA = new Date(a.next_action_date || a.scheduled_at!).getTime();
        const dateB = new Date(b.next_action_date || b.scheduled_at!).getTime();
        return dateA - dateB;
      });
    });

    return grouped;
  }, [tasks]);

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      const updateData: any = {
        id: taskId,
        status: newStatus,
      };

      if (newStatus === 'completed') {
        updateData.completed_at = new Date().toISOString();
        updateData.next_action = null;
        updateData.next_action_date = null;
      }

      await updateInteractionAsync(updateData);

      toast({
        title: "Status atualizado",
        description: `Tarefa movida para ${getStatusConfig(newStatus).title.toLowerCase()}.`,
      });
    } catch (error) {
      console.error('Error updating task status:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status da tarefa.",
        variant: "destructive",
      });
    }
  };

  const handleEditTask = (task: any) => {
    setSelectedTask(task);
    setIsEditModalOpen(true);
  };

  const renderTaskCard = (task: any) => {
    const taskDate = new Date(task.next_action_date || task.scheduled_at!);
    const isOverdue = isAfter(new Date(), taskDate) && task.status !== 'completed';
    const taskTitle = task.next_action || task.title;
    const taskClient = clients.find(c => c.id === task.client_id);

    return (
      <div key={task.id} className="bg-white border rounded-lg p-3 space-y-3 shadow-sm hover:shadow-md transition-shadow">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-2 flex-1">
            {isOverdue && task.status !== 'completed' && (
              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
            )}
            <span className="font-medium text-sm leading-tight">{taskTitle}</span>
          </div>
          <div className={`w-2 h-2 rounded-full ${getPriorityColor(task.priority)} flex-shrink-0 mt-1`} />
        </div>

        {/* Description */}
        {task.description && (
          <p className="text-xs text-gray-600 line-clamp-2">{task.description}</p>
        )}

        {/* Date and Client */}
        <div className="space-y-2">
          <Badge className={`${getDateColor(taskDate)} text-xs`}>
            {getDateLabel(taskDate)}
          </Badge>
          
          {!clientId && taskClient && (
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <User className="w-3 h-3" />
              <span className="truncate">{taskClient.name}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="text-xs text-gray-500">
            {format(taskDate, 'dd/MM', { locale: ptBR })} - {format(taskDate, 'HH:mm', { locale: ptBR })}
          </div>
          
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0"
              onClick={() => handleEditTask(task)}
            >
              <Edit3 className="w-3 h-3" />
            </Button>
            
            {task.status === 'pending' && (
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0 text-green-600 hover:text-green-700"
                onClick={() => handleStatusChange(task.id, 'completed')}
                disabled={isUpdating}
              >
                <CheckCircle2 className="w-3 h-3" />
              </Button>
            )}
            
            {task.status === 'scheduled' && (
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0 text-blue-600 hover:text-blue-700"
                onClick={() => handleStatusChange(task.id, 'completed')}
                disabled={isUpdating}
              >
                <CheckCircle2 className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderColumn = (status: string) => {
    const config = getStatusConfig(status);
    const statusTasks = tasksByStatus[status as keyof typeof tasksByStatus];
    const Icon = config.icon;

    return (
      <Card key={status} className={`${config.color} min-h-[500px]`}>
        <CardHeader className="pb-3">
          <CardTitle className={`text-sm flex items-center justify-between ${config.headerColor}`}>
            <div className="flex items-center gap-2">
              <Icon className="w-4 h-4" />
              {config.title}
            </div>
            <Badge variant="secondary" className="text-xs">
              {statusTasks.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="pt-0">
          <ScrollArea className="h-[400px]">
            <div className="space-y-3">
              {statusTasks.map(renderTaskCard)}
              
              {statusTasks.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <Icon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-xs">Nenhuma tarefa</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Kanban className="w-4 h-4" />
            Carregando kanban de tarefas...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Kanban className="w-5 h-5" />
            <h3 className="text-lg font-semibold">Kanban de Tarefas</h3>
            <Badge variant="secondary">{tasks.length} total</Badge>
          </div>
          
          <Button 
            size="sm" 
            onClick={() => setIsTaskModalOpen(true)}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Nova Tarefa
          </Button>
        </div>

        {/* Kanban Board */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {renderColumn('pending')}
          {renderColumn('scheduled')}
          {renderColumn('completed')}
          {renderColumn('cancelled')}
        </div>
      </div>

      {/* Modals */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        client={null}
      />

      <TaskEditModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedTask(null);
        }}
        task={selectedTask}
      />
    </>
  );
}