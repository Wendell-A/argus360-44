import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  BarChart3, 
  AlertTriangle,
  Target,
  Zap,
  RefreshCw,
  Settings
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { CommissionAnalytics } from './CommissionAnalytics';
import { CommissionImpactSimulator } from './CommissionImpactSimulator';

interface DashboardMetrics {
  totalCommissions: number;
  totalValue: number;
  averageRate: number;
  monthlyGrowth: number;
  activeConfigurations: number;
  conflictsCount: number;
  potentialImpact: number;
  topPerformers: Array<{
    id: string;
    name: string;
    totalCommissions: number;
    averageRate: number;
  }>;
  recentActivity: Array<{
    id: string;
    type: 'created' | 'updated' | 'activated' | 'deactivated';
    description: string;
    timestamp: string;
  }>;
}

interface CommissionDashboardEnhancedProps {
  metrics: DashboardMetrics;
  onRefresh?: () => void;
  onCreateNew?: () => void;
  isLoading?: boolean;
}

export const CommissionDashboardEnhanced: React.FC<CommissionDashboardEnhancedProps> = ({
  metrics,
  onRefresh,
  onCreateNew,
  isLoading = false
}) => {
  const [activeTab, setActiveTab] = useState('overview');

  const formatGrowthPercentage = (value: number) => {
    const isPositive = value >= 0;
    return {
      value: Math.abs(value),
      isPositive,
      icon: isPositive ? TrendingUp : TrendingDown,
      className: isPositive ? 'text-green-600' : 'text-red-600'
    };
  };

  const growth = formatGrowthPercentage(metrics.monthlyGrowth);

  return (
    <div className="space-y-6">
      {/* Header com ações */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold">Dashboard de Comissões</h2>
          <p className="text-muted-foreground">
            Visão inteligente das configurações e performance
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onRefresh} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button onClick={onCreateNew}>
            <Zap className="h-4 w-4 mr-2" />
            Nova Configuração
          </Button>
        </div>
      </div>

      {/* Métricas Principais - Grid Responsivo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total de Configurações */}
        <Card className="relative overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Configurações Ativas
                </p>
                <p className="text-2xl font-bold">{metrics.activeConfigurations}</p>
                <p className="text-xs text-muted-foreground">
                  de {metrics.totalCommissions} totais
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Taxa Média */}
        <Card className="relative overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Taxa Média
                </p>
                <p className="text-2xl font-bold">{metrics.averageRate.toFixed(2)}%</p>
                <div className="flex items-center gap-1 mt-1">
                  <growth.icon className={`h-3 w-3 ${growth.className}`} />
                  <span className={`text-xs ${growth.className}`}>
                    {growth.value.toFixed(1)}% este mês
                  </span>
                </div>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Impacto Potencial */}
        <Card className="relative overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Impacto Estimado
                </p>
                <p className="text-2xl font-bold">{formatCurrency(metrics.potentialImpact)}</p>
                <p className="text-xs text-muted-foreground">
                  próximos 30 dias
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-purple-500/10 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Conflitos */}
        <Card className="relative overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Conflitos
                </p>
                <p className="text-2xl font-bold">{metrics.conflictsCount}</p>
                <Badge 
                  variant={metrics.conflictsCount === 0 ? "default" : "destructive"}
                  className="text-xs mt-1"
                >
                  {metrics.conflictsCount === 0 ? 'Tudo OK' : 'Requer atenção'}
                </Badge>
              </div>
              <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
                metrics.conflictsCount === 0 
                  ? 'bg-green-500/10' 
                  : 'bg-red-500/10'
              }`}>
                <AlertTriangle className={`h-6 w-6 ${
                  metrics.conflictsCount === 0 
                    ? 'text-green-600' 
                    : 'text-red-600'
                }`} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs para diferentes visualizações */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="simulator">Simulador</TabsTrigger>
          <TabsTrigger value="activity">Atividades</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Performers */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Top Vendedores
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {metrics.topPerformers.map((performer, index) => (
                    <div key={performer.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                      <div className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          index === 0 ? 'bg-yellow-500 text-white' :
                          index === 1 ? 'bg-gray-400 text-white' :
                          index === 2 ? 'bg-orange-600 text-white' :
                          'bg-muted text-muted-foreground'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{performer.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Taxa média: {performer.averageRate.toFixed(2)}%
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold">{formatCurrency(performer.totalCommissions)}</p>
                        <p className="text-xs text-muted-foreground">total</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Estatísticas Rápidas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Configurações por vendedor</span>
                    <span className="font-bold">
                      {metrics.activeConfigurations > 0 && metrics.topPerformers.length > 0
                        ? (metrics.activeConfigurations / metrics.topPerformers.length).toFixed(1)
                        : 0
                      }
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Taxa de conflitos</span>
                    <span className={`font-bold ${
                      (metrics.conflictsCount / metrics.totalCommissions * 100) > 10 
                        ? 'text-red-600' 
                        : 'text-green-600'
                    }`}>
                      {metrics.totalCommissions > 0 
                        ? ((metrics.conflictsCount / metrics.totalCommissions) * 100).toFixed(1)
                        : 0
                      }%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Crescimento mensal</span>
                    <span className={`font-bold flex items-center gap-1 ${growth.className}`}>
                      <growth.icon className="h-3 w-3" />
                      {growth.value.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics">
          <CommissionAnalytics />
        </TabsContent>

        <TabsContent value="simulator">
          <CommissionImpactSimulator />
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Atividades Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {metrics.recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 p-2">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      activity.type === 'created' ? 'bg-green-500' :
                      activity.type === 'updated' ? 'bg-blue-500' :
                      activity.type === 'activated' ? 'bg-green-500' :
                      'bg-red-500'
                    }`} />
                    <div className="flex-1">
                      <p className="text-sm">{activity.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(activity.timestamp).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};