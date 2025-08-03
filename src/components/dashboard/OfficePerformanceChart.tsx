/**
 * Componente de Performance por Escritório
 * Data: 03 de Agosto de 2025, 14:10 UTC
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building, Users, DollarSign, Target } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

interface OfficePerformanceChartProps {
  officeData: Array<{
    office_id: string;
    office_name: string;
    sales_count: number;
    revenue: number;
    vendors_count: number;
    clients_count: number;
    commission_total: number;
  }>;
  isLoading?: boolean;
}

const formatCurrency = (value: number): string => {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
};

export const OfficePerformanceChart: React.FC<OfficePerformanceChartProps> = ({
  officeData,
  isLoading = false
}) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Performance por Escritório
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!officeData || officeData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Performance por Escritório
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <div className="text-center">
              <Building className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum escritório encontrado</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Preparar dados para o gráfico
  const chartData = officeData.map(office => ({
    name: office.office_name.length > 15 
      ? office.office_name.substring(0, 15) + '...' 
      : office.office_name,
    fullName: office.office_name,
    vendas: office.sales_count,
    receita: office.revenue / 1000, // Em milhares para melhor visualização
    vendedores: office.vendors_count,
    clientes: office.clients_count
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = officeData.find(office => 
        office.office_name === label || 
        office.office_name.startsWith(label.replace('...', ''))
      );
      
      if (!data) return null;

      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{data.office_name}</p>
          <div className="space-y-1 mt-2">
            <p className="text-sm">Vendas: <span className="font-semibold">{data.sales_count}</span></p>
            <p className="text-sm">Receita: <span className="font-semibold">{formatCurrency(data.revenue)}</span></p>
            <p className="text-sm">Vendedores: <span className="font-semibold">{data.vendors_count}</span></p>
            <p className="text-sm">Clientes: <span className="font-semibold">{data.clients_count}</span></p>
          </div>
        </div>
      );
    }
    return null;
  };

  // Calcular totais
  const totals = officeData.reduce(
    (acc, office) => ({
      sales: acc.sales + office.sales_count,
      revenue: acc.revenue + office.revenue,
      vendors: acc.vendors + office.vendors_count,
      clients: acc.clients + office.clients_count
    }),
    { sales: 0, revenue: 0, vendors: 0, clients: 0 }
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building className="h-5 w-5" />
          Performance por Escritório
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Resumo Geral */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-muted rounded-lg">
              <Target className="h-5 w-5 mx-auto mb-2 text-blue-600" />
              <p className="text-2xl font-bold">{totals.sales}</p>
              <p className="text-xs text-muted-foreground">Total Vendas</p>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <DollarSign className="h-5 w-5 mx-auto mb-2 text-green-600" />
              <p className="text-lg font-bold">{formatCurrency(totals.revenue)}</p>
              <p className="text-xs text-muted-foreground">Receita Total</p>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <Users className="h-5 w-5 mx-auto mb-2 text-purple-600" />
              <p className="text-2xl font-bold">{totals.vendors}</p>
              <p className="text-xs text-muted-foreground">Vendedores</p>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <Users className="h-5 w-5 mx-auto mb-2 text-orange-600" />
              <p className="text-2xl font-bold">{totals.clients}</p>
              <p className="text-xs text-muted-foreground">Clientes</p>
            </div>
          </div>

          {/* Gráfico */}
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="vendas" fill="#3b82f6" name="Vendas" />
                <Bar dataKey="receita" fill="#10b981" name="Receita (k)" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Lista Detalhada */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm text-muted-foreground">
              Detalhes por Escritório
            </h4>
            <div className="space-y-2">
              {officeData.map((office, index) => (
                <div key={office.office_id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-primary text-primary-foreground rounded-full text-sm font-semibold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{office.office_name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {office.vendors_count} vendedores
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {office.clients_count} clientes
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{office.sales_count} vendas</p>
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(office.revenue)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};