/**
 * Componente de Filtros do Dashboard
 * Data: 03 de Agosto de 2025, 13:20 UTC
 * 
 * Componente que fornece filtros interativos para o Dashboard
 * incluindo data, status e paginação.
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Filter, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { DashboardFilters as DashboardFiltersType } from '@/hooks/useDashboardFilters';

interface DashboardFiltersProps {
  filters: DashboardFiltersType;
  onFiltersChange: (filters: Partial<DashboardFiltersType>) => void;
  onReset: () => void;
  pagination: {
    currentPage: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    nextPage: () => void;
    prevPage: () => void;
    totalCount: number;
    limit: number;
  };
  isLoading?: boolean;
}

export const DashboardFilters: React.FC<DashboardFiltersProps> = ({
  filters,
  onFiltersChange,
  onReset,
  pagination,
  isLoading = false
}) => {
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
    if (filters.status) count++;
    
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Filtros do Dashboard
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="ml-2">
              {activeFiltersCount} ativo{activeFiltersCount !== 1 ? 's' : ''}
            </Badge>
          )}
        </CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={onReset}
          disabled={isLoading || activeFiltersCount === 0}
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Limpar Filtros
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filtros de Data */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="start-date" className="flex items-center gap-2">
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
            <Label htmlFor="end-date" className="flex items-center gap-2">
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

        {/* Filtros de Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Status das Vendas</Label>
            <Select
              value={filters.status || "all"}
              onValueChange={(value) => onFiltersChange({ status: value === "all" ? undefined : value })}
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
            <Label>Itens por página</Label>
            <Select
              value={filters.limit.toString()}
              onValueChange={(value) => onFiltersChange({ limit: parseInt(value), offset: 0 })}
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

        {/* Paginação */}
        {pagination.totalCount > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              Mostrando {Math.min(pagination.currentPage * pagination.limit + 1, pagination.totalCount)} a{' '}
              {Math.min((pagination.currentPage + 1) * pagination.limit, pagination.totalCount)} de{' '}
              {pagination.totalCount} resultados
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={pagination.prevPage}
                disabled={!pagination.hasPrevPage || isLoading}
                className="flex items-center gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </Button>
              
              <div className="flex items-center gap-1 px-2">
                <span className="text-sm font-medium">
                  Página {pagination.currentPage + 1} de {pagination.totalPages}
                </span>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={pagination.nextPage}
                disabled={!pagination.hasNextPage || isLoading}
                className="flex items-center gap-1"
              >
                Próxima
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};