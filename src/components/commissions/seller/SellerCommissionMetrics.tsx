import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, CheckCircle, Users, TrendingUp } from 'lucide-react';

interface SellerCommissionMetricsProps {
  totalToPay: number;
  totalPaid: number;
  avgPerSeller: number;
  activeSellers: number;
}

export const SellerCommissionMetrics: React.FC<SellerCommissionMetricsProps> = ({
  totalToPay,
  totalPaid,
  avgPerSeller,
  activeSellers
}) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const metrics = [
    {
      title: 'Total a Pagar',
      value: formatCurrency(totalToPay),
      icon: Clock,
      color: 'text-orange-600'
    },
    {
      title: 'Total Pago',
      value: formatCurrency(totalPaid),
      icon: CheckCircle,
      color: 'text-green-600'
    },
    {
      title: 'Média por Vendedor',
      value: formatCurrency(avgPerSeller),
      icon: TrendingUp,
      color: 'text-blue-600'
    },
    {
      title: 'Vendedores Ativos',
      value: activeSellers.toString(),
      icon: Users,
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
