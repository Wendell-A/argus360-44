import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Search, X } from "lucide-react";

interface SalesFiltersProps {
  onFilterChange: (filters: SalesFilterValues) => void;
}

export interface SalesFilterValues {
  clientName?: string;
  productName?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  pendingAta?: boolean;
  pendingProposta?: boolean;
  pendingCodGrupo?: boolean;
  pendingCota?: boolean;
}

export default function SalesFilters({ onFilterChange }: SalesFiltersProps) {
  const [filters, setFilters] = useState<SalesFilterValues>({
    clientName: "",
    productName: "",
    status: "",
    dateFrom: "",
    dateTo: "",
    pendingAta: false,
    pendingProposta: false,
    pendingCodGrupo: false,
    pendingCota: false,
  });

  const handleInputChange = (field: keyof SalesFilterValues, value: string | boolean) => {
    const newFilters = { ...filters, [field]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleClearFilters = () => {
    const clearedFilters: SalesFilterValues = {
      clientName: "",
      productName: "",
      status: "",
      dateFrom: "",
      dateTo: "",
      pendingAta: false,
      pendingProposta: false,
      pendingCodGrupo: false,
      pendingCota: false,
    };
    setFilters(clearedFilters);
    onFilterChange(clearedFilters);
  };

  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Search className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-lg font-semibold">Filtros de Pesquisa</h3>
          </div>
          <Button variant="ghost" size="sm" onClick={handleClearFilters}>
            <X className="h-4 w-4 mr-2" />
            Limpar Filtros
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="clientName">Nome do Cliente</Label>
            <Input
              id="clientName"
              placeholder="Pesquisar cliente..."
              value={filters.clientName}
              onChange={(e) => handleInputChange("clientName", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="productName">Produto</Label>
            <Input
              id="productName"
              placeholder="Pesquisar produto..."
              value={filters.productName}
              onChange={(e) => handleInputChange("productName", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={filters.status} onValueChange={(value) => handleInputChange("status", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="approved">Aprovada</SelectItem>
                <SelectItem value="cancelled">Cancelada</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dateFrom">Data de Início</Label>
            <Input
              id="dateFrom"
              type="date"
              value={filters.dateFrom}
              onChange={(e) => handleInputChange("dateFrom", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dateTo">Data de Fim</Label>
            <Input
              id="dateTo"
              type="date"
              value={filters.dateTo}
              onChange={(e) => handleInputChange("dateTo", e.target.value)}
            />
          </div>

          <div className="space-y-2 col-span-full">
            <Label>Pendências de Documentação</Label>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="pendingAta"
                  checked={filters.pendingAta}
                  onCheckedChange={(checked) => handleInputChange("pendingAta", checked === true)}
                />
                <label
                  htmlFor="pendingAta"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Ata Pendente
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="pendingProposta"
                  checked={filters.pendingProposta}
                  onCheckedChange={(checked) => handleInputChange("pendingProposta", checked === true)}
                />
                <label
                  htmlFor="pendingProposta"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Proposta Pendente
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="pendingCodGrupo"
                  checked={filters.pendingCodGrupo}
                  onCheckedChange={(checked) => handleInputChange("pendingCodGrupo", checked === true)}
                />
                <label
                  htmlFor="pendingCodGrupo"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Cód. Grupo Pendente
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="pendingCota"
                  checked={filters.pendingCota}
                  onCheckedChange={(checked) => handleInputChange("pendingCota", checked === true)}
                />
                <label
                  htmlFor="pendingCota"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Cota Pendente
                </label>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}