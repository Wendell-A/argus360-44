
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
import { Database } from "@/integrations/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export default function Vendedores() {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedVendedor, setSelectedVendedor] = useState<Profile | null>(null);
  
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

  const handleDeleteVendedor = (id: string) => {
    if (confirm("Tem certeza que deseja desativar este vendedor?")) {
      deleteVendedor(id);
    }
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
        <div>Carregando vendedores...</div>
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
      <div className="p-4 sm:p-6 lg:p-8 w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 lg:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">Vendedores</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">Gerencie sua equipe de vendas</p>
          </div>
          <Button 
            onClick={handleCreateVendedor}
            className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Vendedor
          </Button>
        </div>

        {/* Cards resumo */}
        <VendedorStats
          totalVendedores={vendedores.length}
          activeVendedores={activeVendedores.length}
          totalCommissions={totalCommissions}
          totalSales={totalSales}
        />

        {/* Tabela de vendedores */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Lista de Vendedores</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
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
                          <div className="flex flex-col sm:flex-row gap-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleEditVendedor(vendedor)}
                              disabled={isUpdating}
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleDeleteVendedor(vendedor.id)}
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
        <VendedorModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          vendedor={selectedVendedor}
          onSave={handleSaveVendedor}
          isLoading={isCreating || isUpdating}
        />
      </div>
    </div>
  );
}
