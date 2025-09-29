import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Users, Target, DollarSign, Package, Settings } from 'lucide-react';
import { MetricConfig } from '@/hooks/useDashboardPersonalization';
import { useDynamicMetricData } from '@/hooks/useDynamicMetricData';
import { WidgetConfigModal } from './WidgetConfigModal';
import { useAuth } from '@/contexts/AuthContext';

interface DynamicMetricCardProps {
  config: MetricConfig;
  onConfigChange?: (config: MetricConfig) => void;
}

export function DynamicMetricCard({ config, onConfigChange }: DynamicMetricCardProps) {
  const { data, isLoading } = useDynamicMetricData(config);
  const { user } = useAuth();
  const [configModalOpen, setConfigModalOpen] = useState(false);

  // Verificar se usuário pode configurar (admin/owner)
  const canConfigure = user && onConfigChange && 
    (user as any)?.user_metadata?.role === 'admin' || 
    (user as any)?.user_metadata?.role === 'owner';

  const getIcon = () => {
    switch (config.type) {
      case 'sales': return DollarSign;
      case 'commissions': return Target;
      case 'clients': return Users;
      case 'sellers': return Users;
      case 'goals': return Target;
      case 'products': return Package;
      default: return DollarSign;
    }
  };

  const formatValue = (value: number) => {
    if (config.type === 'sales' || config.type === 'commissions') {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        maximumFractionDigits: 0,
      }).format(value);
    }
    return value.toLocaleString('pt-BR');
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-600 dark:text-green-400';
    if (change < 0) return 'text-red-600 dark:text-red-400';
    return 'text-muted-foreground';
  };

  const getChangeIcon = (change: number) => {
    return change >= 0 ? TrendingUp : TrendingDown;
  };

  const handleConfigSave = (newConfig: MetricConfig) => {
    if (onConfigChange) {
      onConfigChange(newConfig);
    }
  };

  const Icon = getIcon();
  const ChangeIcon = data?.change !== undefined ? getChangeIcon(data.change) : TrendingUp;

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="h-4 bg-muted rounded w-24"></div>
          <div className="h-4 w-4 bg-muted rounded"></div>
        </CardHeader>
        <CardContent>
          <div className="h-8 bg-muted rounded w-20 mb-2"></div>
          <div className="h-3 bg-muted rounded w-32"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="hover:shadow-lg transition-shadow duration-300 group">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {config.title}
          </CardTitle>
          <div className="flex items-center gap-1">
            <Icon className="h-4 w-4 text-primary" />
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
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {data?.value ? formatValue(data.value) : '0'}
          </div>
          {data?.change !== undefined && (
            <div className={`flex items-center text-xs mt-1 ${getChangeColor(data.change)}`}>
              <ChangeIcon className="h-3 w-3 mr-1" />
              {Math.abs(data.change).toFixed(1)}% em relação ao período anterior
            </div>
          )}
        </CardContent>
      </Card>

      <WidgetConfigModal
        open={configModalOpen}
        onOpenChange={setConfigModalOpen}
        widgetType="metric"
        config={config}
        onSave={handleConfigSave}
      />
    </>
  );
}