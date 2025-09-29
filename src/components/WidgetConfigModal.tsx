import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Eye, Save, X, Settings } from 'lucide-react';
import { AggregationSelector } from './AggregationSelector';
import { 
  MetricConfig, 
  ChartConfig, 
  ListConfig, 
  AggregationFilter,
  CommissionTypeConfig 
} from '@/hooks/useDashboardPersonalization';

type WidgetType = 'metric' | 'chart' | 'list';
type WidgetConfig = MetricConfig | ChartConfig | ListConfig;

interface WidgetConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  widgetType: WidgetType;
  config: WidgetConfig;
  onSave: (config: WidgetConfig) => void;
}

const AGGREGATION_OPTIONS = [
  { value: 'sum', label: 'Soma' },
  { value: 'count', label: 'Contagem' },
  { value: 'count_distinct', label: 'Contagem Distinta' },
  { value: 'avg', label: 'Média' },
  { value: 'min', label: 'Mínimo' },
  { value: 'max', label: 'Máximo' },
];

const CHART_TYPES = [
  { value: 'bar', label: 'Barras' },
  { value: 'line', label: 'Linha' },
  { value: 'pie', label: 'Pizza' },
  { value: 'area', label: 'Área' },
];

const X_AXIS_OPTIONS = [
  { value: 'time', label: 'Tempo' },
  { value: 'products', label: 'Produtos' },
  { value: 'sellers', label: 'Vendedores' },
  { value: 'offices', label: 'Escritórios' },
];

const METRIC_TYPES = [
  { value: 'sales', label: 'Vendas' },
  { value: 'commissions', label: 'Comissões' },
  { value: 'clients', label: 'Clientes' },
  { value: 'sellers', label: 'Vendedores' },
  { value: 'goals', label: 'Metas' },
  { value: 'products', label: 'Produtos' },
];

const LIST_TYPES = [
  { value: 'recent_sales', label: 'Vendas Recentes' },
  { value: 'top_sellers', label: 'Top Vendedores' },
  { value: 'upcoming_tasks', label: 'Tarefas Pendentes' },
  { value: 'commission_breakdown', label: 'Detalhamento de Comissões' },
];

export function WidgetConfigModal({ 
  open, 
  onOpenChange, 
  widgetType, 
  config, 
  onSave 
}: WidgetConfigModalProps) {
  const [localConfig, setLocalConfig] = useState<WidgetConfig>(config);
  const [previewMode, setPreviewMode] = useState(false);

  // Atualizar config local quando o config externo muda
  useEffect(() => {
    setLocalConfig(config);
  }, [config]);

  const updateConfig = (updates: Partial<WidgetConfig>) => {
    setLocalConfig(prev => ({ ...prev, ...updates } as WidgetConfig));
  };

  const updateAggregationFilter = (
    category: 'products' | 'offices' | 'sellers',
    filter: AggregationFilter | undefined
  ) => {
    if (widgetType === 'metric') {
      const metricConfig = localConfig as MetricConfig;
      updateConfig({
        aggregationFilters: {
          ...metricConfig.aggregationFilters,
          [category]: filter,
        },
      });
    } else if (widgetType === 'chart') {
      const chartConfig = localConfig as ChartConfig;
      updateConfig({
        aggregationFilters: {
          ...chartConfig.aggregationFilters,
          [category]: filter,
        },
      });
    }
  };

  const updateCommissionConfig = (updates: Partial<CommissionTypeConfig>) => {
    const currentCommissionConfig = 
      (localConfig as MetricConfig).commissionConfig || 
      (localConfig as ChartConfig).commissionConfig ||
      { includeOffice: true, includeSeller: true, separateTypes: false };
    
    updateConfig({
      commissionConfig: {
        ...currentCommissionConfig,
        ...updates,
      },
    });
  };

  const generateDynamicTitle = () => {
    if (widgetType === 'metric') {
      const metricConfig = localConfig as MetricConfig;
      const typeLabel = METRIC_TYPES.find(t => t.value === metricConfig.type)?.label || metricConfig.type;
      const aggregationLabel = AGGREGATION_OPTIONS.find(a => a.value === metricConfig.aggregation)?.label || '';
      return `${aggregationLabel} de ${typeLabel}`;
    } else if (widgetType === 'chart') {
      const chartConfig = localConfig as ChartConfig;
      const typeLabel = METRIC_TYPES.find(t => t.value === chartConfig.yAxis.type)?.label || chartConfig.yAxis.type;
      const xAxisLabel = X_AXIS_OPTIONS.find(x => x.value === chartConfig.xAxis)?.label || 'Tempo';
      return `${typeLabel} por ${xAxisLabel}`;
    }
    return localConfig.title;
  };

  const handleSave = () => {
    // Aplicar título dinâmico se habilitado
    let finalConfig = localConfig;
    if ((localConfig as any).dynamicTitle) {
      finalConfig = {
        ...localConfig,
        title: generateDynamicTitle(),
      };
    }
    
    onSave(finalConfig);
    onOpenChange(false);
  };

  const renderMetricConfig = () => {
    const metricConfig = localConfig as MetricConfig;
    
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Tipo de Métrica</Label>
            <Select 
              value={metricConfig.type} 
              onValueChange={(value: any) => updateConfig({ type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {METRIC_TYPES.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Agregação</Label>
            <Select 
              value={metricConfig.aggregation} 
              onValueChange={(value: any) => updateConfig({ aggregation: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AGGREGATION_OPTIONS.map(agg => (
                  <SelectItem key={agg.value} value={agg.value}>
                    {agg.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Configuração de Comissões */}
        {metricConfig.type === 'commissions' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Configuração de Comissões</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Incluir Comissões de Escritório</Label>
                <Switch
                  checked={metricConfig.commissionConfig?.includeOffice ?? true}
                  onCheckedChange={(checked) => updateCommissionConfig({ includeOffice: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-sm">Incluir Comissões de Vendedores</Label>
                <Switch
                  checked={metricConfig.commissionConfig?.includeSeller ?? true}
                  onCheckedChange={(checked) => updateCommissionConfig({ includeSeller: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-sm">Separar por Tipo</Label>
                <Switch
                  checked={metricConfig.commissionConfig?.separateTypes ?? false}
                  onCheckedChange={(checked) => updateCommissionConfig({ separateTypes: checked })}
                />
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  const renderChartConfig = () => {
    const chartConfig = localConfig as ChartConfig;
    
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Tipo de Gráfico</Label>
            <Select 
              value={chartConfig.type} 
              onValueChange={(value: any) => updateConfig({ type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CHART_TYPES.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Eixo X</Label>
            <Select 
              value={chartConfig.xAxis} 
              onValueChange={(value: any) => updateConfig({ xAxis: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {X_AXIS_OPTIONS.map(axis => (
                  <SelectItem key={axis.value} value={axis.value}>
                    {axis.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Tipo de Dados (Eixo Y)</Label>
            <Select 
              value={chartConfig.yAxis.type} 
              onValueChange={(value: any) => updateConfig({ 
                yAxis: { ...chartConfig.yAxis, type: value } 
              })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {METRIC_TYPES.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Agregação (Eixo Y)</Label>
            <Select 
              value={chartConfig.yAxis.aggregation} 
              onValueChange={(value: any) => updateConfig({ 
                yAxis: { ...chartConfig.yAxis, aggregation: value } 
              })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AGGREGATION_OPTIONS.map(agg => (
                  <SelectItem key={agg.value} value={agg.value}>
                    {agg.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    );
  };

  const renderListConfig = () => {
    const listConfig = localConfig as ListConfig;
    
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Tipo de Lista</Label>
            <Select 
              value={listConfig.type} 
              onValueChange={(value: any) => updateConfig({ type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LIST_TYPES.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Limite de Itens</Label>
            <Input
              type="number"
              value={listConfig.limit}
              onChange={(e) => updateConfig({ limit: parseInt(e.target.value) || 5 })}
              min={1}
              max={50}
            />
          </div>
        </div>
      </div>
    );
  };

  const renderAggregationFilters = () => {
    if (widgetType === 'list') return null;

    const aggregationFilters = (localConfig as MetricConfig | ChartConfig).aggregationFilters;

    return (
      <div className="space-y-4">
        <AggregationSelector
          type="products"
          value={aggregationFilters?.products}
          onChange={(filter) => updateAggregationFilter('products', filter)}
          label="Produtos"
        />
        
        <AggregationSelector
          type="offices"
          value={aggregationFilters?.offices}
          onChange={(filter) => updateAggregationFilter('offices', filter)}
          label="Escritórios"
        />
        
        <AggregationSelector
          type="sellers"
          value={aggregationFilters?.sellers}
          onChange={(filter) => updateAggregationFilter('sellers', filter)}
          label="Vendedores"
        />
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configurar {widgetType === 'metric' ? 'Métrica' : widgetType === 'chart' ? 'Gráfico' : 'Lista'}
          </DialogTitle>
          <DialogDescription>
            Personalize a configuração do widget e visualize as mudanças em tempo real.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Configuração Básica */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Título</Label>
              <Input
                value={localConfig.title}
                onChange={(e) => updateConfig({ title: e.target.value })}
                placeholder="Digite o título do widget"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-sm font-medium">Título Dinâmico</Label>
                <p className="text-xs text-muted-foreground">
                  Gerar título automaticamente baseado na configuração
                </p>
              </div>
              <Switch
                checked={(localConfig as any).dynamicTitle ?? false}
                onCheckedChange={(checked) => updateConfig({ dynamicTitle: checked })}
              />
            </div>

            {(localConfig as any).dynamicTitle && (
              <div className="p-3 bg-muted rounded-md">
                <Label className="text-xs font-medium text-muted-foreground">
                  Preview do Título:
                </Label>
                <div className="text-sm mt-1">
                  {generateDynamicTitle()}
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Configuração Específica */}
          <Tabs defaultValue="basic" className="w-full">
            <TabsList>
              <TabsTrigger value="basic">Configuração Básica</TabsTrigger>
              <TabsTrigger value="filters">Filtros de Agregação</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>
            
            <TabsContent value="basic" className="space-y-4">
              {widgetType === 'metric' && renderMetricConfig()}
              {widgetType === 'chart' && renderChartConfig()}
              {widgetType === 'list' && renderListConfig()}
            </TabsContent>
            
            <TabsContent value="filters" className="space-y-4">
              {renderAggregationFilters()}
            </TabsContent>
            
            <TabsContent value="preview" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Preview da Configuração</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{widgetType}</Badge>
                      <span className="text-sm font-medium">{localConfig.title}</span>
                    </div>
                    
                    <div className="text-xs text-muted-foreground space-y-1">
                      {widgetType === 'metric' && (
                        <>
                          <div>Tipo: {(localConfig as MetricConfig).type}</div>
                          <div>Agregação: {(localConfig as MetricConfig).aggregation}</div>
                        </>
                      )}
                      {widgetType === 'chart' && (
                        <>
                          <div>Tipo: {(localConfig as ChartConfig).type}</div>
                          <div>Eixo X: {(localConfig as ChartConfig).xAxis}</div>
                          <div>Dados: {(localConfig as ChartConfig).yAxis.type}</div>
                        </>
                      )}
                      {widgetType === 'list' && (
                        <>
                          <div>Tipo: {(localConfig as ListConfig).type}</div>
                          <div>Limite: {(localConfig as ListConfig).limit}</div>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Salvar Configuração
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}