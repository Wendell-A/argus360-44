
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Plus, Mail, Phone, Edit, Trash2 } from "lucide-react";
import { useVendedores } from "@/hooks/useVendedores";
import VendedorModal from "@/components/VendedorModal";
import VendedorStats from "@/components/VendedorStats";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Database } from "@/integrations/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export default function Vendedores() {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedVendedor, setSelectedVendedor] = useState<Profile | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{
    isOpen: boolean;
    vendedorId: string;
    vendedorName: string;
  }>({
    isOpen: false,
    vendedorId: '',
    vendedorName: ''
  });
  
  const { 
    vendedores, 
    isLoading, 
    createVendedor, 
    updateVendedor, 
    deleteVendedor,
    isCreating,
    isUpdating,
    isDeleting
  } = useVendedores();

  const handleCreateVendedor = () => {
    setSelectedVendedor(null);
    setModalOpen(true);
  };

  const handleEditVendedor = (vendedor: Profile) => {
    setSelectedVendedor(vendedor);
    setModalOpen(true);
  };

  const handleSaveVendedor = (vendedorData: any) => {
    if (selectedVendedor) {
      updateVendedor({ id: selectedVendedor.id, updates: vendedorData });
    } else {
      createVendedor(vendedorData);
    }
    setModalOpen(false);
  };

  const handleDeleteVendedor = (id: string, name: string) => {
    setConfirmDelete({
      isOpen: true,
      vendedorId: id,
      vendedorName: name
    });
  };

  const confirmDeleteVendedor = () => {
    deleteVendedor(confirmDelete.vendedorId);
    setConfirmDelete({ isOpen: false, vendedorId: '', vendedorName: '' });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando vendedores...</p>
        </div>
      </div>
    );
  }

  const activeVendedores = vendedores.filter(v => {
    const settings = v.settings as any || {};
    return settings.active !== false;
  });

  const totalCommissions = vendedores.reduce((sum, v) => sum + ((v as any).commission_total || 0), 0);
  const totalSales = vendedores.reduce((sum, v) => sum + ((v as any).sales_count || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-3 sm:p-4 md:p-6 lg:p-8 w-full">
        {/* Header - Mobile Optimized */}
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 mb-6 lg:mb-8">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900">Vendedores</h1>
            <p className="text-xs sm:text-sm md:text-base text-gray-600 mt-1">Gerencie sua equipe de vendas</p>
          </div>
          <Button 
            onClick={handleCreateVendedor}
            className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto min-h-[44px] touch-manipulation"
            size="lg"
          >
            <Plus className="w-4 h-4 mr-2" />
            <span className="text-sm sm:text-base">Novo Vendedor</span>
          </Button>
        </div>

        {/* Cards resumo */}
        <VendedorStats
          totalVendedores={vendedores.length}
          activeVendedores={activeVendedores.length}
          totalCommissions={totalCommissions}
          totalSales={totalSales}
        />

        {/* Tabela de vendedores - Mobile Responsive */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm sm:text-base md:text-lg">Lista de Vendedores</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {/* Mobile Cards View for small screens */}
            <div className="block sm:hidden">
              <div className="space-y-3 p-4">
                {vendedores.map((vendedor) => {
                  const settings = vendedor.settings as any || {};
                  const isActive = settings.active !== false;
                  const vendedorData = vendedor as any;
                  
                  return (
                    <Card key={vendedor.id} className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-blue-100 text-blue-600 text-sm">
                              {getInitials(vendedor.full_name || vendedor.email)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">{vendedor.full_name || vendedor.email}</p>
                            <p className="text-xs text-gray-600">{vendedor.position || "Vendedor"}</p>
                          </div>
                        </div>
                        <Badge 
                          variant={isActive ? "default" : "secondary"}
                          className={`text-xs ${isActive ? "bg-green-100 text-green-800" : ""}`}
                        >
                          {isActive ? "Ativo" : "Inativo"}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2 mb-3">
                        <div className="flex items-center gap-1 text-xs">
                          <Mail className="w-3 h-3" />
                          <span className="truncate">{vendedor.email}</span>
                        </div>
                        {vendedor.phone && (
                          <div className="flex items-center gap-1 text-xs">
                            <Phone className="w-3 h-3" />
                            {vendedor.phone}
                          </div>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mb-3 text-xs">
                        <div>
                          <p className="text-gray-500">Vendas</p>
                          <p className="font-medium">{vendedorData.sales_count || 0}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Comissões</p>
                          <p className="font-medium text-green-600">
                            {formatCurrency(vendedorData.commission_total || 0)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleEditVendedor(vendedor)}
                          disabled={isUpdating}
                          className="flex-1 min-h-[40px] touch-manipulation"
                        >
                          <Edit className="w-3 h-3 mr-1" />
                          Editar
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDeleteVendedor(vendedor.id, vendedor.full_name || vendedor.email)}
                          disabled={isDeleting}
                          className="flex-1 min-h-[40px] touch-manipulation"
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          Excluir
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[200px]">Vendedor</TableHead>
                    <TableHead className="min-w-[250px]">Contato</TableHead>
                    <TableHead className="min-w-[100px]">Vendas</TableHead>
                    <TableHead className="min-w-[120px]">Comissões</TableHead>
                    <TableHead className="min-w-[100px]">Departamento</TableHead>
                    <TableHead className="min-w-[80px]">Status</TableHead>
                    <TableHead className="min-w-[150px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vendedores.map((vendedor) => {
                    const settings = vendedor.settings as any || {};
                    const isActive = settings.active !== false;
                    const vendedorData = vendedor as any;
                    
                    return (
                      <TableRow key={vendedor.id} className="hover:bg-gray-50">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarFallback className="bg-blue-100 text-blue-600">
                                {getInitials(vendedor.full_name || vendedor.email)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{vendedor.full_name || vendedor.email}</p>
                              <p className="text-sm text-gray-600">{vendedor.position || "Vendedor"}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-sm">
                              <Mail className="w-3 h-3" />
                              {vendedor.email}
                            </div>
                            {vendedor.phone && (
                              <div className="flex items-center gap-1 text-sm">
                                <Phone className="w-3 h-3" />
                                {vendedor.phone}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">{vendedorData.sales_count || 0}</span>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium text-green-600">
                            {formatCurrency(vendedorData.commission_total || 0)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{vendedor.department || "-"}</span>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={isActive ? "default" : "secondary"}
                            className={isActive ? "bg-green-100 text-green-800" : ""}
                          >
                            {isActive ? "Ativo" : "Inativo"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleEditVendedor(vendedor)}
                              disabled={isUpdating}
                              className="min-h-[36px] touch-manipulation"
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleDeleteVendedor(vendedor.id, vendedor.full_name || vendedor.email)}
                              disabled={isDeleting}
                              className="min-h-[36px] touch-manipulation"
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
        <VendedorModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          vendedor={selectedVendedor}
          onSave={handleSaveVendedor}
          isLoading={isCreating || isUpdating}
        />

        {/* Confirm Delete Dialog */}
        <ConfirmDialog
          isOpen={confirmDelete.isOpen}
          onClose={() => setConfirmDelete({ isOpen: false, vendedorId: '', vendedorName: '' })}
          onConfirm={confirmDeleteVendedor}
          title="Confirmar Exclusão"
          description={`Tem certeza que deseja desativar o vendedor "${confirmDelete.vendedorName}"? Esta ação pode ser revertida posteriormente.`}
          confirmText="Desativar"
          variant="destructive"
          isLoading={isDeleting}
        />
      </div>
    </div>
  );
}
