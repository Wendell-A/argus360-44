
import { useState } from "react";
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
import { Plus, Edit, Trash2 } from "lucide-react";
import SaleModal from "@/components/SaleModal";
import { useSales, useCreateSale, useUpdateSale, useDeleteSale } from "@/hooks/useSales";
import { useClients } from "@/hooks/useClients";
import { useToast } from "@/hooks/use-toast";

export default function Vendas() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [saleToDelete, setSaleToDelete] = useState(null);

  const { sales, isLoading } = useSales();
  const { clients } = useClients();
  const { createSaleAsync, isCreating } = useCreateSale();
  const { updateSaleAsync, isUpdating } = useUpdateSale();
  const { deleteSaleAsync, isDeleting } = useDeleteSale();
  
  const { toast } = useToast();

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
    }).format(value);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
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

      <Card>
        <CardHeader>
          <CardTitle>Lista de Vendas</CardTitle>
        </CardHeader>
        <CardContent>
          {sales.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Nenhuma venda encontrada</p>
              <Button onClick={handleCreateSale} className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Criar primeira venda
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell>
                      {sale.clients?.name || 'Cliente não encontrado'}
                    </TableCell>
                    <TableCell>
                      {sale.consortium_products?.name || 'Produto não encontrado'}
                    </TableCell>
                    <TableCell>{formatCurrency(sale.sale_value)}</TableCell>
                    <TableCell>{formatDate(sale.sale_date)}</TableCell>
                    <TableCell>{getStatusBadge(sale.status)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditSale(sale)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
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
