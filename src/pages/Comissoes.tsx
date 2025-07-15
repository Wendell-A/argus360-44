
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Search, 
  Filter, 
  DollarSign, 
  TrendingUp, 
  Clock, 
  CheckCircle,
  AlertCircle,
  Calendar,
  Download
} from "lucide-react";
import { useCommissions } from "@/hooks/useCommissions";

export default function Comissoes() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");

  const { commissions, isLoading } = useCommissions();

  const filteredCommissions = commissions.filter((commission) => {
    const matchesSearch = commission.recipient_id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || commission.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const metrics = {
    total: commissions.reduce((sum, c) => sum + c.commission_amount, 0),
    pending: commissions.filter(c => c.status === 'pending').reduce((sum, c) => sum + c.commission_amount, 0),
    paid: commissions.filter(c => c.status === 'paid').reduce((sum, c) => sum + c.commission_amount, 0),
    overdue: commissions.filter(c => c.status === 'overdue').reduce((sum, c) => sum + c.commission_amount, 0)
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      case 'approved': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <CheckCircle className="w-3 h-3" />;
      case 'pending': return <Clock className="w-3 h-3" />;
      case 'overdue': return <AlertCircle className="w-3 h-3" />;
      default: return <Clock className="w-3 h-3" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4 sm:p-6 lg:p-8 w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 lg:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">Comissões</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">Gerencie pagamentos e comissões</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" className="w-full sm:w-auto">
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
              <DollarSign className="w-4 h-4 mr-2" />
              Processar Pagamentos
            </Button>
          </div>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6 lg:mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total em Comissões</CardTitle>
              <DollarSign className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R$ {(metrics.total / 1000).toFixed(1)}k
              </div>
              <p className="text-xs text-gray-600 mt-1">Este mês</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R$ {(metrics.pending / 1000).toFixed(1)}k
              </div>
              <p className="text-xs text-yellow-600 mt-1">Aguardando pagamento</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pagas</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R$ {(metrics.paid / 1000).toFixed(1)}k
              </div>
              <p className="text-xs text-green-600 mt-1">Já processadas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Em Atraso</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R$ {(metrics.overdue / 1000).toFixed(1)}k
              </div>
              <p className="text-xs text-red-600 mt-1">Vencidas</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6 lg:mb-8">
          <CardContent className="pt-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por vendedor ou ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Status</SelectItem>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="approved">Aprovado</SelectItem>
                    <SelectItem value="paid">Pago</SelectItem>
                    <SelectItem value="overdue">Em Atraso</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Período" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Períodos</SelectItem>
                    <SelectItem value="today">Hoje</SelectItem>
                    <SelectItem value="week">Esta Semana</SelectItem>
                    <SelectItem value="month">Este Mês</SelectItem>
                    <SelectItem value="quarter">Este Trimestre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Commissions Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Lista de Comissões</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex justify-center items-center h-32">
                <div className="text-gray-500">Carregando comissões...</div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[120px]">ID</TableHead>
                      <TableHead className="min-w-[150px]">Vendedor</TableHead>
                      <TableHead className="min-w-[120px]">Valor Base</TableHead>
                      <TableHead className="min-w-[100px]">Taxa</TableHead>
                      <TableHead className="min-w-[120px]">Comissão</TableHead>
                      <TableHead className="min-w-[120px]">Vencimento</TableHead>
                      <TableHead className="min-w-[100px]">Status</TableHead>
                      <TableHead className="min-w-[150px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCommissions.map((commission) => (
                      <TableRow key={commission.id} className="hover:bg-gray-50">
                        <TableCell>
                          <span className="font-mono text-sm">
                            {commission.id.substring(0, 8)}...
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">
                            {commission.recipient_id.substring(0, 8)}...
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono">
                            R$ {commission.base_amount.toLocaleString('pt-BR', {
                              minimumFractionDigits: 2
                            })}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">
                            {commission.commission_rate}%
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono font-medium text-green-600">
                            R$ {commission.commission_amount.toLocaleString('pt-BR', {
                              minimumFractionDigits: 2
                            })}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-gray-400" />
                            <span className="text-sm">
                              {new Date(commission.due_date).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(commission.status || 'pending')}>
                            <div className="flex items-center gap-1">
                              {getStatusIcon(commission.status || 'pending')}
                              {commission.status || 'pending'}
                            </div>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col sm:flex-row gap-2">
                            <Button variant="outline" size="sm" className="text-xs">
                              Ver Detalhes
                            </Button>
                            {(commission.status === 'pending' || commission.status === 'approved') && (
                              <Button variant="outline" size="sm" className="text-xs text-green-600">
                                Pagar
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
