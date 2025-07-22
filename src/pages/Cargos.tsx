
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Edit, Trash2, FileTemplate } from "lucide-react";
import { PositionModal } from "@/components/PositionModal";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { usePositions, useDeletePosition } from "@/hooks/usePositions";
import { useDepartments } from "@/hooks/useDepartments";
import { FilterBar } from "@/components/FilterBar";
import { useAdvancedFilters } from "@/hooks/useAdvancedFilters";
import { BaseFilters, FilterOption } from "@/types/filterTypes";
import { PositionTemplateModal } from "@/components/PositionTemplateModal";

export default function Cargos() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [editingPosition, setEditingPosition] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const { positions, isLoading, refetch } = usePositions();
  const { departments } = useDepartments();
  const deletePosition = useDeletePosition();

  // Configuração dos filtros
  const filterConfig = {
    mes: true,
    ano: true,
    status: false,
  };

  const statusOptions: FilterOption[] = [];

  // Função de filtro personalizada
  const filterFunction = (item: any, filters: BaseFilters) => {
    if (filters.mes) {
      const itemMonth = new Date(item.created_at).getMonth() + 1;
      if (itemMonth.toString() !== filters.mes) return false;
    }

    if (filters.ano) {
      const itemYear = new Date(item.created_at).getFullYear();
      if (itemYear.toString() !== filters.ano) return false;
    }

    return true;
  };

  // Função de busca
  const searchFunction = (item: any, term: string) => {
    return item.name?.toLowerCase().includes(term.toLowerCase()) ||
           item.description?.toLowerCase().includes(term.toLowerCase()) ||
           item.department?.name?.toLowerCase().includes(term.toLowerCase());
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
    data: positions || [],
    itemsPerPage: 10,
    searchTerm,
    searchFn: searchFunction,
    filterFn: filterFunction
  });

  const handleDeletePosition = () => {
    if (deleteId) {
      deletePosition.mutate(deleteId, {
        onSuccess: () => {
          setDeleteId(null);
          refetch();
        }
      });
    }
  };

  const handleEditPosition = (position: any) => {
    setEditingPosition(position);
    setIsModalOpen(true);
  };

  const handleNewPosition = () => {
    setEditingPosition(null);
    setIsModalOpen(true);
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    handleSearch(value);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingPosition(null);
    refetch();
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
            <p className="mt-2 text-sm text-muted-foreground">Carregando cargos...</p>
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
          <h1 className="text-3xl font-bold text-foreground">Cargos</h1>
          <p className="text-muted-foreground mt-1">Gerencie os cargos da empresa</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsTemplateModalOpen(true)} variant="outline" className="flex items-center gap-2">
            <FileTemplate className="h-4 w-4" />
            Usar Template
          </Button>
          <Button onClick={handleNewPosition} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Novo Cargo
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar cargos..."
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
            <div className="text-2xl font-bold text-foreground">{positions?.length || 0}</div>
            <p className="text-sm text-muted-foreground">Total de Cargos</p>
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
            <div className="text-2xl font-bold text-foreground">{departments?.length || 0}</div>
            <p className="text-sm text-muted-foreground">Departamentos</p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">
            Cargos ({filteredData.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {paginatedData.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-muted-foreground">Nome</TableHead>
                  <TableHead className="text-muted-foreground">Departamento</TableHead>
                  <TableHead className="text-muted-foreground">Descrição</TableHead>
                  <TableHead className="text-muted-foreground">Criado em</TableHead>
                  <TableHead className="text-muted-foreground">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.map((position: any) => (
                  <TableRow key={position.id}>
                    <TableCell className="font-medium text-foreground">
                      {position.name}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {position.department?.name || "Sem departamento"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {position.description || "Sem descrição"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(position.created_at).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditPosition(position)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDeleteId(position.id)}
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
                {hasActiveFilters ? "Nenhum cargo encontrado com os filtros aplicados" : "Nenhum cargo cadastrado"}
              </p>
              {!hasActiveFilters && (
                <Button onClick={handleNewPosition} className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Criar primeiro cargo
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
      <PositionModal
        position={editingPosition}
        onClose={handleModalClose}
      />

      {/* Template Modal */}
      <PositionTemplateModal
        open={isTemplateModalOpen}
        onClose={handleTemplateModalClose}
      />

      {/* Confirm Delete */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Excluir Cargo"
        description="Tem certeza que deseja excluir este cargo? Esta ação não pode ser desfeita."
        onConfirm={handleDeletePosition}
        isLoading={deletePosition.isPending}
        variant="destructive"
      />
    </div>
  );
}
