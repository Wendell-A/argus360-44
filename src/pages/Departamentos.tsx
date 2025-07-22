
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Edit, Trash2, FileTemplate } from "lucide-react";
import DepartmentModal from "@/components/DepartmentModal";
import DepartmentTemplateModal from "@/components/DepartmentTemplateModal";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useDepartments, useCreateDepartment, useUpdateDepartment, useDeleteDepartment } from "@/hooks/useDepartments";
import { FilterBar } from "@/components/FilterBar";
import { useAdvancedFilters } from "@/hooks/useAdvancedFilters";
import { BaseFilters, FilterOption } from "@/types/filterTypes";

export default function Departamentos() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const { departments, isLoading, refetch } = useDepartments();
  const createDepartment = useCreateDepartment();
  const updateDepartment = useUpdateDepartment();
  const deleteDepartment = useDeleteDepartment();

  // Configuração dos filtros
  const filterConfig = {
    mes: true,
    ano: true,
    status: false, // Departamentos não têm status variável
  };

  const statusOptions: FilterOption[] = []; // Vazio pois não há status

  // Função de filtro personalizada
  const filterFunction = (item: any, filters: BaseFilters) => {
    // Filtrar por mês (baseado na data de criação)
    if (filters.mes) {
      const itemMonth = new Date(item.created_at).getMonth() + 1;
      if (itemMonth.toString() !== filters.mes) return false;
    }

    // Filtrar por ano
    if (filters.ano) {
      const itemYear = new Date(item.created_at).getFullYear();
      if (itemYear.toString() !== filters.ano) return false;
    }

    return true;
  };

  // Função de busca
  const searchFunction = (item: any, term: string) => {
    return item.name?.toLowerCase().includes(term.toLowerCase()) ||
           item.description?.toLowerCase().includes(term.toLowerCase());
  };

  const {
    currentPage,
    totalPages,
    paginatedData,
    filteredData,
    setCurrentPage,
    handleSearch,
    filters,
    setFilters,
    clearFilters,
    hasActiveFilters
  } = useAdvancedFilters({
    data: departments || [],
    itemsPerPage: 10,
    searchTerm,
    searchFn: searchFunction,
    filterFn: filterFunction
  });

  const handleCreateDepartment = (data: any) => {
    createDepartment.mutate(data, {
      onSuccess: () => {
        setIsModalOpen(false);
        refetch();
      }
    });
  };

  const handleUpdateDepartment = (data: any) => {
    if (editingDepartment) {
      updateDepartment.mutate({ id: editingDepartment.id, ...data }, {
        onSuccess: () => {
          setEditingDepartment(null);
          setIsModalOpen(false);
          refetch();
        }
      });
    }
  };

  const handleDeleteDepartment = () => {
    if (deleteId) {
      deleteDepartment.mutate(deleteId, {
        onSuccess: () => {
          setDeleteId(null);
          refetch();
        }
      });
    }
  };

  const handleEditDepartment = (department: any) => {
    setEditingDepartment(department);
    setIsModalOpen(true);
  };

  const handleNewDepartment = () => {
    setEditingDepartment(null);
    setIsModalOpen(true);
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    handleSearch(value);
  };

  const handleTemplateModalClose = () => {
    setIsTemplateModalOpen(false);
    refetch();
  };

  if (isLoading) {
    return (
      <div className="p-8 bg-background">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-sm text-muted-foreground">Carregando departamentos...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6 bg-background min-h-full">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Departamentos</h1>
          <p className="text-muted-foreground mt-1">Gerencie os departamentos da empresa</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsTemplateModalOpen(true)} variant="outline" className="flex items-center gap-2">
            <FileTemplate className="h-4 w-4" />
            Usar Template
          </Button>
          <Button onClick={handleNewDepartment} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Novo Departamento
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar departamentos..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10 bg-background border-border"
            />
          </div>
        </div>

        <FilterBar
          filters={filters}
          onFiltersChange={setFilters}
          config={filterConfig}
          statusOptions={statusOptions}
          isLoading={isLoading}
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-foreground">{departments?.length || 0}</div>
            <p className="text-sm text-muted-foreground">Total de Departamentos</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-foreground">{filteredData.length}</div>
            <p className="text-sm text-muted-foreground">
              {hasActiveFilters ? 'Filtrados' : 'Visíveis'}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-foreground">{totalPages}</div>
            <p className="text-sm text-muted-foreground">Páginas</p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">
            Departamentos ({filteredData.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {paginatedData.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-muted-foreground">Nome</TableHead>
                  <TableHead className="text-muted-foreground">Descrição</TableHead>
                  <TableHead className="text-muted-foreground">Criado em</TableHead>
                  <TableHead className="text-muted-foreground">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.map((department: any) => (
                  <TableRow key={department.id}>
                    <TableCell className="font-medium text-foreground">
                      {department.name}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {department.description || "Sem descrição"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(department.created_at).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditDepartment(department)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDeleteId(department.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {hasActiveFilters ? "Nenhum departamento encontrado com os filtros aplicados" : "Nenhum departamento cadastrado"}
              </p>
              {!hasActiveFilters && (
                <Button onClick={handleNewDepartment} className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Criar primeiro departamento
                </Button>
              )}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                Anterior
              </Button>
              <span className="text-sm text-muted-foreground">
                Página {currentPage} de {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                Próxima
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal */}
      <DepartmentModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        department={editingDepartment}
        onSave={editingDepartment ? handleUpdateDepartment : handleCreateDepartment}
        isLoading={createDepartment.isPending || updateDepartment.isPending}
      />

      {/* Template Modal */}
      <DepartmentTemplateModal
        open={isTemplateModalOpen}
        onClose={handleTemplateModalClose}
      />

      {/* Confirm Delete */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Excluir Departamento"
        description="Tem certeza que deseja excluir este departamento? Esta ação não pode ser desfeita."
        onConfirm={handleDeleteDepartment}
        isLoading={deleteDepartment.isPending}
        variant="destructive"
      />
    </div>
  );
}
