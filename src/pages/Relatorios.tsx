
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { BarChart3, TrendingUp, Users, DollarSign, FileDown, Calendar, Filter } from "lucide-react";
import { useSales } from "@/hooks/useSales";
import { useCommissions } from "@/hooks/useCommissions";
import { useClients } from "@/hooks/useClients";
import { useVendedores } from "@/hooks/useVendedores";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Relatorios() {
  const [selectedPeriod, setSelectedPeriod] = useState("thisMonth");
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [reportType, setReportType] = useState("sales");

  const { sales, isLoading: salesLoading } = useSales();
  const { commissions, isLoading: commissionsLoading } = useCommissions();
  const { clients, isLoading: clientsLoading } = useClients();
  const { vendedores, isLoading: vendedoresLoading } = useVendedores();

  // Cálculos de métricas baseados nos dados reais
  const totalSales = sales?.reduce((acc, sale) => acc + Number(sale.sale_value), 0) || 0;
  const approvedSales = sales?.filter(sale => sale.status === 'approved') || [];
  const pendingSales = sales?.filter(sale => sale.status === 'pending') || [];
  
  const totalCommissions = commissions?.reduce((acc, comm) => acc + Number(comm.commission_amount), 0) || 0;
  const paidCommissions = commissions?.filter(comm => comm.status === 'paid') || [];
  const pendingCommissions = commissions?.filter(comm => comm.status === 'pending') || [];

  const activeClients = clients?.filter(client => client.status === 'active') || [];
  const prospectClients = clients?.filter(client => client.status === 'prospect') || [];

  const activeVendedores = vendedores?.filter(vendedor => vendedor.active_status !== false) || [];

  // Função para exportar dados (placeholder)
  const handleExportReport = () => {
    console.log("Exportando relatório...");
    // TODO: Implementar exportação real
  };

  // Função para filtrar dados por período
  const filterByPeriod = (data: any[], dateField: string) => {
    if (!startDate || !endDate) return data;
    
    return data.filter(item => {
      const itemDate = new Date(item[dateField]);
      return itemDate >= startDate && itemDate <= endDate;
    });
  };

  const isLoading = salesLoading || commissionsLoading || clientsLoading || vendedoresLoading;

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Carregando relatórios...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Relatórios</h1>
          <p className="text-muted-foreground">
            Análise completa do desempenho do sistema
          </p>
        </div>
        <Button onClick={handleExportReport} className="flex items-center gap-2">
          <FileDown className="h-4 w-4" />
          Exportar
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Tipo de Relatório</label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sales">Vendas</SelectItem>
                  <SelectItem value="commissions">Comissões</SelectItem>
                  <SelectItem value="clients">Clientes</SelectItem>
                  <SelectItem value="performance">Performance</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Período</label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="thisMonth">Este Mês</SelectItem>
                  <SelectItem value="lastMonth">Mês Passado</SelectItem>
                  <SelectItem value="thisYear">Este Ano</SelectItem>
                  <SelectItem value="custom">Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {selectedPeriod === "custom" && (
              <>
                <div>
                  <label className="text-sm font-medium mb-2 block">Data Inicial</label>
                  <DatePicker date={startDate} setDate={setStartDate} />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Data Final</label>
                  <DatePicker date={endDate} setDate={setEndDate} />
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Métricas Gerais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Vendas</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
              }).format(totalSales)}
            </div>
            <p className="text-xs text-muted-foreground">
              {approvedSales.length} vendas aprovadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Comissões</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
              }).format(totalCommissions)}
            </div>
            <p className="text-xs text-muted-foreground">
              {paidCommissions.length} pagas de {commissions?.length || 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clients?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              {activeClients.length} ativos, {prospectClients.length} prospects
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vendedores</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vendedores?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              {activeVendedores.length} ativos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Relatórios Detalhados */}
      {reportType === "sales" && (
        <Card>
          <CardHeader>
            <CardTitle>Relatório de Vendas</CardTitle>
            <CardDescription>
              Detalhamento das vendas do período selecionado
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{approvedSales.length}</p>
                  <p className="text-sm text-muted-foreground">Vendas Aprovadas</p>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <p className="text-2xl font-bold text-yellow-600">{pendingSales.length}</p>
                  <p className="text-sm text-muted-foreground">Vendas Pendentes</p>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <p className="text-2xl font-bold">
                    {approvedSales.length > 0 ? 
                      Math.round((approvedSales.length / (sales?.length || 1)) * 100) : 0}%
                  </p>
                  <p className="text-sm text-muted-foreground">Taxa de Aprovação</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {reportType === "commissions" && (
        <Card>
          <CardHeader>
            <CardTitle>Relatório de Comissões</CardTitle>
            <CardDescription>
              Análise das comissões por status e período
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{paidCommissions.length}</p>
                  <p className="text-sm text-muted-foreground">Comissões Pagas</p>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <p className="text-2xl font-bold text-yellow-600">{pendingCommissions.length}</p>
                  <p className="text-sm text-muted-foreground">Comissões Pendentes</p>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <p className="text-2xl font-bold">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    }).format(
                      paidCommissions.reduce((acc, comm) => acc + Number(comm.commission_amount), 0)
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Pago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {reportType === "clients" && (
        <Card>
          <CardHeader>
            <CardTitle>Relatório de Clientes</CardTitle>
            <CardDescription>
              Distribuição e análise da base de clientes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{activeClients.length}</p>
                  <p className="text-sm text-muted-foreground">Clientes Ativos</p>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{prospectClients.length}</p>
                  <p className="text-sm text-muted-foreground">Prospects</p>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <p className="text-2xl font-bold">
                    {activeClients.length > 0 ? 
                      Math.round((activeClients.length / (clients?.length || 1)) * 100) : 0}%
                  </p>
                  <p className="text-sm text-muted-foreground">Taxa de Conversão</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
