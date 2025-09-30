import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, Phone, Mail } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
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
import { Badge } from "@/components/ui/badge";
import { DefaultersFilters } from "@/components/DefaultersFilters";
import { DefaulterModal } from "@/components/DefaulterModal";
import {
  useDefaulters,
  useCreateDefaulter,
  useUpdateDefaulter,
  useDeleteDefaulter,
} from "@/hooks/useDefaulters";
import { Database } from "@/integrations/supabase/types";
import { usePaginatedQuery } from "@/hooks/usePaginatedQuery";

type Defaulter = Database['public']['Tables']['defaulters']['Row'];

export default function Inadimplentes() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [situacaoFilter, setSituacaoFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDefaulter, setSelectedDefaulter] = useState<Defaulter | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [defaulterToDelete, setDefaulterToDelete] = useState<Defaulter | null>(null);

  const pageSize = 10;

  const { data: response, isLoading } = useDefaulters({
    pageNumber: currentPage,
    pageSize,
    searchTerm: searchTerm || undefined,
    statusFilter: statusFilter === "all" ? undefined : statusFilter,
    situacaoFilter: situacaoFilter === "all" ? undefined : situacaoFilter,
  });

  const createMutation = useCreateDefaulter();
  const updateMutation = useUpdateDefaulter();
  const deleteMutation = useDeleteDefaulter();

  const defaulters = response?.data || [];
  const totalCount = response?.total_count || 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  const handleCreateDefaulter = () => {
    setSelectedDefaulter(null);
    setIsModalOpen(true);
  };

  const handleEditDefaulter = (defaulter: Defaulter) => {
    setSelectedDefaulter(defaulter);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (defaulter: Defaulter) => {
    setDefaulterToDelete(defaulter);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (defaulterToDelete) {
      deleteMutation.mutate(defaulterToDelete.id);
      setDeleteDialogOpen(false);
      setDefaulterToDelete(null);
    }
  };

  const handleSave = (data: any) => {
    if (selectedDefaulter) {
      updateMutation.mutate({ ...data, id: selectedDefaulter.id });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setSituacaoFilter("all");
    setCurrentPage(1);
  };

  const formatCurrency = (value: number | string | null) => {
    if (!value) return "R$ 0,00";
    const numValue = typeof value === "string" ? parseFloat(value) : value;
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(numValue);
  };

  const formatDate = (date: string | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("pt-BR");
  };

  const getStatusBadge = (status: string | null) => {
    if (!status) return null;
    
    const variants: Record<string, "default" | "destructive" | "secondary"> = {
      "Ativa": "default",
      "Inadimplente": "destructive",
      "Suspensa": "secondary",
      "Cancelada": "secondary",
    };

    return (
      <Badge variant={variants[status] || "default"}>
        {status}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Carregando inadimplentes...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Inadimplentes</h1>
          <p className="text-muted-foreground">
            Gerenciamento de clientes com pagamentos em atraso
          </p>
        </div>
        <Button onClick={handleCreateDefaulter}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Inadimplente
        </Button>
      </div>

      <DefaultersFilters
        searchTerm={searchTerm}
        statusFilter={statusFilter}
        situacaoFilter={situacaoFilter}
        onSearchChange={setSearchTerm}
        onStatusChange={setStatusFilter}
        onSituacaoChange={setSituacaoFilter}
        onClearFilters={handleClearFilters}
      />

      <Card>
        <CardHeader>
          <CardTitle>
            Lista de Inadimplentes ({totalCount})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Proposta</TableHead>
                  <TableHead>Situação</TableHead>
                  <TableHead className="text-center">Parc. Vencidas</TableHead>
                  <TableHead className="text-right">Valor do Bem</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Atualização</TableHead>
                  <TableHead className="text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {defaulters.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Nenhum inadimplente encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  defaulters.map((defaulter) => (
                    <TableRow key={defaulter.id}>
                      <TableCell className="font-medium">
                        <div>
                          <div>{defaulter.cliente_nome}</div>
                          {defaulter.status_cota && (
                            <div className="mt-1">
                              {getStatusBadge(defaulter.status_cota)}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">{defaulter.proposta || "-"}</div>
                          {defaulter.cod_grupo && (
                            <div className="text-muted-foreground">
                              Grupo: {defaulter.cod_grupo} / Cota: {defaulter.cota}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={defaulter.situacao_cobranca ? "destructive" : "secondary"}>
                          {defaulter.situacao_cobranca || "Não definida"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="font-semibold text-destructive">
                          {defaulter.parcelas_vencidas || 0}
                        </span>
                        <span className="text-muted-foreground text-sm">
                          /{defaulter.prazo_cota_meses || 0}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(defaulter.valor_bem_atual)}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {defaulter.telefone && (
                            <div className="flex items-center gap-1 text-sm">
                              <Phone className="h-3 w-3" />
                              <span>{defaulter.telefone}</span>
                            </div>
                          )}
                          {defaulter.email && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Mail className="h-3 w-3" />
                              <span className="truncate max-w-[150px]">{defaulter.email}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {formatDate(defaulter.data_atualizacao)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditDefaulter(defaulter)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteClick(defaulter)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Página {currentPage} de {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Próxima
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <DefaulterModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        defaulter={selectedDefaulter}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o registro de{" "}
              <strong>{defaulterToDelete?.cliente_nome}</strong>? Esta ação não pode ser
              desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
