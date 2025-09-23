
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Target, Calendar, TrendingUp } from 'lucide-react';
import { ClientInteractionHistory } from '@/components/crm/ClientInteractionHistory';
import { SalesFunnelBoard } from '@/components/crm/SalesFunnelBoard';
import { UpcomingTasks } from '@/components/crm/UpcomingTasks';
import { TaskKanban } from '@/components/crm/TaskKanban';
import { useSalesFunnelStages, useClientFunnelPositions } from '@/hooks/useSalesFunnel';
import { useClientInteractions } from '@/hooks/useClientInteractions';

export default function CRM() {
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const { stages, isLoading: stagesLoading } = useSalesFunnelStages();
  const { positions, isLoading: positionsLoading } = useClientFunnelPositions();
  const { interactions } = useClientInteractions();

  // Calcular métricas
  const totalClients = positions.length;
  const totalInteractions = interactions.length;
  const activeTasks = interactions.filter(i => 
    i.next_action && i.next_action_date && i.status !== 'completed'
  ).length;
  
  // Calcular conversão (clientes na última fase / total)
  const lastStage = stages.sort((a, b) => b.order_index - a.order_index)[0];
  const convertedClients = lastStage ? positions.filter(p => p.sales_funnel_stages?.id === lastStage.id).length : 0;
  const conversionRate = totalClients > 0 ? ((convertedClients / totalClients) * 100).toFixed(1) : '0';

  const isLoading = stagesLoading || positionsLoading;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Carregando CRM...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">CRM - Funil de Vendas</h1>
          <p className="text-muted-foreground">Gerencie seus clientes e acompanhe o pipeline de vendas</p>
        </div>
      </div>

      {/* Métricas do Dashboard */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClients}</div>
            <p className="text-xs text-muted-foreground">no funil de vendas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{conversionRate}%</div>
            <p className="text-xs text-muted-foreground">clientes convertidos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Interações</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalInteractions}</div>
            <p className="text-xs text-muted-foreground">registradas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tarefas Ativas</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeTasks}</div>
            <p className="text-xs text-muted-foreground">a serem concluídas</p>
          </CardContent>
        </Card>
      </div>

      {/* Conteúdo Principal */}
      <Tabs defaultValue="funnel" className="space-y-4">
        <TabsList>
          <TabsTrigger value="funnel">Funil de Vendas</TabsTrigger>
          <TabsTrigger value="tasks">Próximas Tarefas</TabsTrigger>
          <TabsTrigger value="history">Histórico do Cliente</TabsTrigger>
        </TabsList>

        <TabsContent value="funnel" className="space-y-4">
          <SalesFunnelBoard onClientSelect={setSelectedClientId} />
        </TabsContent>

        <TabsContent value="tasks" className="space-y-4">
          <TaskKanban />
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {selectedClientId ? (
            <ClientInteractionHistory clientId={selectedClientId} />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Histórico do Cliente</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-500">Selecione um cliente no funil de vendas para visualizar seu histórico de interações.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
