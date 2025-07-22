
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  TrendingUp, 
  Clock, 
  Target,
  MessageCircle,
  Phone,
  Calendar
} from 'lucide-react';
import { SalesFunnelBoard } from '@/components/crm/SalesFunnelBoard';
import { useClientFunnelPositions } from '@/hooks/useSalesFunnel';
import { useAutomatedTasks } from '@/hooks/useAutomatedTasks';

export default function CRM() {
  const { positions } = useClientFunnelPositions();
  const { tasks } = useAutomatedTasks();

  // Calcular métricas do CRM
  const totalClients = positions.length;
  const pendingTasks = tasks.filter(task => task.status === 'pending').length;
  const overdueTasks = tasks.filter(task => {
    const dueDate = new Date(task.due_date);
    return task.status === 'pending' && dueDate < new Date();
  }).length;

  // Calcular conversão por fase
  const conversionRate = positions.reduce((acc, pos) => acc + (pos.probability || 0), 0) / positions.length || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4 sm:p-6 lg:p-8 w-full max-w-none">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 lg:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-gray-900">
              CRM - Funil de Vendas
            </h1>
            <p className="text-sm sm:text-base lg:text-lg text-gray-600 mt-1">
              Gerencie seus clientes e acompanhe o pipeline de vendas
            </p>
          </div>
        </div>

        {/* Métricas Principais */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6 lg:mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clientes no Funil</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalClients}</div>
              <p className="text-xs text-gray-600 mt-1">Total ativo</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{conversionRate.toFixed(1)}%</div>
              <p className="text-xs text-green-600 mt-1">Probabilidade média</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tarefas Pendentes</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingTasks}</div>
              <p className="text-xs text-yellow-600 mt-1">Para hoje</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tarefas Atrasadas</CardTitle>
              <Target className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overdueTasks}</div>
              <p className="text-xs text-red-600 mt-1">Requer atenção</p>
            </CardContent>
          </Card>
        </div>

        {/* Abas do CRM */}
        <Tabs defaultValue="funnel" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="funnel">Funil de Vendas</TabsTrigger>
            <TabsTrigger value="tasks">Tarefas</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="funnel" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Pipeline de Vendas</CardTitle>
              </CardHeader>
              <CardContent>
                <SalesFunnelBoard />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tasks" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Minhas Tarefas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {tasks.slice(0, 10).map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex-1">
                        <h4 className="font-medium">{task.title}</h4>
                        <p className="text-sm text-gray-600">{task.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {task.task_type.replace('_', ' ')}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            Vence: {new Date(task.due_date).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {task.task_type === 'send_whatsapp' && (
                          <Button size="sm" variant="outline">
                            <MessageCircle className="w-4 h-4" />
                          </Button>
                        )}
                        {task.task_type === 'call_client' && (
                          <Button size="sm" variant="outline">
                            <Phone className="w-4 h-4" />
                          </Button>
                        )}
                        {task.task_type === 'schedule_meeting' && (
                          <Button size="sm" variant="outline">
                            <Calendar className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {tasks.length === 0 && (
                    <div className="text-center text-gray-500 py-8">
                      Nenhuma tarefa pendente
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Conversão por Fase</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center text-gray-500 py-8">
                    Gráfico de conversão em breve...
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Performance do Mês</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center text-gray-500 py-8">
                    Métricas de performance em breve...
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
