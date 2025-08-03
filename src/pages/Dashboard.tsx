
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Calendar, 
  TrendingUp, 
  DollarSign, 
  Users, 
  Target, 
  Award, 
  Plus,
  Eye,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Download,
  RefreshCw,
  MoreHorizontal,
  Activity,
  Building2,
  UserCheck,
  Clock
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart,
  Area,
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
import { useDashboardOptimized } from '@/hooks/useDashboardOptimized';
import { useContextualDashboard } from '@/hooks/useContextualDashboard';
import { useDashboardConfig } from '@/hooks/useDashboardConfig';

// Componente de Métrica Moderna
interface ModernMetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: string;
  onClick?: () => void;
}

const ModernMetricCard: React.FC<ModernMetricCardProps> = ({ 
  title, 
  value, 
  subtitle, 
  icon, 
  trend, 
  color = "primary",
  onClick 
}) => {
  return (
    <Card className={`relative overflow-hidden transition-all duration-300 hover:shadow-lg ${onClick ? 'cursor-pointer' : ''}`} onClick={onClick}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className={`p-2 rounded-lg bg-${color}/10`}>
            <div className={`text-${color}`}>
              {icon}
            </div>
          </div>
          {trend && (
            <div className={`flex items-center text-xs ${trend.isPositive ? 'text-success' : 'text-destructive'}`}>
              {trend.isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {trend.value}%
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-1">
          <p className="text-2xl font-bold text-foreground">{value}</p>
          <p className="text-sm text-muted-foreground">{title}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Componente de Ação Rápida
interface QuickActionProps {
  title: string;
  icon: React.ReactNode;
  onClick: () => void;
  color?: string;
}

const QuickAction: React.FC<QuickActionProps> = ({ title, icon, onClick, color = "primary" }) => {
  return (
    <Button
      variant="outline"
      className={`h-20 flex flex-col items-center justify-center space-y-2 hover:bg-${color}/10 transition-colors`}
      onClick={onClick}
    >
      <div className={`text-${color}`}>
        {icon}
      </div>
      <span className="text-xs font-medium">{title}</span>
    </Button>
  );
};

const Dashboard = () => {
  const { activeTenant, user } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedOffice, setSelectedOffice] = useState('all');
  
  // Hooks de dados contextuais
  const { data: contextualData, isLoading: contextualLoading } = useContextualDashboard();
  const { data: dashboardData, isLoading: dashboardLoading } = useDashboardOptimized();
  const { data: dashboardConfig, isLoading: configLoading } = useDashboardConfig();

  const isLoading = contextualLoading || dashboardLoading || configLoading;

  // Dados do dashboard com fallbacks
  const stats = contextualData || {
    total_clients: 0,
    total_sales: 0,
    total_commission: 0,
    pending_tasks: 0,
    month_sales: 0,
    month_commission: 0,
    user_role: 'user',
    accessible_offices: [],
    context_level: 4
  };

  // Dados dos gráficos
  const chartData = dashboardData || {
    monthlyTrend: [],
    topProducts: [],
    recentActivities: [],
    officePerformance: []
  };

  const offices = [
    { id: 'all', name: 'Todos os Escritórios' },
    { id: 'office1', name: 'Matriz' },
    { id: 'office2', name: 'Filial São Paulo' }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="animate-pulse p-6 space-y-6">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

  // Dados de exemplo para demonstração
  const monthlyTrend = [
    { month: 'Jan', vendas: 32000, comissoes: 3200, metas: 35000 },
    { month: 'Fev', vendas: 28000, comissoes: 2800, metas: 35000 },
    { month: 'Mar', vendas: 42000, comissoes: 4200, metas: 35000 },
    { month: 'Abr', vendas: 38000, comissoes: 3800, metas: 40000 },
    { month: 'Mai', vendas: 45000, comissoes: 4500, metas: 40000 },
    { month: 'Jun', vendas: stats.month_sales || 48000, comissoes: stats.month_commission || 4800, metas: 45000 },
  ];

  const topProducts = [
    { name: 'Consórcio Imóvel', value: 45, color: '#3b82f6' },
    { name: 'Consórcio Veículo', value: 30, color: '#10b981' },
    { name: 'Consórcio Moto', value: 15, color: '#f59e0b' },
    { name: 'Outros', value: 10, color: '#ef4444' },
  ];

  const recentActivities = [
    { 
      id: 1, 
      client: 'Maria Silva', 
      action: 'Nova venda', 
      value: 'R$ 25.000', 
      time: '2 min atrás',
      status: 'success'
    },
    { 
      id: 2, 
      client: 'João Santos', 
      action: 'Reunião agendada', 
      value: 'Amanhã 14h', 
      time: '15 min atrás',
      status: 'pending'
    },
    { 
      id: 3, 
      client: 'Ana Costa', 
      action: 'Proposta enviada', 
      value: 'R$ 18.500', 
      time: '1h atrás',
      status: 'info'
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header Moderno */}
      <div className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div>
                <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
                <p className="text-sm text-muted-foreground">
                  Bem-vindo de volta, {user?.user_metadata?.full_name || 'Usuário'}
                </p>
              </div>
              {dashboardConfig && (
                <Badge variant="secondary" className="ml-4">
                  {dashboardConfig.data_scope === 'global' ? 'Visão Global' : 
                   dashboardConfig.data_scope === 'office' ? 'Visão Escritório' : 'Visão Pessoal'}
                </Badge>
              )}
            </div>
            
            <div className="flex items-center space-x-3">
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Hoje</SelectItem>
                  <SelectItem value="week">Semana</SelectItem>
                  <SelectItem value="month">Mês</SelectItem>
                  <SelectItem value="quarter">Trimestre</SelectItem>
                  <SelectItem value="year">Ano</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={selectedOffice} onValueChange={setSelectedOffice}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {offices.map((office) => (
                    <SelectItem key={office.id} value={office.id}>
                      {office.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Button variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Atualizar
              </Button>
              
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Métricas Principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <ModernMetricCard
            title="Total de Vendas"
            value={stats.total_sales}
            subtitle="vendas realizadas"
            icon={<TrendingUp className="w-5 h-5" />}
            trend={{ value: 12, isPositive: true }}
            color="blue"
          />
          <ModernMetricCard
            title="Clientes Ativos"
            value={stats.total_clients}
            subtitle="clientes cadastrados"
            icon={<Users className="w-5 h-5" />}
            trend={{ value: 8, isPositive: true }}
            color="green"
          />
          <ModernMetricCard
            title="Receita Mensal"
            value={formatCurrency(stats.month_sales)}
            subtitle="faturamento do mês"
            icon={<DollarSign className="w-5 h-5" />}
            trend={{ value: 5, isPositive: true }}
            color="purple"
          />
          <ModernMetricCard
            title="Tarefas Pendentes"
            value={stats.pending_tasks}
            subtitle="tarefas em aberto"
            icon={<Clock className="w-5 h-5" />}
            color="orange"
          />
        </div>

        {/* Ações Rápidas */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Ações Rápidas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <QuickAction
                title="Nova Venda"
                icon={<Plus className="w-5 h-5" />}
                onClick={() => window.location.href = '/vendas'}
                color="green"
              />
              <QuickAction
                title="Novo Cliente"
                icon={<UserCheck className="w-5 h-5" />}
                onClick={() => window.location.href = '/clientes'}
                color="blue"
              />
              <QuickAction
                title="Nova Meta"
                icon={<Target className="w-5 h-5" />}
                onClick={() => window.location.href = '/metas'}
                color="purple"
              />
              <QuickAction
                title="Relatórios"
                icon={<Activity className="w-5 h-5" />}
                onClick={() => window.location.href = '/relatorios'}
                color="orange"
              />
            </div>
          </CardContent>
        </Card>

        {/* Gráficos Principais */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          
          {/* Tendência Mensal */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Tendência de Vendas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="vendas" 
                    stroke="hsl(var(--primary))" 
                    fill="hsl(var(--primary))" 
                    fillOpacity={0.2}
                    name="Vendas"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="metas" 
                    stroke="hsl(var(--muted-foreground))" 
                    fill="transparent" 
                    strokeDasharray="5 5"
                    name="Meta"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Produtos Mais Vendidos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5" />
                Produtos Mais Vendidos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={topProducts}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {topProducts.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {topProducts.map((product, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: product.color }}
                    />
                    <span className="text-sm text-muted-foreground">
                      {product.name}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Atividades Recentes e Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Atividades Recentes */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Atividades Recentes
                </CardTitle>
                <Button variant="ghost" size="sm">
                  <Eye className="w-4 h-4 mr-2" />
                  Ver Todas
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-4 rounded-lg border bg-card/50">
                    <div className="flex items-center space-x-3">
                      <div className={`w-2 h-2 rounded-full ${
                        activity.status === 'success' ? 'bg-green-500' :
                        activity.status === 'pending' ? 'bg-yellow-500' :
                        'bg-blue-500'
                      }`} />
                      <div>
                        <p className="font-medium text-sm">{activity.client}</p>
                        <p className="text-xs text-muted-foreground">{activity.action}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-sm">{activity.value}</p>
                      <p className="text-xs text-muted-foreground">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Resumo Rápido */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Resumo do Dia
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Meta Diária</span>
                  <span className="font-medium">R$ 5.000</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full" style={{ width: '75%' }} />
                </div>
                <p className="text-xs text-muted-foreground">75% da meta atingida</p>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Reuniões Hoje</span>
                  <Badge variant="secondary">3</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Follow-ups</span>
                  <Badge variant="outline">2</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Propostas Enviadas</span>
                  <Badge variant="default">5</Badge>
                </div>
              </div>
              
              <Separator />
              
              <Button className="w-full" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Nova Atividade
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
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
