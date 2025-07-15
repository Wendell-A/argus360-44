
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricCard } from "@/components/MetricCard";
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  DollarSign,
  Target,
  Calendar,
  BarChart3,
  Activity
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { useSales } from "@/hooks/useSales";
import { useVendedores } from "@/hooks/useVendedores";
import { useConsortiumProducts } from "@/hooks/useConsortiumProducts";
import { useCommissions } from "@/hooks/useCommissions";
import { useMemo } from "react";

export default function Dashboard() {
  const { sales } = useSales();
  const { vendedores } = useVendedores();
  const { products } = useConsortiumProducts();
  const { commissions } = useCommissions();

  // Calcular métricas em tempo real
  const metrics = useMemo(() => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const currentMonthSales = sales.filter(sale => {
      const saleDate = new Date(sale.sale_date);
      return saleDate.getMonth() === currentMonth && saleDate.getFullYear() === currentYear;
    });

    const approvedSales = sales.filter(sale => sale.status === 'approved');
    const totalRevenue = approvedSales.reduce((sum, sale) => sum + (sale.sale_value || 0), 0);
    const activeVendedores = vendedores.filter(v => {
      const settings = v.settings as any || {};
      return settings.active !== false;
    }).length;

    // Calcular progresso da meta (assumindo meta de 100 vendas/mês)
    const monthlyGoal = 100;
    const goalProgress = (currentMonthSales.length / monthlyGoal) * 100;

    return {
      currentMonthSales: currentMonthSales.length,
      totalRevenue,
      activeVendedores,
      goalProgress: Math.min(goalProgress, 100),
    };
  }, [sales, vendedores]);

  // Dados para gráfico de vendas por mês
  const salesData = useMemo(() => {
    const monthlyData = Array.from({ length: 6 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (5 - i));
      const month = date.toLocaleDateString('pt-BR', { month: 'short' });
      
      const monthSales = sales.filter(sale => {
        const saleDate = new Date(sale.sale_date);
        return saleDate.getMonth() === date.getMonth() && 
               saleDate.getFullYear() === date.getFullYear();
      });

      return {
        name: month,
        vendas: monthSales.length,
        meta: 15, // Meta fixa para exemplo
      };
    });

    return monthlyData;
  }, [sales]);

  // Dados para gráfico de categorias
  const categoryData = useMemo(() => {
    const categoryCount = {};
    
    sales.forEach(sale => {
      const product = products.find(p => p.id === sale.product_id);
      if (product) {
        categoryCount[product.category] = (categoryCount[product.category] || 0) + 1;
      }
    });

    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
    
    return Object.entries(categoryCount).map(([category, count], index) => ({
      name: category,
      value: count,
      color: colors[index % colors.length],
    }));
  }, [sales, products]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4 sm:p-6 lg:p-8 xl:p-12 w-full max-w-none">
        {/* Header */}
        <div className="mb-6 lg:mb-8 xl:mb-12">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm sm:text-base lg:text-lg text-gray-600 mt-1">Visão geral do seu negócio</p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-4 lg:gap-6 xl:gap-8 mb-6 lg:mb-8 xl:mb-12">
          <MetricCard
            title="Vendas do Mês"
            value={metrics.currentMonthSales.toString()}
            change="+12%"
            changeType="positive"
            icon={TrendingUp}
          />
          <MetricCard
            title="Receita Total"
            value={formatCurrency(metrics.totalRevenue)}
            change="+8%"
            changeType="positive"
            icon={DollarSign}
          />
          <MetricCard
            title="Vendedores Ativos"
            value={metrics.activeVendedores.toString()}
            change="+2"
            changeType="positive"
            icon={Users}
          />
          <MetricCard
            title="Meta Mensal"
            value={`${metrics.goalProgress.toFixed(0)}%`}
            change={metrics.goalProgress > 75 ? "+5%" : "-5%"}
            changeType={metrics.goalProgress > 75 ? "positive" : "negative"}
            icon={Target}
          />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 lg:gap-6 xl:gap-8 mb-6 lg:mb-8 xl:mb-12">
          {/* Sales Chart */}
          <Card className="xl:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg lg:text-xl">
                <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6" />
                Vendas vs Meta
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 sm:h-80 lg:h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="vendas" fill="#3b82f6" name="Vendas" />
                    <Bar dataKey="meta" fill="#e5e7eb" name="Meta" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Category Distribution */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg lg:text-xl">
                <Activity className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6" />
                Vendas por Categoria
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 sm:h-80 lg:h-96">
                {categoryData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    Sem dados de vendas para exibir
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Trend */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg lg:text-xl">
              <Calendar className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6" />
              Tendência de Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 sm:h-80 lg:h-96">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="vendas" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    name="Vendas"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="meta" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    name="Meta"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
