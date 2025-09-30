import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface DefaultersFiltersProps {
  searchTerm: string;
  statusFilter: string;
  situacaoFilter: string;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onSituacaoChange: (value: string) => void;
  onClearFilters: () => void;
}

export function DefaultersFilters({
  searchTerm,
  statusFilter,
  situacaoFilter,
  onSearchChange,
  onStatusChange,
  onSituacaoChange,
  onClearFilters,
}: DefaultersFiltersProps) {
  const hasActiveFilters = searchTerm || statusFilter || situacaoFilter;

  return (
    <div className="space-y-4 mb-6 p-4 bg-muted/50 rounded-lg border">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Filtros</h3>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="h-8 px-2"
          >
            <X className="h-4 w-4 mr-1" />
            Limpar filtros
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="search">Cliente ou Proposta</Label>
          <Input
            id="search"
            placeholder="Buscar por nome ou proposta..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status da Cota</Label>
          <Select value={statusFilter} onValueChange={onStatusChange}>
            <SelectTrigger id="status">
              <SelectValue placeholder="Todos os status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="Ativa">Ativa</SelectItem>
              <SelectItem value="Inadimplente">Inadimplente</SelectItem>
              <SelectItem value="Suspensa">Suspensa</SelectItem>
              <SelectItem value="Cancelada">Cancelada</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="situacao">Situação de Cobrança</Label>
          <Select value={situacaoFilter} onValueChange={onSituacaoChange}>
            <SelectTrigger id="situacao">
              <SelectValue placeholder="Todas as situações" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as situações</SelectItem>
              <SelectItem value="Em cobrança">Em cobrança</SelectItem>
              <SelectItem value="Acordo em andamento">Acordo em andamento</SelectItem>
              <SelectItem value="Negativado">Negativado</SelectItem>
              <SelectItem value="Em contencioso">Em contencioso</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
