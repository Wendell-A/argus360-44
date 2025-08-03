/**
 * Filtros Avançados do Dashboard Completo
 * Data: 03 de Agosto de 2025, 14:20 UTC
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Filter, RefreshCw, Building, Users, UserCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useOffices } from '@/hooks/useOffices';
import { useVendedores } from '@/hooks/useVendedores';
import { useClients } from '@/hooks/useClients';
import type { DashboardCompleteFilters } from '@/hooks/useDashboardComplete';

interface DashboardFiltersAdvancedProps {
  filters: DashboardCompleteFilters;
  onFiltersChange: (filters: Partial<DashboardCompleteFilters>) => void;
  onReset: () => void;
  totalResults: number;
  isLoading?: boolean;
}

export const DashboardFiltersAdvanced: React.FC<DashboardFiltersAdvancedProps> = ({
  filters,
  onFiltersChange,
  onReset,
  totalResults,
  isLoading = false
}) => {
  const { offices } = useOffices();
  const { vendedores } = useVendedores();
  const { clients } = useClients();

  const handleDateRangeChange = (field: 'start' | 'end', value: string) => {
    onFiltersChange({
      dateRange: {
        ...filters.dateRange,
        [field]: value
      }
    });
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    
    // Verificar se não é o padrão
    const defaultStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    const defaultEnd = new Date().toISOString().split('T')[0];
    
    if (filters.dateRange.start !== defaultStart || filters.dateRange.end !== defaultEnd) count++;
    if (filters.office_id) count++;
    if (filters.seller_id) count++;
    if (filters.client_id) count++;
    if (filters.status) count++;
    
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  // Obter nomes para os filtros selecionados
  const selectedOfficeName = offices.find(o => o.id === filters.office_id)?.name;
  const selectedVendorName = vendedores.find(v => v.id === filters.seller_id)?.user?.full_name;
  const selectedClientName = clients.find(c => c.id === filters.client_id)?.name;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Filtros Avançados do Dashboard
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="ml-2">
              {activeFiltersCount} ativo{activeFiltersCount !== 1 ? 's' : ''}
            </Badge>
          )}
        </CardTitle>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {totalResults} resultado{totalResults !== 1 ? 's' : ''}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={onReset}
            disabled={isLoading || activeFiltersCount === 0}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Limpar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Filtros de Data */}
        <div className="space-y-3">
          <Label className="text-sm font-medium text-muted-foreground">Período de Análise</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-date" className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4" />
                Data Inicial
              </Label>
              <Input
                id="start-date"
                type="date"
                value={filters.dateRange.start}
                onChange={(e) => handleDateRangeChange('start', e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-date" className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4" />
                Data Final
              </Label>
              <Input
                id="end-date"
                type="date"
                value={filters.dateRange.end}
                onChange={(e) => handleDateRangeChange('end', e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>
        </div>

        {/* Filtros Organizacionais */}
        <div className="space-y-3">
          <Label className="text-sm font-medium text-muted-foreground">Filtros Organizacionais</Label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Escritório */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm">
                <Building className="h-4 w-4" />
                Escritório
              </Label>
              <Select
                value={filters.office_id || "all"}
                onValueChange={(value) => onFiltersChange({ 
                  office_id: value === "all" ? undefined : value,
                  offset: 0 // Reset pagination when changing filters
                })}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos os escritórios" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os escritórios</SelectItem>
                  {offices.map((office) => (
                    <SelectItem key={office.id} value={office.id}>
                      {office.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Vendedor */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4" />
                Vendedor
              </Label>
              <Select
                value={filters.seller_id || "all"}
                onValueChange={(value) => onFiltersChange({ 
                  seller_id: value === "all" ? undefined : value,
                  offset: 0
                })}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos os vendedores" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os vendedores</SelectItem>
                  {vendedores.filter(v => v.active).map((vendor) => (
                    <SelectItem key={vendor.id} value={vendor.id}>
                      {vendor.user?.full_name || vendor.user?.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Cliente */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm">
                <UserCheck className="h-4 w-4" />
                Cliente
              </Label>
              <Select
                value={filters.client_id || "all"}
                onValueChange={(value) => onFiltersChange({ 
                  client_id: value === "all" ? undefined : value,
                  offset: 0
                })}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos os clientes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os clientes</SelectItem>
                  {clients.slice(0, 50).map((client) => ( // Limitar para performance
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Status e Configurações */}
        <div className="space-y-3">
          <Label className="text-sm font-medium text-muted-foreground">Configurações de Visualização</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Status das Vendas</Label>
              <Select
                value={filters.status || "all"}
                onValueChange={(value) => onFiltersChange({ 
                  status: value === "all" ? undefined : value,
                  offset: 0
                })}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="approved">Aprovado</SelectItem>
                  <SelectItem value="completed">Concluído</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Itens por seção</Label>
              <Select
                value={filters.limit.toString()}
                onValueChange={(value) => onFiltersChange({ 
                  limit: parseInt(value), 
                  offset: 0
                })}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 itens</SelectItem>
                  <SelectItem value="10">10 itens</SelectItem>
                  <SelectItem value="20">20 itens</SelectItem>
                  <SelectItem value="50">50 itens</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Filtros Aplicados */}
        {activeFiltersCount > 0 && (
          <div className="space-y-3">
            <Label className="text-sm font-medium text-muted-foreground">Filtros Aplicados</Label>
            <div className="flex flex-wrap gap-2">
              {selectedOfficeName && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Building className="h-3 w-3" />
                  {selectedOfficeName}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 hover:bg-transparent"
                    onClick={() => onFiltersChange({ office_id: undefined })}
                  >
                    ×
                  </Button>
                </Badge>
              )}
              {selectedVendorName && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {selectedVendorName}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 hover:bg-transparent"
                    onClick={() => onFiltersChange({ seller_id: undefined })}
                  >
                    ×
                  </Button>
                </Badge>
              )}
              {selectedClientName && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <UserCheck className="h-3 w-3" />
                  {selectedClientName}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 hover:bg-transparent"
                    onClick={() => onFiltersChange({ client_id: undefined })}
                  >
                    ×
                  </Button>
                </Badge>
              )}
              {filters.status && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Status: {filters.status}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 hover:bg-transparent"
                    onClick={() => onFiltersChange({ status: undefined })}
                  >
                    ×
                  </Button>
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};