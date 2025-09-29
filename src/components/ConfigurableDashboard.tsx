import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Settings, Eye, Save } from 'lucide-react';
import { toast } from 'sonner';
import { useActiveDashboardConfig, useDashboardConfigurations, useSaveDashboardConfiguration } from '@/hooks/useDashboardPersonalization';
import { DashboardConfigModal } from './DashboardConfigModal';
import { DynamicMetricCard } from './DynamicMetricCard';
import { ConfigurableChart } from './ConfigurableChart';
import { useAuth } from '@/contexts/AuthContext';

export function ConfigurableDashboard() {
  const [selectedConfig, setSelectedConfig] = useState<'A' | 'B' | 'C'>('A');
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
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
      await saveMutation.mutateAsync(updatedConfig);
      refetch();
      toast.success('Configuração salva com sucesso!');
    } catch (error) {
      toast.error('Erro ao salvar configuração');
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
      await saveMutation.mutateAsync(updatedConfig);
      refetch();
      toast.success('Configuração salva com sucesso!');
    } catch (error) {
      toast.error('Erro ao salvar configuração');
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
          />
        ))}
      </div>

      {/* Listas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {activeConfig.widget_configs.lists.map((list) => (
          <Card key={list.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                {list.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                Mostrando últimos {list.limit} registros de {list.type.replace('_', ' ')}
              </div>
            </CardContent>
          </Card>
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