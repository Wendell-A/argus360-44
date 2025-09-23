import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Download, Filter, Calendar } from 'lucide-react';

// Mock data - em uma implementação real, estes dados viriam de hooks
const monthlyData = [
  { month: 'Jan', comissoes: 45000, configuracoes: 12, vendedores: 8 },
  { month: 'Fev', comissoes: 52000, configuracoes: 15, vendedores: 10 },
  { month: 'Mar', comissoes: 48000, configuracoes: 13, vendedores: 9 },
  { month: 'Abr', comissoes: 61000, configuracoes: 18, vendedores: 12 },
  { month: 'Mai', comissoes: 67000, configuracoes: 20, vendedores: 14 },
  { month: 'Jun', comissoes: 71000, configuracoes: 22, vendedores: 15 }
];

const commissionByProduct = [
  { name: 'Consórcio Imóvel', value: 35, comissoes: 245000, cor: '#3b82f6' },
  { name: 'Consórcio Auto', value: 28, comissoes: 189000, cor: '#10b981' },
  { name: 'Consórcio Moto', value: 22, comissoes: 156000, cor: '#f59e0b' },
  { name: 'Consórcio Pesado', value: 15, comissoes: 98000, cor: '#ef4444' }
];

const topSellers = [
  { name: 'João Silva', comissoes: 25600, taxa: 3.2, vendas: 8 },
  { name: 'Maria Santos', comissoes: 22100, taxa: 2.8, vendas: 12 },
  { name: 'Pedro Costa', comissoes: 19800, taxa: 3.5, vendas: 6 },
  { name: 'Ana Oliveira', comissoes: 18200, taxa: 2.5, vendas: 14 },
  { name: 'Carlos Lima', comissoes: 16900, taxa: 3.0, vendas: 9 }
];

export const CommissionAnalytics: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('6m');
  const [selectedMetric, setSelectedMetric] = useState('comissoes');

  const handleExportData = () => {
    // Implementar exportação de dados
    console.log('Exporting analytics data...');
  };

  return (
    <div className="space-y-6">
      {/* Controles de filtro */}
      <div className="flex justify-between items-center">
        <div className="flex gap-4">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1m">Último mês</SelectItem>
              <SelectItem value="3m">Últimos 3 meses</SelectItem>
              <SelectItem value="6m">Últimos 6 meses</SelectItem>
              <SelectItem value="1y">Último ano</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedMetric} onValueChange={setSelectedMetric}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Métrica" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="comissoes">Valor de Comissões</SelectItem>
              <SelectItem value="configuracoes">Nº Configurações</SelectItem>
              <SelectItem value="vendedores">Vendedores Ativos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button variant="outline" onClick={handleExportData}>
          <Download className="h-4 w-4 mr-2" />
          Exportar Dados
        </Button>
      </div>

      {/* Gráfico principal - Performance temporal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Performance ao Longo do Tempo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 12 }}
                  tickLine={{ stroke: '#cbd5e1' }}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickLine={{ stroke: '#cbd5e1' }}
                  tickFormatter={(value) => 
                    selectedMetric === 'comissoes' ? `R$ ${(value / 1000).toFixed(0)}k` : value
                  }
                />
                <Tooltip 
                  formatter={(value, name) => [
                    selectedMetric === 'comissoes' 
                      ? `R$ ${Number(value).toLocaleString('pt-BR')}` 
                      : value,
                    name === 'comissoes' ? 'Comissões' :
                    name === 'configuracoes' ? 'Configurações' :
                    'Vendedores'
                  ]}
                  labelFormatter={(label) => `Mês: ${label}`}
                />
                <Line 
                  type="monotone" 
                  dataKey={selectedMetric}
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribuição por produto */}
        <Card>
          <CardHeader>
            <CardTitle>Comissões por Produto</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={commissionByProduct}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {commissionByProduct.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.cor} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value, name, props) => [
                      `${value}%`,
                      'Participação'
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="mt-4 space-y-2">
              {commissionByProduct.map((item, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: item.cor }}
                    />
                    <span>{item.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">R$ {(item.comissoes / 1000).toFixed(0)}k</div>
                    <div className="text-muted-foreground">{item.value}%</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top vendedores */}
        <Card>
          <CardHeader>
            <CardTitle>Top 5 Vendedores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topSellers} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    type="number" 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                  />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    tick={{ fontSize: 12 }}
                    width={100}
                  />
                  <Tooltip 
                    formatter={(value) => [`R$ ${Number(value).toLocaleString('pt-BR')}`, 'Comissões']}
                  />
                  <Bar 
                    dataKey="comissoes" 
                    fill="#10b981"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insights automáticos */}
      <Card>
        <CardHeader>
          <CardTitle>Insights Automáticos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-start gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-blue-900">Crescimento Consistente</h4>
                  <p className="text-sm text-blue-800 mt-1">
                    Comissões cresceram 58% nos últimos 6 meses
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-start gap-2">
                <Calendar className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-green-900">Alta Performance</h4>
                  <p className="text-sm text-green-800 mt-1">
                    João Silva lidera com taxa de 3.2% média
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="flex items-start gap-2">
                <Filter className="h-5 w-5 text-purple-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-purple-900">Oportunidade</h4>
                  <p className="text-sm text-purple-800 mt-1">
                    Consórcios Pesados têm menor participação
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};