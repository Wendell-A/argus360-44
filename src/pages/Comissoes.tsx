
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
  TableRow 
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { 
  Search, 
  Filter, 
  CheckCircle, 
  DollarSign,
  Calendar,
  User,
} from "lucide-react";
import { useCommissions, useApproveCommission, usePayCommission } from "@/hooks/useCommissions";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const Comissoes = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [paymentReference, setPaymentReference] = useState("");
  const [selectedCommission, setSelectedCommission] = useState<any>(null);

  const { commissions, isLoading } = useCommissions();
  const { approveCommissionAsync, isApproving } = useApproveCommission();
  const { payCommissionAsync, isPaying } = usePayCommission();

  const filteredCommissions = commissions.filter((commission) => {
    const matchesSearch = commission.recipient_id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || commission.status === statusFilter;
    
    let matchesDate = true;
    if (dateFilter === "vencidas") {
      matchesDate = new Date(commission.due_date) < new Date() && commission.status === 'pending';
    } else if (dateFilter === "este_mes") {
      const today = new Date();
      const commissionDate = new Date(commission.due_date);
      matchesDate = commissionDate.getMonth() === today.getMonth() && 
                   commissionDate.getFullYear() === today.getFullYear();
    }
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: "Pendente", variant: "secondary" as const },
      approved: { label: "Aprovada", variant: "default" as const },
      paid: { label: "Paga", variant: "default" as const },
      cancelled: { label: "Cancelada", variant: "destructive" as const },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const handleApprove = async (commissionId: string) => {
    if (window.confirm("Tem certeza que deseja aprovar esta comissão?")) {
      await approveCommissionAsync(commissionId);
    }
  };

  const handlePayment = async () => {
    if (!selectedCommission || !paymentMethod) return;
    
    await payCommissionAsync({
      commissionId: selectedCommission.id,
      paymentMethod,
      paymentReference,
    });
    
    setSelectedCommission(null);
    setPaymentMethod("");
    setPaymentReference("");
  };

  const totalCommissions = filteredCommissions.reduce((sum, comm) => sum + comm.commission_amount, 0);
  const pendingCommissions = filteredCommissions.filter(c => c.status === 'pending').length;
  const approvedCommissions = filteredCommissions.filter(c => c.status === 'approved').length;
  const paidCommissions = filteredCommissions.filter(c => c.status === 'paid').length;

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center">Carregando comissões...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Comissões</h1>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Comissões</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {totalCommissions.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCommissions}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aprovadas</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvedCommissions}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pagas</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{paidCommissions}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por vendedor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="approved">Aprovada</SelectItem>
                <SelectItem value="paid">Paga</SelectItem>
                <SelectItem value="cancelled">Cancelada</SelectItem>
              </SelectContent>
            </Select>

            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Períodos</SelectItem>
                <SelectItem value="este_mes">Este Mês</SelectItem>
                <SelectItem value="vencidas">Vencidas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Comissões */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Comissões</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vendedor</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Valor Base</TableHead>
                <TableHead>Taxa (%)</TableHead>
                <TableHead>Valor Comissão</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCommissions.map((commission) => (
                <TableRow key={commission.id}>
                  <TableCell>{commission.recipient_id}</TableCell>
                  <TableCell>
                    {commission.sales?.clients?.name || 'N/A'}
                  </TableCell>
                  <TableCell>
                    R$ {commission.base_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell>{commission.commission_rate}%</TableCell>
                  <TableCell>
                    R$ {commission.commission_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell>
                    {format(new Date(commission.due_date), "dd/MM/yyyy", { locale: ptBR })}
                  </TableCell>
                  <TableCell>{getStatusBadge(commission.status || 'pending')}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {commission.status === 'pending' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleApprove(commission.id)}
                          disabled={isApproving}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Aprovar
                        </Button>
                      )}
                      
                      {commission.status === 'approved' && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              onClick={() => setSelectedCommission(commission)}
                            >
                              <DollarSign className="h-4 w-4 mr-1" />
                              Pagar
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Registrar Pagamento</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label htmlFor="paymentMethod">Método de Pagamento</Label>
                                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione o método" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="pix">PIX</SelectItem>
                                    <SelectItem value="transferencia">Transferência</SelectItem>
                                    <SelectItem value="dinheiro">Dinheiro</SelectItem>
                                    <SelectItem value="cheque">Cheque</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              
                              <div>
                                <Label htmlFor="paymentReference">Referência do Pagamento</Label>
                                <Input
                                  id="paymentReference"
                                  placeholder="Ex: Número da transação, cheque..."
                                  value={paymentReference}
                                  onChange={(e) => setPaymentReference(e.target.value)}
                                />
                              </div>
                              
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedCommission(null);
                                    setPaymentMethod("");
                                    setPaymentReference("");
                                  }}
                                >
                                  Cancelar
                                </Button>
                                <Button
                                  onClick={handlePayment}
                                  disabled={isPaying || !paymentMethod}
                                >
                                  {isPaying ? "Registrando..." : "Registrar Pagamento"}
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Comissoes;
