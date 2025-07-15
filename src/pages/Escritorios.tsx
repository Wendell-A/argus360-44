
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
import { Plus, Building, MapPin, Phone, Edit, Trash2 } from "lucide-react";
import { useOffices } from "@/hooks/useOffices";
import OfficeModal from "@/components/OfficeModal";
import { Database } from "@/integrations/supabase/types";

type Office = Database["public"]["Tables"]["offices"]["Row"];

export default function Escritorios() {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedOffice, setSelectedOffice] = useState<Office | null>(null);
  
  const { 
    offices, 
    isLoading, 
    createOffice, 
    updateOffice, 
    deleteOffice,
    isCreating,
    isUpdating,
    isDeleting
  } = useOffices();

  const handleCreateOffice = () => {
    setSelectedOffice(null);
    setModalOpen(true);
  };

  const handleEditOffice = (office: Office) => {
    setSelectedOffice(office);
    setModalOpen(true);
  };

  const handleSaveOffice = (officeData: any) => {
    if (selectedOffice) {
      updateOffice({ id: selectedOffice.id, updates: officeData });
    } else {
      createOffice(officeData);
    }
    setModalOpen(false);
  };

  const handleDeleteOffice = (id: string) => {
    if (confirm("Tem certeza que deseja excluir este escritório?")) {
      deleteOffice(id);
    }
  };

  const getOfficeTypeLabel = (type: string) => {
    const types = {
      matriz: "Matriz",
      filial: "Filial", 
      representacao: "Representação"
    };
    return types[type as keyof typeof types] || type;
  };

  const getParentOfficeName = (parentId: string | null) => {
    if (!parentId) return "-";
    const parent = offices.find(o => o.id === parentId);
    return parent?.name || "-";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div>Carregando escritórios...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4 sm:p-6 lg:p-8 w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 lg:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">Escritórios</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">Gerencie sua rede de escritórios</p>
          </div>
          <Button 
            onClick={handleCreateOffice}
            className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Escritório
          </Button>
        </div>

        {/* Cards resumo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6 lg:mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Escritórios</CardTitle>
              <Building className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{offices.length}</div>
              <p className="text-xs text-gray-600 mt-1">
                {offices.filter(o => o.active).length} ativos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Matrizes</CardTitle>
              <Building className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {offices.filter(o => o.type === 'matriz').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Filiais</CardTitle>
              <Building className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {offices.filter(o => o.type === 'filial').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Representações</CardTitle>
              <Building className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {offices.filter(o => o.type === 'representacao').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabela de escritórios */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Lista de Escritórios</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[200px]">Nome</TableHead>
                    <TableHead className="min-w-[100px]">Tipo</TableHead>
                    <TableHead className="min-w-[150px]">Escritório Pai</TableHead>
                    <TableHead className="min-w-[200px]">Endereço</TableHead>
                    <TableHead className="min-w-[150px]">Contato</TableHead>
                    <TableHead className="min-w-[100px]">Status</TableHead>
                    <TableHead className="min-w-[150px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {offices.map((office) => {
                    const address = office.address as any || {};
                    const contact = office.contact as any || {};
                    
                    return (
                      <TableRow key={office.id} className="hover:bg-gray-50">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Building className="w-4 h-4 text-blue-600" />
                            <div>
                              <p className="font-medium">{office.name}</p>
                              {office.cnpj && (
                                <p className="text-sm text-gray-600">CNPJ: {office.cnpj}</p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <Badge 
                            variant="outline" 
                            className={
                              office.type === 'matriz' 
                                ? "bg-green-50 text-green-700 border-green-200" 
                                : office.type === 'filial'
                                ? "bg-orange-50 text-orange-700 border-orange-200"
                                : "bg-purple-50 text-purple-700 border-purple-200"
                            }
                          >
                            {getOfficeTypeLabel(office.type || '')}
                          </Badge>
                        </TableCell>
                        
                        <TableCell>
                          {getParentOfficeName(office.parent_office_id)}
                        </TableCell>
                        
                        <TableCell>
                          <div className="space-y-1">
                            {address.city && address.state && (
                              <div className="flex items-center gap-1 text-sm">
                                <MapPin className="w-3 h-3" />
                                {address.city}, {address.state}
                              </div>
                            )}
                            {address.zip_code && (
                              <p className="text-sm text-gray-600">CEP: {address.zip_code}</p>
                            )}
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <div className="space-y-1">
                            {contact.phone && (
                              <div className="flex items-center gap-1 text-sm">
                                <Phone className="w-3 h-3" />
                                {contact.phone}
                              </div>
                            )}
                            {contact.email && (
                              <p className="text-sm text-gray-600">{contact.email}</p>
                            )}
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <Badge 
                            variant={office.active ? "default" : "secondary"}
                            className={office.active ? "bg-green-100 text-green-800" : ""}
                          >
                            {office.active ? "Ativo" : "Inativo"}
                          </Badge>
                        </TableCell>
                        
                        <TableCell>
                          <div className="flex flex-col sm:flex-row gap-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleEditOffice(office)}
                              disabled={isUpdating}
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleDeleteOffice(office.id)}
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
        <OfficeModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          office={selectedOffice}
          offices={offices}
          onSave={handleSaveOffice}
          isLoading={isCreating || isUpdating}
        />
      </div>
    </div>
  );
}
