
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

const salesData = [
  { name: 'Jan', vendas: 12, meta: 15 },
  { name: 'Fev', vendas: 19, meta: 18 },
  { name: 'Mar', vendas: 8, meta: 12 },
  { name: 'Abr', vendas: 15, meta: 14 },
  { name: 'Mai', vendas: 22, meta: 20 },
  { name: 'Jun', vendas: 18, meta: 16 },
];

const categoryData = [
  { name: 'Carros', value: 45, color: '#3b82f6' },
  { name: 'Motos', value: 25, color: '#10b981' },
  { name: 'Imóveis', value: 20, color: '#f59e0b' },
  { name: 'Outros', value: 10, color: '#ef4444' },
];

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4 sm:p-6 lg:p-8 w-full">
        {/* Header */}
        <div className="mb-6 lg:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Visão geral do seu negócio</p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6 lg:mb-8">
          <MetricCard
            title="Vendas do Mês"
            value="84"
            change="+12%"
            trend="up"
            icon={<TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />}
          />
          <MetricCard
            title="Receita Total"
            value="R$ 245.600"
            change="+8%"
            trend="up"
            icon={<DollarSign className="h-4 w-4 sm:h-5 sm:w-5" />}
          />
          <MetricCard
            title="Vendedores Ativos"
            value="12"
            change="+2"
            trend="up"
            icon={<Users className="h-4 w-4 sm:h-5 sm:w-5" />}
          />
          <MetricCard
            title="Meta Mensal"
            value="75%"
            change="-5%"
            trend="down"
            icon={<Target className="h-4 w-4 sm:h-5 sm:w-5" />}
          />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 lg:gap-6 mb-6 lg:mb-8">
          {/* Sales Chart */}
          <Card className="xl:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5" />
                Vendas vs Meta
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 sm:h-80">
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
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Activity className="h-4 w-4 sm:h-5 sm:w-5" />
                Vendas por Categoria
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 sm:h-80">
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
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Trend */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
              Tendência de Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 sm:h-80">
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
