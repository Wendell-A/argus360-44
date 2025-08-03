/**
 * Componente de Métricas Principais do Dashboard
 * Data: 03 de Agosto de 2025, 14:02 UTC
 * 
 * Métricas principais com tooltips explicativos e indicadores visuais
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  TrendingUp, 
  DollarSign, 
  Users, 
  Target, 
  ShoppingCart, 
  Calendar,
  AlertTriangle,
  CheckCircle,
  Info
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface MetricCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  tooltip: string;
  status?: 'success' | 'warning' | 'danger' | 'info';
}

const MetricCard: React.FC<MetricCardProps> = ({ 
  title, 
  value, 
  description, 
  icon, 
  trend,
  tooltip,
  status = 'info'
}) => {
  const getStatusColor = () => {
    switch (status) {
      case 'success': return 'border-green-200 bg-green-50';
      case 'warning': return 'border-yellow-200 bg-yellow-50';
      case 'danger': return 'border-red-200 bg-red-50';
      default: return 'border-border bg-background';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'danger': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default: return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Card className={`transition-all duration-200 hover:shadow-md ${getStatusColor()}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                {title}
                {getStatusIcon()}
              </CardTitle>
              {icon}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{value}</div>
              <CardDescription className="flex items-center justify-between">
                <span>{description}</span>
                {trend && (
                  <span className={`text-xs flex items-center gap-1 ${
                    trend.isPositive ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {trend.isPositive ? '↗' : '↘'} {Math.abs(trend.value)}%
                  </span>
                )}
              </CardDescription>
            </CardContent>
          </Card>
        </TooltipTrigger>
        <TooltipContent>
          <p className="max-w-xs">{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

interface DashboardMetricsProps {
  stats: {
    total_clients: number;
    total_sales: number;
    total_revenue: number;
    total_commission: number;
    active_goals: number;
    pending_tasks: number;
  };
}

export const DashboardMetrics: React.FC<DashboardMetricsProps> = ({ stats }) => {
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const metrics = [
    {
      title: "Total de Vendas",
      value: stats.total_sales,
      description: "vendas realizadas",
      icon: <TrendingUp className="h-4 w-4" />,
      trend: { value: 12, isPositive: true },
      tooltip: "Número total de vendas aprovadas no período selecionado",
      status: stats.total_sales > 10 ? 'success' : stats.total_sales > 5 ? 'warning' : 'danger'
    },
    {
      title: "Receita Total",
      value: formatCurrency(stats.total_revenue),
      description: "faturamento do período",
      icon: <DollarSign className="h-4 w-4" />,
      trend: { value: 8, isPositive: true },
      tooltip: "Soma do valor de todas as vendas aprovadas no período",
      status: stats.total_revenue > 1000000 ? 'success' : stats.total_revenue > 500000 ? 'warning' : 'danger'
    },
    {
      title: "Clientes Ativos",
      value: stats.total_clients,
      description: "clientes cadastrados",
      icon: <Users className="h-4 w-4" />,
      trend: { value: 15, isPositive: true },
      tooltip: "Número de clientes ativos no sistema",
      status: stats.total_clients > 50 ? 'success' : stats.total_clients > 20 ? 'warning' : 'danger'
    },
    {
      title: "Comissões",
      value: formatCurrency(stats.total_commission),
      description: "comissões pendentes",
      icon: <ShoppingCart className="h-4 w-4" />,
      trend: { value: 5, isPositive: true },
      tooltip: "Total de comissões a serem pagas",
      status: 'info'
    },
    {
      title: "Metas Ativas",
      value: stats.active_goals,
      description: "metas em andamento",
      icon: <Target className="h-4 w-4" />,
      tooltip: "Número de metas ativas no período",
      status: stats.active_goals > 0 ? 'success' : 'warning'
    },
    {
      title: "Tarefas Pendentes",
      value: stats.pending_tasks,
      description: "tarefas a fazer",
      icon: <Calendar className="h-4 w-4" />,
      tooltip: "Tarefas pendentes que precisam de atenção",
      status: stats.pending_tasks === 0 ? 'success' : stats.pending_tasks < 5 ? 'warning' : 'danger'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
      {metrics.map((metric, index) => (
        <MetricCard
          key={index}
          title={metric.title}
          value={metric.value}
          description={metric.description}
          icon={metric.icon}
          trend={metric.trend}
          tooltip={metric.tooltip}
          status={metric.status as any}
        />
      ))}
    </div>
  );
};