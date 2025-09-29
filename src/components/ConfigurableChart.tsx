import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Settings, AlertCircle } from 'lucide-react';
import { ChartConfig } from '@/hooks/useDashboardPersonalization';
import { useDynamicChartData } from '@/hooks/useDynamicChartData';
import { validateChartConfig, getValidationMessage } from '@/lib/chartValidation';
import { WidgetConfigModal } from './WidgetConfigModal';
import { useAuth } from '@/contexts/AuthContext';

// Cores vibrantes para todos os gráficos
const VIBRANT_COLORS = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#14b8a6', // teal
  '#f97316', // orange
];

interface ConfigurableChartProps {
  config: ChartConfig;
  onConfigChange?: (config: ChartConfig) => void;
  isRefreshing?: boolean;
}

export function ConfigurableChart({ config, onConfigChange, isRefreshing = false }: ConfigurableChartProps) {
  const { user, activeTenant } = useAuth();
  const [configModalOpen, setConfigModalOpen] = useState(false);
  
  // Validar configuração antes de buscar dados
  const validation = validateChartConfig(config);
  const validationMessage = getValidationMessage(config);
  
  // Só buscar dados se configuração for válida
  const { data, isLoading } = useDynamicChartData(config);

  // Verificar se usuário pode configurar (admin/owner)
  const canConfigure = user && activeTenant && onConfigChange && 
    ['owner', 'admin'].includes(activeTenant.user_role || '');

  const formatValue = (value: number) => {
    if (config.yAxis.type === 'sales' || config.yAxis.type === 'commissions') {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        maximumFractionDigits: 0,
      }).format(value);
    }
    return value.toLocaleString('pt-BR');
  };

  

  const handleConfigSave = (newConfig: ChartConfig) => {
    if (onConfigChange) {
      onConfigChange(newConfig);
    }
  };

  // Se configuração inválida, mostrar mensagem
  if (!validation.isValid) {
    return (
      <Card className="h-full">
        <CardHeader className="relative group">
          <CardTitle className="text-sm font-medium pr-8">{config.title}</CardTitle>
          {canConfigure && onConfigChange && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setConfigModalOpen(true)}
              className="absolute right-4 top-4 h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Settings className="h-4 w-4" />
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Configuração Inválida</strong>
              <p className="mt-2 text-sm">{validationMessage}</p>
            </AlertDescription>
          </Alert>
        </CardContent>
        
        {canConfigure && onConfigChange && (
          <WidgetConfigModal
            open={configModalOpen}
            onOpenChange={setConfigModalOpen}
            widgetType="chart"
            config={config}
            onSave={handleConfigSave}
          />
        )}
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-6 bg-muted rounded w-32"></div>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-muted rounded"></div>
        </CardContent>
      </Card>
    );
  }

  const renderChart = () => {
    if (!data || data.length === 0) {
      return (
        <div className="h-64 flex items-center justify-center text-muted-foreground">
          Nenhum dado disponível
        </div>
      );
    }

    switch (config.type) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="name" 
                className="text-muted-foreground text-xs"
              />
              <YAxis 
                className="text-muted-foreground text-xs"
                tickFormatter={formatValue}
              />
              <Tooltip 
                formatter={(value: number) => [formatValue(value), config.yAxis.title]}
                labelClassName="text-foreground"
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Bar 
                dataKey="value" 
                fill={VIBRANT_COLORS[0]}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'line':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="name" 
                className="text-muted-foreground text-xs"
              />
              <YAxis 
                className="text-muted-foreground text-xs"
                tickFormatter={formatValue}
              />
              <Tooltip 
                formatter={(value: number) => [formatValue(value), config.yAxis.title]}
                labelClassName="text-foreground"
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke={VIBRANT_COLORS[0]}
                strokeWidth={2}
                dot={{ fill: VIBRANT_COLORS[0], strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'area':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="name" 
                className="text-muted-foreground text-xs"
              />
              <YAxis 
                className="text-muted-foreground text-xs"
                tickFormatter={formatValue}
              />
              <Tooltip 
                formatter={(value: number) => [formatValue(value), config.yAxis.title]}
                labelClassName="text-foreground"
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke={VIBRANT_COLORS[0]}
                fill={VIBRANT_COLORS[0]}
                fillOpacity={0.6}
              />
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={VIBRANT_COLORS[index % VIBRANT_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number) => [formatValue(value), config.yAxis.title]}
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        );

      default:
        return <div>Tipo de gráfico não suportado</div>;
    }
  };

  return (
    <>
      <Card className="group relative">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {config.title}
          </CardTitle>
          {canConfigure && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setConfigModalOpen(true)}
              className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Settings className="h-4 w-4" />
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {renderChart()}
        </CardContent>
        
        {/* Overlay de Loading */}
        {isRefreshing && (
          <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center rounded-lg animate-fade-in z-10">
            <div className="flex flex-col items-center gap-2">
              <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-muted-foreground">Atualizando dados...</p>
            </div>
          </div>
        )}
      </Card>

      <WidgetConfigModal
        open={configModalOpen}
        onOpenChange={setConfigModalOpen}
        widgetType="chart"
        config={config}
        onSave={handleConfigSave}
      />
    </>
  );
}