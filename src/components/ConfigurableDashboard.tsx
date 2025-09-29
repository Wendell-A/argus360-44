import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Settings, Eye, Save, TrendingUp, Users, CheckCircle, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { useActiveDashboardConfig, useDashboardConfigurations, useSaveDashboardConfiguration } from '@/hooks/useDashboardPersonalization';
import { DashboardConfigModal } from './DashboardConfigModal';
import { DynamicMetricCard } from './DynamicMetricCard';
import { ConfigurableChart } from './ConfigurableChart';
import { useDynamicListData } from '@/hooks/useDynamicListData';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function ConfigurableDashboard() {
  const [selectedConfig, setSelectedConfig] = useState<'A' | 'B' | 'C'>('A');
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { user, activeTenant } = useAuth();
  const { data: configurations } = useDashboardConfigurations();
  const { data: activeConfig, isLoading, refetch } = useActiveDashboardConfig(selectedConfig);
  const saveMutation = useSaveDashboardConfiguration();

  const canManageConfigs = user && activeTenant && ['owner', 'admin'].includes(activeTenant.user_role || '');

  const handleMetricChange = async (newConfig: any) => {
    if (!activeConfig) return;
    
    const updatedConfig = {
      ...activeConfig,
      widget_configs: {
        ...activeConfig.widget_configs,
        metrics: activeConfig.widget_configs.metrics.map(metric => 
          metric.id === newConfig.id ? newConfig : metric
        ),
      },
    };

    try {
      setIsRefreshing(true);
      await saveMutation.mutateAsync(updatedConfig);
      await refetch();
      toast.success('Configuração salva com sucesso!', {
        description: 'Os dados foram atualizados',
        duration: 2000,
      });
    } catch (error) {
      toast.error('Erro ao salvar configuração');
    } finally {
      // Delay para mostrar animação
      setTimeout(() => setIsRefreshing(false), 800);
    }
  };

  const handleChartChange = async (newConfig: any) => {
    if (!activeConfig) return;
    
    const updatedConfig = {
      ...activeConfig,
      widget_configs: {
        ...activeConfig.widget_configs,
        charts: activeConfig.widget_configs.charts.map(chart => 
          chart.id === newConfig.id ? newConfig : chart
        ),
      },
    };

    try {
      setIsRefreshing(true);
      await saveMutation.mutateAsync(updatedConfig);
      await refetch();
      toast.success('Configuração salva com sucesso!', {
        description: 'Os dados foram atualizados',
        duration: 2000,
      });
    } catch (error) {
      toast.error('Erro ao salvar configuração');
    } finally {
      // Delay para mostrar animação
      setTimeout(() => setIsRefreshing(false), 800);
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-muted rounded w-24"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-16 mb-2"></div>
              <div className="h-3 bg-muted rounded w-32"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!activeConfig) {
    return <div>Erro ao carregar configuração do dashboard</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header de Controle */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          
          {/* Seletor de Configuração */}
          <div className="flex gap-2">
            {(['A', 'B', 'C'] as const).map((config) => {
              const configExists = configurations?.some(c => c.config_name === config);
              const isDefault = configurations?.find(c => c.config_name === config)?.is_default;
              
              return (
                <Button
                  key={config}
                  variant={selectedConfig === config ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedConfig(config)}
                  className="relative"
                >
                  Modelo {config}
                  {isDefault && (
                    <Badge variant="secondary" className="absolute -top-2 -right-2 text-xs px-1">
                      Padrão
                    </Badge>
                  )}
                  {!configExists && (
                    <Badge variant="outline" className="absolute -top-2 -right-2 text-xs px-1">
                      Novo
                    </Badge>
                  )}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Botões de Ação */}
        {canManageConfigs && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsConfigModalOpen(true)}
            >
              <Settings className="h-4 w-4 mr-2" />
              Configurar
            </Button>
          </div>
        )}
      </div>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {activeConfig.widget_configs.metrics.map((metric) => (
          <DynamicMetricCard 
            key={metric.id} 
            config={metric} 
            onConfigChange={handleMetricChange}
          />
        ))}
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {activeConfig.widget_configs.charts.map((chart) => (
          <ConfigurableChart 
            key={chart.id} 
            config={chart} 
            onConfigChange={handleChartChange}
            isRefreshing={isRefreshing}
          />
        ))}
      </div>

      {/* Listas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {activeConfig.widget_configs.lists.map((list) => (
          <DynamicList key={list.id} config={list} />
        ))}
      </div>

      {/* Modal de Configuração */}
      {canManageConfigs && (
        <DashboardConfigModal
          isOpen={isConfigModalOpen}
          onClose={() => setIsConfigModalOpen(false)}
          configName={selectedConfig}
          currentConfig={activeConfig}
        />
      )}
    </div>
  );
}

// Componente auxiliar para renderizar listas dinâmicas
function DynamicList({ config }: { config: any }) {
  const { data, isLoading } = useDynamicListData(config);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{config.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{config.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            Nenhum dado disponível
          </p>
        </CardContent>
      </Card>
    );
  }

  const renderListContent = () => {
    switch (config.type) {
      case 'recent_sales':
        return (
          <div className="space-y-3">
            {data.map((sale: any) => (
              <div key={sale.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    <span className="font-medium text-sm">{sale.client_name}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {sale.product_name} • {sale.seller_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(sale.sale_date), "dd/MM/yyyy", { locale: ptBR })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-sm">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(sale.sale_value)}
                  </p>
                  <Badge variant={sale.status === 'approved' ? 'default' : 'secondary'} className="text-xs">
                    {sale.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        );

      case 'top_sellers':
        return (
          <div className="space-y-3">
            {data.map((seller: any, index: number) => (
              <div key={seller.seller_id} className="flex items-center gap-3 p-3 border rounded-lg">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm">
                  {index + 1}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    <span className="font-medium text-sm">{seller.seller_name}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {seller.sale_count} {seller.sale_count === 1 ? 'venda' : 'vendas'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-sm">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(seller.total_sales)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        );

      case 'upcoming_tasks':
        return (
          <div className="space-y-3">
            {data.map((task: any) => (
              <div key={task.id} className="p-3 border rounded-lg space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 flex-1">
                    <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                    <span className="font-medium text-sm">{task.title}</span>
                  </div>
                  <Badge 
                    variant={
                      task.priority === 'high' ? 'destructive' : 
                      task.priority === 'medium' ? 'default' : 
                      'secondary'
                    }
                    className="text-xs"
                  >
                    {task.priority}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground pl-6">
                  <span>{task.client_name} • {task.seller_name}</span>
                  <span>{format(new Date(task.due_date), "dd/MM/yyyy", { locale: ptBR })}</span>
                </div>
              </div>
            ))}
          </div>
        );

      case 'commission_breakdown':
        return (
          <div className="space-y-3">
            {data.map((commission: any) => (
              <div key={commission.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-primary" />
                    <span className="font-medium text-sm">{commission.recipient_name}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {commission.commission_type === 'office' ? 'Escritório' : 'Vendedor'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Venc: {format(new Date(commission.due_date), "dd/MM/yyyy", { locale: ptBR })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-sm">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(commission.commission_amount)}
                  </p>
                  <Badge 
                    variant={
                      commission.status === 'paid' ? 'default' : 
                      commission.status === 'pending' ? 'secondary' : 
                      'destructive'
                    }
                    className="text-xs"
                  >
                    {commission.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        );

      default:
        return <p className="text-sm text-muted-foreground">Tipo de lista não suportado</p>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{config.title}</CardTitle>
      </CardHeader>
      <CardContent>
        {renderListContent()}
      </CardContent>
    </Card>
  );
}