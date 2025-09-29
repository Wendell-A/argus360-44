import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Trash2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { DashboardConfiguration, MetricConfig, ChartConfig, useSaveDashboardConfiguration } from '@/hooks/useDashboardPersonalization';

interface DashboardConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  configName: 'A' | 'B' | 'C';
  currentConfig: DashboardConfiguration;
}

export function DashboardConfigModal({ isOpen, onClose, configName, currentConfig }: DashboardConfigModalProps) {
  const [localConfig, setLocalConfig] = useState<DashboardConfiguration>(currentConfig);
  const saveMutation = useSaveDashboardConfiguration();

  useEffect(() => {
    setLocalConfig({ ...currentConfig, config_name: configName });
  }, [currentConfig, configName]);

  const handleSave = async () => {
    try {
      await saveMutation.mutateAsync(localConfig);
      toast.success('Configuração salva com sucesso!');
      onClose();
    } catch (error) {
      toast.error('Erro ao salvar configuração');
      console.error(error);
    }
  };

  const addMetric = () => {
    const newMetric: MetricConfig = {
      id: `metric-${Date.now()}`,
      type: 'sales',
      title: 'Nova Métrica',
      aggregation: 'sum',
    };
    
    setLocalConfig(prev => ({
      ...prev,
      widget_configs: {
        ...prev.widget_configs,
        metrics: [...prev.widget_configs.metrics, newMetric],
      },
    }));
  };

  const updateMetric = (index: number, updates: Partial<MetricConfig>) => {
    setLocalConfig(prev => ({
      ...prev,
      widget_configs: {
        ...prev.widget_configs,
        metrics: prev.widget_configs.metrics.map((metric, i) => 
          i === index ? { ...metric, ...updates } : metric
        ),
      },
    }));
  };

  const removeMetric = (index: number) => {
    setLocalConfig(prev => ({
      ...prev,
      widget_configs: {
        ...prev.widget_configs,
        metrics: prev.widget_configs.metrics.filter((_, i) => i !== index),
      },
    }));
  };

  const addChart = () => {
    const newChart: ChartConfig = {
      id: `chart-${Date.now()}`,
      type: 'bar',
      title: 'Novo Gráfico',
      yAxis: {
        id: `y-${Date.now()}`,
        type: 'sales',
        title: 'Vendas',
        aggregation: 'sum',
      },
      xAxis: 'time',
    };
    
    setLocalConfig(prev => ({
      ...prev,
      widget_configs: {
        ...prev.widget_configs,
        charts: [...prev.widget_configs.charts, newChart],
      },
    }));
  };

  const updateChart = (index: number, updates: Partial<ChartConfig>) => {
    setLocalConfig(prev => ({
      ...prev,
      widget_configs: {
        ...prev.widget_configs,
        charts: prev.widget_configs.charts.map((chart, i) => 
          i === index ? { ...chart, ...updates } : chart
        ),
      },
    }));
  };

  const removeChart = (index: number) => {
    setLocalConfig(prev => ({
      ...prev,
      widget_configs: {
        ...prev.widget_configs,
        charts: prev.widget_configs.charts.filter((_, i) => i !== index),
      },
    }));
  };

  const addList = () => {
    const newList: any = {
      id: `list-${Date.now()}`,
      type: 'recent_sales',
      title: 'Nova Lista',
      limit: 10,
    };
    
    setLocalConfig(prev => ({
      ...prev,
      widget_configs: {
        ...prev.widget_configs,
        lists: [...(prev.widget_configs.lists || []), newList],
      },
    }));
  };

  const updateList = (index: number, updates: any) => {
    setLocalConfig(prev => ({
      ...prev,
      widget_configs: {
        ...prev.widget_configs,
        lists: (prev.widget_configs.lists || []).map((list, i) => 
          i === index ? { ...list, ...updates } : list
        ),
      },
    }));
  };

  const removeList = (index: number) => {
    setLocalConfig(prev => ({
      ...prev,
      widget_configs: {
        ...prev.widget_configs,
        lists: (prev.widget_configs.lists || []).filter((_, i) => i !== index),
      },
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configurar Dashboard - Modelo {configName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Configurações Gerais */}
          <Card>
            <CardHeader>
              <CardTitle>Configurações Gerais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={localConfig.is_default}
                  onCheckedChange={(checked) => 
                    setLocalConfig(prev => ({ ...prev, is_default: checked }))
                  }
                />
                <Label>Definir como configuração padrão</Label>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="metrics" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="metrics">Cards de Métricas</TabsTrigger>
              <TabsTrigger value="charts">Gráficos</TabsTrigger>
              <TabsTrigger value="lists">Listas</TabsTrigger>
            </TabsList>

            {/* Tab de Métricas */}
            <TabsContent value="metrics" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Cards de Métricas</h3>
                <Button onClick={addMetric} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Métrica
                </Button>
              </div>

              <div className="grid gap-4">
                {localConfig.widget_configs.metrics.map((metric, index) => (
                  <Card key={metric.id}>
                    <CardContent className="pt-6">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <Label>Título</Label>
                          <Input
                            value={metric.title}
                            onChange={(e) => updateMetric(index, { title: e.target.value })}
                          />
                        </div>
                        
                        <div>
                          <Label>Tipo de Dado</Label>
                          <Select
                            value={metric.type}
                            onValueChange={(value: any) => updateMetric(index, { type: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="sales">Vendas</SelectItem>
                              <SelectItem value="commissions">Comissões</SelectItem>
                              <SelectItem value="clients">Clientes</SelectItem>
                              <SelectItem value="sellers">Vendedores</SelectItem>
                              <SelectItem value="goals">Metas</SelectItem>
                              <SelectItem value="products">Produtos</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label>Agregação</Label>
                          <Select
                            value={metric.aggregation}
                            onValueChange={(value: any) => updateMetric(index, { aggregation: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="sum">Soma</SelectItem>
                              <SelectItem value="count">Contagem</SelectItem>
                              <SelectItem value="avg">Média</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="flex items-end">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => removeMetric(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Tab de Gráficos */}
            <TabsContent value="charts" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Gráficos</h3>
                <Button onClick={addChart} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Gráfico
                </Button>
              </div>

              <div className="grid gap-4">
                {localConfig.widget_configs.charts.map((chart, index) => (
                  <Card key={chart.id}>
                    <CardContent className="pt-6">
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        <div>
                          <Label>Título</Label>
                          <Input
                            value={chart.title}
                            onChange={(e) => updateChart(index, { title: e.target.value })}
                          />
                        </div>
                        
                        <div>
                          <Label>Tipo de Gráfico</Label>
                          <Select
                            value={chart.type}
                            onValueChange={(value: any) => updateChart(index, { type: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="bar">Barras</SelectItem>
                              <SelectItem value="line">Linha</SelectItem>
                              <SelectItem value="area">Área</SelectItem>
                              <SelectItem value="pie">Pizza</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label>Eixo Y (Dados)</Label>
                          <Select
                            value={chart.yAxis.type}
                            onValueChange={(value: any) => 
                              updateChart(index, { 
                                yAxis: { ...chart.yAxis, type: value } 
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="sales">Vendas</SelectItem>
                              <SelectItem value="commissions">Comissões</SelectItem>
                              <SelectItem value="clients">Clientes</SelectItem>
                              <SelectItem value="sellers">Vendedores</SelectItem>
                              <SelectItem value="goals">Metas</SelectItem>
                              <SelectItem value="products">Produtos</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label>Eixo X</Label>
                          <Select
                            value={chart.xAxis}
                            onValueChange={(value: any) => updateChart(index, { xAxis: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="time">Tempo</SelectItem>
                              <SelectItem value="products">Produtos</SelectItem>
                              <SelectItem value="sellers">Vendedores</SelectItem>
                              <SelectItem value="offices">Escritórios</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="flex items-end">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => removeChart(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Tab de Listas */}
            <TabsContent value="lists" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Listas</h3>
                <Button onClick={addList} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Lista
                </Button>
              </div>

              <div className="grid gap-4">
                {(localConfig.widget_configs.lists || []).map((list: any, index: number) => (
                  <Card key={list.id}>
                    <CardContent className="pt-6">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <Label>Título</Label>
                          <Input
                            value={list.title}
                            onChange={(e) => updateList(index, { title: e.target.value })}
                          />
                        </div>
                        
                        <div>
                          <Label>Tipo de Lista</Label>
                          <Select
                            value={list.type}
                            onValueChange={(value: any) => updateList(index, { type: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="recent_sales">Vendas Recentes</SelectItem>
                              <SelectItem value="top_sellers">Top Vendedores</SelectItem>
                              <SelectItem value="upcoming_tasks">Tarefas Pendentes</SelectItem>
                              <SelectItem value="commission_breakdown">Detalhamento Comissões</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label>Limite de Itens</Label>
                          <Input
                            type="number"
                            value={list.limit}
                            onChange={(e) => updateList(index, { limit: parseInt(e.target.value) || 5 })}
                            min={1}
                            max={50}
                          />
                        </div>

                        <div className="flex items-end">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => removeList(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>

          {/* Botões de Ação */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saveMutation.isPending}>
              <Save className="h-4 w-4 mr-2" />
              {saveMutation.isPending ? 'Salvando...' : 'Salvar Configuração'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}