
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Download, TrendingUp, DollarSign, Users, Calendar } from "lucide-react";

const vendasMensais = [
  { mes: "Jan", vendas: 45, comissoes: 12000 },
  { mes: "Fev", vendas: 52, comissoes: 14500 },
  { mes: "Mar", vendas: 38, comissoes: 10200 },
  { mes: "Abr", vendas: 67, comissoes: 18900 },
  { mes: "Mai", vendas: 71, comissoes: 21500 },
  { mes: "Jun", vendas: 59, comissoes: 16800 },
];

const vendedoresPerformance = [
  { vendedor: "João Silva", vendas: 35, comissoes: 8500 },
  { vendedor: "Maria Santos", vendas: 28, comissoes: 7200 },
  { vendedor: "Pedro Costa", vendas: 22, comissoes: 5800 },
  { vendedor: "Ana Oliveira", vendas: 15, comissoes: 4100 },
];

const tiposConsorcio = [
  { name: "Veículos", value: 45, color: "#3B82F6" },
  { name: "Imóveis", value: 30, color: "#06B6D4" },
  { name: "Serviços", value: 15, color: "#8B5CF6" },
  { name: "Outros", value: 10, color: "#F59E0B" },
];

export default function Relatorios() {
  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Relatórios</h1>
          <p className="text-gray-600 mt-1">Análise detalhada de vendas e performance</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Calendar className="w-4 h-4 mr-2" />
            Período
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Download className="w-4 h-4 mr-2" />
            Exportar PDF
          </Button>
        </div>
      </div>

      {/* Cards resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vendas Totais (6m)</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">332</div>
            <p className="text-xs text-blue-600 mt-1">Meta: 360 vendas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Comissões (6m)</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ 103.9k</div>
            <p className="text-xs text-green-600 mt-1">+15% vs período anterior</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
            <DollarSign className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ 67.5k</div>
            <p className="text-xs text-purple-600 mt-1">Por venda realizada</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa Conversão</CardTitle>
            <Users className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">68%</div>
            <p className="text-xs text-orange-600 mt-1">Prospects convertidos</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de vendas e comissões mensais */}
        <Card>
          <CardHeader>
            <CardTitle>Vendas e Comissões por Mês</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={vendasMensais}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Bar yAxisId="left" dataKey="vendas" fill="#3B82F6" name="Vendas" />
                <Bar yAxisId="right" dataKey="comissoes" fill="#10B981" name="Comissões (R$)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Distribuição por tipo de consórcio */}
        <Card>
          <CardHeader>
            <CardTitle>Vendas por Tipo de Consórcio</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={tiposConsorcio}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ name, value }) => `${name}: ${value}%`}
                >
                  {tiposConsorcio.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Performance dos vendedores */}
      <Card>
        <CardHeader>
          <CardTitle>Performance dos Vendedores</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={vendedoresPerformance} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="vendedor" type="category" width={100} />
              <Tooltip />
              <Bar dataKey="vendas" fill="#3B82F6" name="Vendas" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Evolução das comissões */}
      <Card>
        <CardHeader>
          <CardTitle>Evolução das Comissões</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={vendasMensais}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis />
              <Tooltip formatter={(value) => [`R$ ${value}`, "Comissões"]} />
              <Line
                type="monotone"
                dataKey="comissoes"
                stroke="#10B981"
                strokeWidth={3}
                dot={{ fill: "#10B981", strokeWidth: 2, r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
