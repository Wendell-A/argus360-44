/**
 * Componente de Gráfico de Produtos Mais Vendidos
 * Data: 03 de Agosto de 2025, 14:05 UTC
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, TrendingUp } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

interface TopProductsChartProps {
  products: Array<{
    product_id: string;
    product_name: string;
    category: string;
    sales_count: number;
    total_revenue: number;
    commission_rate: number;
  }>;
  isLoading?: boolean;
}

const COLORS = [
  '#10b981', // green-500
  '#3b82f6', // blue-500
  '#f59e0b', // amber-500
  '#ef4444', // red-500
  '#8b5cf6', // violet-500
  '#06b6d4', // cyan-500
  '#84cc16', // lime-500
  '#f97316', // orange-500
  '#ec4899', // pink-500
  '#64748b'  // slate-500
];

const formatCurrency = (value: number): string => {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
};

export const TopProductsChart: React.FC<TopProductsChartProps> = ({
  products,
  isLoading = false
}) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Produtos Mais Vendidos
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

  if (!products || products.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Produtos Mais Vendidos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <div className="text-center">
              <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum produto vendido no período</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Preparar dados para o gráfico
  const chartData = products.slice(0, 5).map((product, index) => ({
    name: product.product_name.length > 20 
      ? product.product_name.substring(0, 20) + '...' 
      : product.product_name,
    fullName: product.product_name,
    value: product.sales_count,
    revenue: product.total_revenue,
    category: product.category,
    commission_rate: product.commission_rate,
    color: COLORS[index % COLORS.length]
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{data.fullName}</p>
          <p className="text-sm text-muted-foreground">Categoria: {data.category}</p>
          <p className="text-sm">Vendas: <span className="font-semibold">{data.value}</span></p>
          <p className="text-sm">Receita: <span className="font-semibold">{formatCurrency(data.revenue)}</span></p>
          <p className="text-sm">Comissão: <span className="font-semibold">{data.commission_rate}%</span></p>
        </div>
      );
    }
    return null;
  };

  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    if (percent < 0.05) return null; // Não mostrar labels para fatias muito pequenas
    
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5" />
          Produtos Mais Vendidos
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gráfico */}
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomLabel}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Lista detalhada */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sm text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Ranking Detalhado
            </h4>
            <div className="space-y-3">
              {products.slice(0, 5).map((product, index) => (
                <div key={product.product_id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <div>
                      <p className="font-medium text-sm">
                        {product.product_name.length > 25 
                          ? product.product_name.substring(0, 25) + '...' 
                          : product.product_name}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {product.category}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {product.commission_rate}% comissão
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm">{product.sales_count} vendas</p>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(product.total_revenue)}
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