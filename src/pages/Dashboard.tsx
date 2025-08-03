
import React from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Calendar, TrendingUp, DollarSign, Users, Target, Award, ShoppingCart, BarChart3, Building } from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  LineChart, 
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { useAuth } from '@/contexts/AuthContext';
import { useGoals, useGoalStats } from '@/hooks/useGoals';
import { useDashboardFilters } from '@/hooks/useDashboardFilters';
import { useDashboardConfig } from '@/hooks/useDashboardConfig';
import { DashboardFilters } from '@/components/DashboardFilters';

interface MetricCardProps {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
  trend: number;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, description, icon, trend }) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <CardDescription>
          {description}
          {trend !== 0 && (
            <span className={`ml-2 ${trend > 0 ? 'text-green-500' : 'text-red-500'}`}>
              {trend > 0 ? '▲' : '▼'} {Math.abs(trend)}%
            </span>
          )}
        </CardDescription>
      </CardContent>
    </Card>
  );
};

const Dashboard = () => {
  const { activeTenant } = useAuth();
  const { goals, isLoading: goalsLoading } = useGoals();
  const { data: goalStats, isLoading: statsLoading } = useGoalStats();
  const { data: dashboardConfig, isLoading: configLoading } = useDashboardConfig();
  
  // Hook com filtros e paginação
  const {
    data: dashboardData,
    isLoading: dashboardLoading,
    filters,
    updateFilters,
    resetFilters,
    pagination
  } = useDashboardFilters();

  const isLoading = goalsLoading || statsLoading || dashboardLoading || configLoading;

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Função para verificar se um widget deve ser exibido
  const renderWidget = (widgetKey: string) => {
    if (!dashboardConfig?.widgets) return true; // Se não há config, mostrar tudo
    return dashboardConfig.widgets[widgetKey as keyof typeof dashboardConfig.widgets] === true;
  };

  // Usar dados reais dos filtros ou fallback
  const stats = dashboardData?.stats || { total_clients: 0, total_sales: 0, total_revenue: 0, total_commission: 0 };
  const recentSales = dashboardData?.recent_sales || [];
  const recentClients = dashboardData?.recent_clients || [];
  const pendingTasks = dashboardData?.pending_tasks || [];
  const goals_data = dashboardData?.goals || [];
  const commission_summary = dashboardData?.commission_summary || { pending_commissions: 0 };

  const vendasMensais = [
    { month: 'Jul', vendas: 35000, meta: 40000 },
    { month: 'Ago', vendas: 42000, meta: 45000 },
    { month: 'Set', vendas: 38000, meta: 42000 },
    { month: 'Out', vendas: 51000, meta: 48000 },
    { month: 'Nov', vendas: 47000, meta: 50000 },
    { month: 'Dez', vendas: stats.total_revenue || 49000, meta: 52000 },
  ];

  const comissoesMensais = [
    { month: 'Jul', comissoes: 3500, meta: 4000 },
    { month: 'Ago', comissoes: 4200, meta: 4500 },
    { month: 'Set', comissoes: 3800, meta: 4200 },
    { month: 'Out', comissoes: 5100, meta: 4800 },
    { month: 'Nov', comissoes: 4700, meta: 5000 },
    { month: 'Dez', comissoes: stats.total_commission || 4900, meta: 5200 },
  ];

  // Dados para o gráfico de pizza dos vendedores com cores (usando fallback até implementarmos a query)
  const topVendedores = [
    { name: 'João Silva', value: 85000, color: '#10b981' },
    { name: 'Maria Santos', value: 72000, color: '#3b82f6' },
    { name: 'Pedro Costa', value: 68000, color: '#f59e0b' },
    { name: 'Ana Oliveira', value: 54000, color: '#ef4444' },
  ];

  // Vendas recentes com dados otimizados
  const vendasRecentes = recentSales.map((sale: any) => ({
    cliente: sale.client_name,
    vendedor: sale.seller_name,
    valor: formatCurrency(sale.sale_value),
    comissao: formatCurrency(sale.sale_value * 0.05), // 5% padrão
    data: new Date(sale.sale_date).toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit',
      year: 'numeric' 
    })
  }));

  // Calcular estatísticas das metas com dados reais
  const totalGoals = goals.length;
  const activeGoals = goals.filter(goal => goal.status === 'active').length;
  const completedGoals = goals.filter(goal => goal.current_amount >= goal.target_amount).length;
  const goalCompletionRate = totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0;

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Janeiro 2024
            {dashboardConfig && (
              <span className="text-sm ml-4 px-2 py-1 bg-primary/10 rounded-md">
                {dashboardConfig.data_scope === 'global' ? 'Visão Global' : 
                 dashboardConfig.data_scope === 'office' ? 'Visão Escritório' : 'Visão Pessoal'}
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Filtros do Dashboard */}
      <div className="mb-6">
        <DashboardFilters
          filters={filters}
          onFiltersChange={updateFilters}
          onReset={resetFilters}
          pagination={pagination}
          isLoading={dashboardLoading}
        />
      </div>

      {/* Métricas Principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {renderWidget('total_sales') && (
          <MetricCard
            title="Total de Vendas"
            value={stats.total_sales.toString()}
            description="vendas realizadas"
            icon={<TrendingUp className="h-4 w-4" />}
            trend={12}
          />
        )}
        {renderWidget('total_clients') && (
          <MetricCard
            title="Total de Clientes"
            value={stats.total_clients.toString()}
            description="clientes cadastrados"
            icon={<Users className="h-4 w-4" />}
            trend={8}
          />
        )}
        {renderWidget('monthly_performance') && (
          <MetricCard
            title="Vendas do Mês"
            value={formatCurrency(stats.total_revenue)}
            description="faturamento mensal"
            icon={<DollarSign className="h-4 w-4" />}
            trend={2}
          />
        )}
        {renderWidget('personal_goals') && (
          <MetricCard
            title="Meta Mensal"
            value={`${goalCompletionRate.toFixed(1)}%`}
            description="da meta atingida"
            icon={<Target className="h-4 w-4" />}
            trend={goalCompletionRate >= 80 ? 15 : -5}
          />
        )}
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        {/* Gráfico de Vendas Mensais */}
        {renderWidget('monthly_performance') && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Desempenho Mensal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={vendasMensais}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="vendas" fill="#10b981" name="Vendas" />
                  <Bar dataKey="meta" fill="#3b82f6" name="Meta" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Gráfico de Comissões */}
        {renderWidget('commission_breakdown') && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Evolução das Comissões
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={comissoesMensais}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="comissoes" stroke="#10b981" strokeWidth={2} name="Comissões" />
                  <Line type="monotone" dataKey="meta" stroke="#3b82f6" strokeWidth={2} name="Meta" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Seção Inferior - Top Vendedores e Vendas Recentes */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Top Vendedores */}
        {renderWidget('top_sellers') && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Top Vendedores
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={topVendedores}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${formatCurrency(value)}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {topVendedores.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Atividades Recentes */}
        {renderWidget('recent_activities') && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Atividades Recentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {vendasRecentes.map((venda, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div>
                      <div className="font-medium">{venda.cliente}</div>
                      <div className="text-sm text-muted-foreground">
                        Vendedor: {venda.vendedor}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{venda.valor}</div>
                      <div className="text-sm text-muted-foreground">
                        Comissão: {venda.comissao}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {venda.data}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Estatísticas das Metas */}
      {renderWidget('personal_goals') && goalStats && goalStats.totalGoals > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Estatísticas das Metas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{goalStats.totalGoals}</div>
                <div className="text-sm text-muted-foreground">Total de Metas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{goalStats.totalGoals}</div>
                <div className="text-sm text-muted-foreground">Metas Ativas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{goalStats.completedGoals}</div>
                <div className="text-sm text-muted-foreground">Metas Concluídas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{goalStats.averageProgress.toFixed(1)}%</div>
                <div className="text-sm text-muted-foreground">Progresso Médio</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Widget de Comparação de Escritórios - apenas para Owners/Admins */}
      {renderWidget('office_comparison') && dashboardConfig?.data_scope === 'global' && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Comparação de Escritórios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center text-muted-foreground py-8">
              <p>Dados de comparação entre escritórios serão exibidos aqui</p>
              <p className="text-sm mt-2">Funcionalidade disponível apenas para administradores</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

export default Dashboard;
