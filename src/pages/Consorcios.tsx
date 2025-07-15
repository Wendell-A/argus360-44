
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Car, Home, Wrench, Calculator } from "lucide-react";
import { useConsortiumProducts } from "@/hooks/useConsortiumProducts";
import { ConsortiumTableRow } from "@/components/ConsortiumCard";

export default function Consorcios() {
  const { data: products, isLoading, error } = useConsortiumProducts();

  console.log('Produtos carregados:', products);

  if (isLoading) {
    return (
      <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
        <div className="flex items-center justify-center">
          <p>Carregando produtos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    console.error('Erro ao carregar produtos:', error);
    return (
      <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
        <div className="flex items-center justify-center">
          <p className="text-red-600">Erro ao carregar produtos: {error.message}</p>
        </div>
      </div>
    );
  }

  const productsData = products || [];
  
  // Cálculos baseados nos dados reais
  const activeProducts = productsData.filter(p => p.status === 'active');
  const totalAssetValue = productsData.reduce((sum, p) => sum + p.asset_value, 0);
  const averageCommission = productsData.length > 0 
    ? productsData.reduce((sum, p) => sum + p.commission_rate, 0) / productsData.length 
    : 0;
  
  // Simulando cotas vendidas para as métricas - depois podemos implementar isso adequadamente
  const totalCotas = productsData.length * 100;
  const cotasVendidas = Math.floor(totalCotas * 0.7); // 70% vendidas em média

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Consórcios</h1>
          <p className="text-gray-600 mt-1">Configure as tabelas de consórcios e comissões</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Nova Tabela
        </Button>
      </div>

      {/* Cards resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tabelas Ativas</CardTitle>
            <Calculator className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeProducts.length}</div>
            <p className="text-xs text-blue-600 mt-1">{productsData.length} total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cotas Vendidas</CardTitle>
            <Car className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cotasVendidas}</div>
            <p className="text-xs text-green-600 mt-1">de {totalCotas} cotas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa Média</CardTitle>
            <Calculator className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageCommission.toFixed(1)}%</div>
            <p className="text-xs text-purple-600 mt-1">Comissão média</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <Home className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalAssetValue / 1000000)}M</div>
            <p className="text-xs text-orange-600 mt-1">Em consórcios ativos</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de consórcios */}
      <Card>
        <CardHeader>
          <CardTitle>Tabelas de Consórcios</CardTitle>
        </CardHeader>
        <CardContent>
          {productsData.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Nenhum produto encontrado.</p>
              <p className="text-gray-400 text-sm mt-1">Clique em "Nova Tabela" para adicionar o primeiro produto.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo/Categoria</TableHead>
                  <TableHead>Valor do Bem</TableHead>
                  <TableHead>Prazo</TableHead>
                  <TableHead>Taxa Admin</TableHead>
                  <TableHead>Taxa Comissão</TableHead>
                  <TableHead>Cotas</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productsData.map((product) => (
                  <TableRow key={product.id} className="hover:bg-gray-50">
                    <ConsortiumTableRow product={product} />
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
