import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, CheckCircle, TrendingUp, Building } from 'lucide-react';

interface OfficeCommissionMetricsProps {
  totalToReceive: number;
  totalReceived: number;
  avgTicket: number;
  activeOffices: number;
}

export const OfficeCommissionMetrics: React.FC<OfficeCommissionMetricsProps> = ({
  totalToReceive,
  totalReceived,
  avgTicket,
  activeOffices
}) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const metrics = [
    {
      title: 'Total a Receber',
      value: formatCurrency(totalToReceive),
      icon: Clock,
      color: 'text-yellow-600'
    },
    {
      title: 'Total Recebido',
      value: formatCurrency(totalReceived),
      icon: CheckCircle,
      color: 'text-green-600'
    },
    {
      title: 'Ticket Médio',
      value: formatCurrency(avgTicket),
      icon: TrendingUp,
      color: 'text-blue-600'
    },
    {
      title: 'Escritórios Ativos',
      value: activeOffices.toString(),
      icon: Building,
      color: 'text-purple-600'
    }
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric, index) => {
        const Icon = metric.icon;
        return (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {metric.title}
              </CardTitle>
              <Icon className={`h-4 w-4 ${metric.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
