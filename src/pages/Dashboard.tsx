
import React, { useState, useMemo } from 'react';
import { MetricCard } from "@/components/MetricCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign,
  Users,
  TrendingUp,
  Award,
  Calendar,
  Target,
  Building2,
  Filter,
  Download,
  RefreshCw
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { useDashboardOptimized } from '@/hooks/useDashboardOptimized';
import { useContextualDashboard } from '@/hooks/useContextualDashboard';
import { useAuth } from '@/contexts/AuthContext';
import { useCommissions } from '@/hooks/useCommissions';
import { useGoals } from '@/hooks/useGoals';

interface DashboardFilters {
  dateRange: 'today' | 'week' | 'month' | 'previous_month';
  office: string;
  seller: string;
  product: string;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [filters, setFilters] = useState<DashboardFilters>({
    dateRange: 'month',
    office: 'all',
    seller: 'all',
    product: 'all'
  });

  // Hooks de dados
  const { data: dashboardData, isLoading: dashboardLoading, refetch } = useDashboardOptimized();
  const { data: contextualData, isLoading: contextualLoading } = useContextualDashboard();
  const { commissions, isLoading: commissionsLoading } = useCommissions();
  const { goals, isLoading: goalsLoading } = useGoals();

  const isLoading = dashboardLoading || contextualLoading || commissionsLoading || goalsLoading;

  // Dados com fallbacks
  const stats = useMemo(() => {
    const current = dashboardData?.stats || {
      total_clients: 0,
      total_sales: 0,
      total_revenue: 0,
      total_commission: 0,
      active_goals: 0,
      pending_tasks: 0
    };

    // Simular dados do mês anterior para comparação
    const previous = {
      total_sales: Math.floor(current.total_sales * 0.85),
      total_revenue: Math.floor(current.total_revenue * 0.82),
      total_commission: Math.floor(current.total_commission * 0.88),
      total_clients: Math.floor(current.total_clients * 0.95)
    };

    return {
      current,
      previous,
      growth: {
        sales: current.total_sales > 0 ? Math.round(((current.total_sales - previous.total_sales) / previous.total_sales) * 100) : 0,
        revenue: current.total_revenue > 0 ? Math.round(((current.total_revenue - previous.total_revenue) / previous.total_revenue) * 100) : 0,
        commission: current.total_commission > 0 ? Math.round(((current.total_commission - previous.total_commission) / previous.total_commission) * 100) : 0,
        clients: current.total_clients > 0 ? Math.round(((current.total_clients - previous.total_clients) / previous.total_clients) * 100) : 0
      }
    };
  }, [dashboardData]);

  // Dados dos gráficos
  const monthlyData = useMemo(() => {
    if (!dashboardData?.recent_sales && !commissions.length) {
      return [
        { month: "Jan", vendas: 45, comissoes: 12000, meta: 50 },
        { month: "Fev", vendas: 52, comissoes: 14500, meta: 50 },
        { month: "Mar", vendas: 38, comissoes: 10200, meta: 50 },
        { month: "Abr", vendas: 67, comissoes: 18900, meta: 60 },
        { month: "Mai", vendas: 71, comissoes: 21500, meta: 60 },
        { month: "Jun", vendas: 59, comissoes: 16800, meta: 60 },
      ];
    }
    
    // Criar mapa de meses dos últimos 6 meses
    const today = new Date();
    const monthsMap = {};
    for (let i = 5; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthKey = date.toLocaleDateString('pt-BR', { month: 'short' });
      const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthsMap[monthYear] = { 
        month: monthKey, 
        vendas: 0, 
        comissoes: 0, 
        meta: 0,
        monthYear 
      };
    }
    
    // Processar vendas por mês (usar valor, não quantidade)
    if (dashboardData?.recent_sales) {
      dashboardData.recent_sales.forEach((sale: any) => {
        const date = new Date(sale.sale_date);
        const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (monthsMap[monthYear]) {
          monthsMap[monthYear].vendas += sale.sale_value || 0;
        }
      });
    }
    
    // Processar comissões reais por mês
    if (commissions.length) {
      commissions.forEach((commission: any) => {
        if (commission.payment_date) {
          const date = new Date(commission.payment_date);
          const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          if (monthsMap[monthYear]) {
            monthsMap[monthYear].comissoes += commission.commission_amount || 0;
          }
        }
      });
    }
    
    // Processar metas por mês
    if (goals.length) {
      goals.forEach((goal: any) => {
        if (goal.goal_type === 'office' && goal.status === 'active') {
          const startDate = new Date(goal.period_start);
          const endDate = new Date(goal.period_end);
          
          // Distribuir meta pelos meses do período
          const monthsDiff = (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
                            (endDate.getMonth() - startDate.getMonth()) + 1;
          const monthlyTarget = goal.target_amount / monthsDiff;
          
          for (let date = new Date(startDate); date <= endDate; date.setMonth(date.getMonth() + 1)) {
            const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            if (monthsMap[monthYear]) {
              monthsMap[monthYear].meta += monthlyTarget;
            }
          }
        }
      });
    }

    return Object.values(monthsMap);
  }, [dashboardData, commissions, goals]);

  // Dados dos produtos (gráfico de rosca) - DADOS REAIS
  const productData = useMemo(() => {
    if (!dashboardData?.top_products || dashboardData.top_products.length === 0) {
      return []; // Retorna array vazio se não houver dados
    }
    
    const colors = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', '#ef4444', '#8b5cf6'];
    
    return dashboardData.top_products.map((product, index) => ({
      name: product.product_name,
      value: product.total_revenue,
      sales: product.sales_count,
      color: colors[index % colors.length]
    }));
  }, [dashboardData]);

  // Vendedores performance
  const vendorsData = useMemo(() => {
    if (!dashboardData?.vendors_performance) {
      return [
        { name: "João Silva", value: 35, color: "hsl(var(--chart-1))" },
        { name: "Maria Santos", value: 28, color: "hsl(var(--chart-2))" },
        { name: "Pedro Costa", value: 22, color: "hsl(var(--chart-3))" },
        { name: "Ana Oliveira", value: 15, color: "#ef4444" },
      ];
    }
    
    const colors = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', '#ef4444'];
    
    return dashboardData.vendors_performance.map((vendor, index) => ({
      name: vendor.vendor_name,
      value: vendor.total_sales,
      color: colors[index % colors.length]
    }));
  }, [dashboardData]);

  // Vendas recentes formatadas
  const recentSales = useMemo(() => {
    if (!dashboardData?.recent_sales) {
      return [
        {
          cliente: "Empresa ABC Ltda",
          vendedor: "João Silva",
          valor: "R$ 85.000",
          comissao: "R$ 4.250",
          data: "2024-01-15"
        },
        {
          cliente: "Construtora XYZ",
          vendedor: "Maria Santos",
          valor: "R$ 120.000",
          comissao: "R$ 6.000",
          data: "2024-01-14"
        },
        {
          cliente: "Transportes Rápidos",
          vendedor: "Pedro Costa",
          valor: "R$ 65.000",
          comissao: "R$ 3.250",
          data: "2024-01-13"
        },
      ];
    }
    
    return dashboardData.recent_sales.slice(0, 5).map((sale: any) => ({
      cliente: sale.client_name,
      vendedor: sale.seller_name,
      valor: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(sale.sale_value),
      comissao: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(sale.commission_amount || 0),
      data: new Date(sale.sale_date).toLocaleDateString('pt-BR')
    }));
  }, [dashboardData]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const getCurrentPeriodLabel = () => {
    const labels = {
      today: 'Hoje',
      week: 'Esta Semana', 
      month: 'Este Mês',
      previous_month: 'Mês Anterior'
    };
    return labels[filters.dateRange];
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6 bg-background min-h-screen">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-64 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-background min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Visão geral das vendas e comissões - {user?.user_metadata?.full_name || 'Usuário'}
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="w-4 h-4" />
          {getCurrentPeriodLabel()}
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Período</label>
              <Select 
                value={filters.dateRange} 
                onValueChange={(value: any) => setFilters({...filters, dateRange: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Hoje</SelectItem>
                  <SelectItem value="week">Esta Semana</SelectItem>
                  <SelectItem value="month">Este Mês</SelectItem>
                  <SelectItem value="previous_month">Mês Anterior</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Escritório</label>
              <Select 
                value={filters.office} 
                onValueChange={(value) => setFilters({...filters, office: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Escritórios</SelectItem>
                  <SelectItem value="matriz">Matriz</SelectItem>
                  <SelectItem value="filial">Filial</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Vendedor</label>
              <Select 
                value={filters.seller} 
                onValueChange={(value) => setFilters({...filters, seller: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Vendedores</SelectItem>
                  {dashboardData?.vendors_performance?.map((vendor) => (
                    <SelectItem key={vendor.vendor_id} value={vendor.vendor_id}>
                      {vendor.vendor_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Produto</label>
              <Select 
                value={filters.product} 
                onValueChange={(value) => setFilters({...filters, product: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Produtos</SelectItem>
                  {dashboardData?.top_products?.map((product, index) => (
                    <SelectItem key={index} value={product.product_name}>
                      {product.product_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Ações</label>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => refetch()}
                  className="flex-1"
                >
                  <RefreshCw className="w-4 h-4 mr-1" />
                  Atualizar
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Métricas principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Vendas do Período"
          value={stats.current.total_sales.toString()}
          icon={TrendingUp}
          change={`${stats.growth.sales > 0 ? '+' : ''}${stats.growth.sales}%`}
          changeType={stats.growth.sales > 0 ? "positive" : stats.growth.sales < 0 ? "negative" : "neutral"}
        />
        <MetricCard
          title="Receita Total"
          value={formatCurrency(stats.current.total_revenue)}
          icon={DollarSign}
          change={`${stats.growth.revenue > 0 ? '+' : ''}${stats.growth.revenue}%`}
          changeType={stats.growth.revenue > 0 ? "positive" : stats.growth.revenue < 0 ? "negative" : "neutral"}
        />
        <MetricCard
          title="Comissões Pagas"
          value={formatCurrency(stats.current.total_commission)}
          icon={Award}
          change={`${stats.growth.commission > 0 ? '+' : ''}${stats.growth.commission}%`}
          changeType={stats.growth.commission > 0 ? "positive" : stats.growth.commission < 0 ? "negative" : "neutral"}
        />
        <MetricCard
          title="Clientes Ativos"
          value={stats.current.total_clients.toString()}
          icon={Users}
          change={`${stats.growth.clients > 0 ? '+' : ''}${stats.growth.clients}%`}
          changeType={stats.growth.clients > 0 ? "positive" : stats.growth.clients < 0 ? "negative" : "neutral"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de vendas mensais */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Vendas Mensais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => formatCurrency(value)} />
                <Tooltip formatter={(value, name) => [formatCurrency(Number(value)), name === 'vendas' ? 'Vendas' : 'Meta']} />
                <Bar 
                  dataKey="vendas" 
                  fill="hsl(var(--chart-1))" 
                  radius={[4, 4, 0, 0]} 
                  name="Vendas"
                />
                <Bar 
                  dataKey="meta" 
                  fill="hsl(var(--chart-3))" 
                  radius={[4, 4, 0, 0]} 
                  name="Meta"
                  opacity={0.7}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfico de comissões */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-primary" />
              Evolução das Comissões
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => formatCurrency(value)} />
                <Tooltip formatter={(value) => [formatCurrency(Number(value)), "Comissões"]} />
                <Line
                  type="monotone"
                  dataKey="comissoes"
                  stroke="hsl(var(--chart-1))"
                  strokeWidth={3}
                  dot={{ fill: "hsl(var(--chart-1))", strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: "hsl(var(--chart-1))", strokeWidth: 2 }}
                  name="Comissões"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico de rosca - Produtos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              Vendas por Produto
            </CardTitle>
          </CardHeader>
          <CardContent>
            {productData.length === 0 ? (
              <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                <div className="text-center">
                  <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum dado de produto disponível</p>
                  <p className="text-sm">Dados aparecerão após a primeira venda aprovada</p>
                </div>
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={productData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      paddingAngle={5}
                    >
                      {productData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name) => [formatCurrency(Number(value)), name]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 space-y-2">
                  {productData.map((product, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: product.color }}
                        />
                        <span className="text-muted-foreground">{product.name}</span>
                      </div>
                      <Badge variant="secondary">{product.sales} vendas</Badge>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Top vendedores */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5 text-primary" />
              Top Vendedores
            </CardTitle>
          </CardHeader>
          <CardContent>
            {vendorsData.length === 0 ? (
              <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                <div className="text-center">
                  <Award className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum dado de vendedor disponível</p>
                  <p className="text-sm">Dados aparecerão após a primeira venda aprovada</p>
                </div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={vendorsData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {vendorsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Vendas recentes */}
        <Card>
          <CardHeader>
            <CardTitle>Vendas Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentSales.map((sale, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div>
                    <p className="font-medium text-foreground">{sale.cliente}</p>
                    <p className="text-sm text-muted-foreground">Vendedor: {sale.vendedor}</p>
                    <p className="text-xs text-muted-foreground">{sale.data}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-foreground">{sale.valor}</p>
                    <p className="text-sm text-green-600">{sale.comissao}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
