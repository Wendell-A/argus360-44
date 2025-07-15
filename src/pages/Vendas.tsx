
import { useState } from "react";
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
import { Plus, Eye, Edit, Trash2, DollarSign, Calendar, TrendingUp, Users } from "lucide-react";
import { useSales } from "@/hooks/useSales";
import { useClients } from "@/hooks/useClients";
import { useVendedores } from "@/hooks/useVendedores";
import { useConsortiumProducts } from "@/hooks/useConsortiumProducts";
import SaleModal from "@/components/SaleModal";
import { Database } from "@/integrations/supabase/types";

type Sale = Database["public"]["Tables"]["sales"]["Row"];

export default function Vendas() {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  
  const { 
    sales, 
    isLoading, 
    createSale, 
    updateSale, 
    deleteSale,
    isCreating,
    isUpdating,
    isDeleting
  } = useSales();

  const { clients } = useClients();
  const { vendedores } = useVendedores();
  const { products } = useConsortiumProducts();

  const handleCreateSale = () => {
    setSelectedSale(null);
    setModalOpen(true);
  };

  const handleEditSale = (sale: Sale) => {
    setSelectedSale(sale);
    setModalOpen(true);
  };

  const handleSaveSale = (saleData: any) => {
    if (selectedSale) {
      updateSale({ id: selectedSale.id, updates: saleData });
    } else {
      createSale(saleData);
    }
    setModalOpen(false);
  };

  const handleDeleteSale = (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta venda?")) {
      deleteSale(id);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved': return 'Aprovada';
      case 'pending': return 'Pendente';
      case 'cancelled': return 'Cancelada';
      default: return 'Desconhecido';
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  // Calcular métricas
  const totalSales = sales.length;
  const approvedSales = sales.filter(s => s.status === 'approved').length;
  const totalValue = sales.reduce((sum, sale) => sum + (sale.sale_value || 0), 0);
  const totalCommissions = sales.reduce((sum, sale) => sum + (sale.commission_amount || 0), 0);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div>Carregando vendas...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4 sm:p-6 lg:p-8 w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 lg:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">Vendas</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">Gerencie suas vendas e acompanhe o desempenho</p>
          </div>
          <Button 
            onClick={handleCreateSale}
            className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Venda
          </Button>
        </div>

        {/* Cards de métricas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6 lg:mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Total de Vendas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalSales}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Vendas Aprovadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{approvedSales}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Valor Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{formatCurrency(totalValue)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Comissões Totais
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(totalCommissions)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabela de vendas */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Lista de Vendas</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[120px]">Data</TableHead>
                    <TableHead className="min-w-[150px]">Cliente</TableHead>
                    <TableHead className="min-w-[150px]">Vendedor</TableHead>
                    <TableHead className="min-w-[150px]">Produto</TableHead>
                    <TableHead className="min-w-[120px]">Valor</TableHead>
                    <TableHead className="min-w-[120px]">Comissão</TableHead>
                    <TableHead className="min-w-[100px]">Status</TableHead>
                    <TableHead className="min-w-[150px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sales.map((sale) => {
                    const client = clients.find(c => c.id === sale.client_id);
                    const vendedor = vendedores.find(v => v.id === sale.seller_id);
                    const product = products.find(p => p.id === sale.product_id);
                    
                    return (
                      <TableRow key={sale.id} className="hover:bg-gray-50">
                        <TableCell>
                          {formatDate(sale.sale_date)}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{client?.name || 'Cliente não encontrado'}</p>
                            <p className="text-sm text-gray-600">{client?.document}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{vendedor?.full_name || vendedor?.email || 'Vendedor não encontrado'}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{product?.name || 'Produto não encontrado'}</p>
                            <p className="text-sm text-gray-600">{product?.category}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">{formatCurrency(sale.sale_value)}</span>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium text-green-600">
                            {formatCurrency(sale.commission_amount)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="secondary"
                            className={getStatusColor(sale.status || '')}
                          >
                            {getStatusText(sale.status || '')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col sm:flex-row gap-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleEditSale(sale)}
                              disabled={isUpdating}
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleDeleteSale(sale.id)}
                              disabled={isDeleting}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Modal */}
        <SaleModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          sale={selectedSale}
          onSave={handleSaveSale}
          isLoading={isCreating || isUpdating}
        />
      </div>
    </div>
  );
}
