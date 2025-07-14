
import { MetricCard } from "@/components/MetricCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DollarSign,
  Users,
  TrendingUp,
  Award,
  Calendar,
  Target
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

const monthlyData = [
  { month: "Jan", vendas: 45, comissoes: 12000 },
  { month: "Fev", vendas: 52, comissoes: 14500 },
  { month: "Mar", vendas: 38, comissoes: 10200 },
  { month: "Abr", vendas: 67, comissoes: 18900 },
  { month: "Mai", vendas: 71, comissoes: 21500 },
  { month: "Jun", vendas: 59, comissoes: 16800 },
];

const vendedoresData = [
  { name: "João Silva", value: 35, color: "#3B82F6" },
  { name: "Maria Santos", value: 28, color: "#06B6D4" },
  { name: "Pedro Costa", value: 22, color: "#8B5CF6" },
  { name: "Ana Oliveira", value: 15, color: "#F59E0B" },
];

const recentSales = [
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

export default function Dashboard() {
  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Visão geral das vendas e comissões</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Calendar className="w-4 h-4" />
          Janeiro 2024
        </div>
      </div>

      {/* Métricas principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Vendas do Mês"
          value="71"
          icon={TrendingUp}
          change="+12%"
          changeType="positive"
        />
        <MetricCard
          title="Comissões Pagas"
          value="R$ 21.500"
          icon={DollarSign}
          change="+8%"
          changeType="positive"
        />
        <MetricCard
          title="Vendedores Ativos"
          value="8"
          icon={Users}
          change="Estável"
          changeType="neutral"
        />
        <MetricCard
          title="Meta Mensal"
          value="85%"
          icon={Target}
          change="+5%"
          changeType="positive"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de vendas mensais */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart className="w-5 h-5 text-blue-600" />
              Vendas Mensais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="vendas" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfico de comissões */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              Evolução das Comissões
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => [`R$ ${value}`, "Comissões"]} />
                <Line
                  type="monotone"
                  dataKey="comissoes"
                  stroke="#10B981"
                  strokeWidth={3}
                  dot={{ fill: "#10B981", strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top vendedores */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5 text-yellow-600" />
              Top Vendedores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={vendedoresData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, value }) => `${name}: ${value}%`}
                >
                  {vendedoresData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Vendas recentes */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Vendas Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentSales.map((sale, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{sale.cliente}</p>
                    <p className="text-sm text-gray-600">Vendedor: {sale.vendedor}</p>
                    <p className="text-xs text-gray-500">{sale.data}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">{sale.valor}</p>
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
