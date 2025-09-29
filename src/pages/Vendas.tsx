
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Edit, Trash2, CheckCircle, X } from "lucide-react";
import SaleModal from "@/components/SaleModal";
import SalesFilters, { SalesFilterValues } from "@/components/SalesFilters";
import { useSales, useCreateSale, useUpdateSale, useDeleteSale } from "@/hooks/useSales";
import { useToast } from "@/hooks/use-toast";

export default function Vendas() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [saleToDelete, setSaleToDelete] = useState(null);
  const [filters, setFilters] = useState<SalesFilterValues>({});

  const { sales, isLoading } = useSales();
  const { createSaleAsync, isCreating } = useCreateSale();
  const { updateSaleAsync, isUpdating } = useUpdateSale();
  const { deleteSaleAsync, isDeleting } = useDeleteSale();
  
  const { toast } = useToast();

  // Aplicar filtros às vendas
  const filteredSales = useMemo(() => {
    if (!sales) return [];
    
    return sales.filter((sale) => {
      // Filtro por nome do cliente
      if (filters.clientName && !sale.clients?.name?.toLowerCase().includes(filters.clientName.toLowerCase())) {
        return false;
      }
      
      // Filtro por nome do produto
      if (filters.productName && !sale.consortium_products?.name?.toLowerCase().includes(filters.productName.toLowerCase())) {
        return false;
      }
      
      // Filtro por status
      if (filters.status && filters.status !== "all" && sale.status !== filters.status) {
        return false;
      }
      
      // Filtro por data de início
      if (filters.dateFrom && sale.sale_date && new Date(sale.sale_date) < new Date(filters.dateFrom)) {
        return false;
      }
      
      // Filtro por data de fim
      if (filters.dateTo && sale.sale_date && new Date(sale.sale_date) > new Date(filters.dateTo)) {
        return false;
      }
      
      // Filtro por pendências
      if (filters.pendingAta && sale.ata) {
        return false;
      }
      
      if (filters.pendingProposta && sale.proposta) {
        return false;
      }
      
      if (filters.pendingCodGrupo && sale.cod_grupo) {
        return false;
      }
      
      if (filters.pendingCota && sale.cota) {
        return false;
      }
      
      return true;
    });
  }, [sales, filters]);

  const handleCreateSale = () => {
    setSelectedSale(null);
    setIsModalOpen(true);
  };

  const handleEditSale = (sale) => {
    setSelectedSale(sale);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (sale) => {
    setSaleToDelete(sale);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!saleToDelete) return;

    try {
      await deleteSaleAsync(saleToDelete.id);
      toast({
        title: "Venda excluída",
        description: "A venda foi excluída com sucesso.",
      });
      setDeleteDialogOpen(false);
      setSaleToDelete(null);
    } catch (error) {
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir a venda. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleApproveSale = async (sale) => {
    try {
      await updateSaleAsync({ 
        id: sale.id, 
        status: 'approved',
        approval_date: new Date().toISOString().split('T')[0]
      });
      toast({
        title: "Venda aprovada",
        description: "A venda foi aprovada e as comissões foram geradas automaticamente.",
      });
    } catch (error) {
      toast({
        title: "Erro ao aprovar",
        description: "Não foi possível aprovar a venda. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleCancelSale = async (sale) => {
    try {
      await updateSaleAsync({ 
        id: sale.id, 
        status: 'cancelled',
        cancellation_date: new Date().toISOString().split('T')[0]
      });
      toast({
        title: "Venda cancelada",
        description: "A venda foi cancelada com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro ao cancelar",
        description: "Não foi possível cancelar a venda. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleSave = async (data) => {
    try {
      if (selectedSale) {
        await updateSaleAsync({ id: selectedSale.id, ...data });
        toast({
          title: "Venda atualizada",
          description: "A venda foi atualizada com sucesso.",
        });
      } else {
        await createSaleAsync(data);
        toast({
          title: "Venda criada",
          description: "A venda foi criada com sucesso.",
        });
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error('Erro ao salvar venda:', error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar a venda. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { label: "Pendente", variant: "secondary" },
      approved: { label: "Aprovada", variant: "default" },
      cancelled: { label: "Cancelada", variant: "destructive" },
    };

    const config = statusConfig[status] || statusConfig.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getDocumentationStatus = (sale) => {
    const pending = [];
    if (!sale.ata) pending.push("Ata");
    if (!sale.proposta) pending.push("Proposta");
    if (!sale.cod_grupo) pending.push("Cód. Grupo");
    if (!sale.cota) pending.push("Cota");
    
    if (pending.length === 0) {
      return <Badge variant="default" className="bg-green-600">Completo</Badge>;
    }
    
    return (
      <div className="flex flex-wrap gap-1">
        {pending.map((doc) => (
          <Badge key={doc} variant="secondary" className="text-xs">
            {doc} Pendente
          </Badge>
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Carregando vendas...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Vendas</h1>
          <p className="text-muted-foreground">Gerencie as vendas do sistema</p>
        </div>
        <Button onClick={handleCreateSale}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Venda
        </Button>
      </div>

      <SalesFilters onFilterChange={setFilters} />

      <Card>
        <CardHeader>
          <CardTitle>Lista de Vendas</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredSales.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {sales.length === 0 ? "Nenhuma venda encontrada" : "Nenhuma venda corresponde aos filtros"}
              </p>
              {sales.length === 0 && (
                <Button onClick={handleCreateSale} className="mt-4">
                  <Plus className="mr-2 h-4 w-4" />
                  Criar primeira venda
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Comissão</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Status da Documentação</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell>
                      {sale.clients?.name || 'Cliente não encontrado'}
                    </TableCell>
                    <TableCell>
                      {sale.consortium_products?.name || 'Produto não encontrado'}
                    </TableCell>
                    <TableCell>{formatCurrency(sale.sale_value)}</TableCell>
                    <TableCell>
                      {formatCurrency(sale.commission_amount)} ({sale.commission_rate}%)
                    </TableCell>
                    <TableCell>{formatDate(sale.sale_date)}</TableCell>
                    <TableCell>{getStatusBadge(sale.status)}</TableCell>
                    <TableCell>{getDocumentationStatus(sale)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditSale(sale)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        
                        {sale.status === 'pending' && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleApproveSale(sale)}
                              className="text-green-600 hover:text-green-700"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCancelSale(sale)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteClick(sale)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <SaleModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        sale={selectedSale}
        onSave={handleSave}
        isLoading={isCreating || isUpdating}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza de que deseja excluir esta venda? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
