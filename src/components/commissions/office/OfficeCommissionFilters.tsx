import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, Filter } from 'lucide-react';
import { useFilterData } from '@/hooks/useFilterData';
import { OfficeCommissionFilters } from '@/hooks/commissions/useOfficeCommissions';

interface OfficeCommissionFiltersProps {
  filters: OfficeCommissionFilters;
  onChange: (filters: OfficeCommissionFilters) => void;
  isLoading?: boolean;
}

export const OfficeCommissionFiltersComponent: React.FC<OfficeCommissionFiltersProps> = ({
  filters,
  onChange,
  isLoading = false
}) => {
  const { 
    vendedorOptions, 
    escritorioOptions,
    mesOptions,
    anoOptions 
  } = useFilterData();

  const updateFilter = (key: keyof OfficeCommissionFilters, value: string | undefined) => {
    const newFilters = { ...filters };
    if (value && value !== 'all') {
      (newFilters as any)[key] = value;
    } else {
      delete newFilters[key];
    }
    onChange(newFilters);
  };

  const clearAllFilters = () => {
    onChange({});
  };

  const hasActiveFilters = Object.keys(filters).length > 0;

  const getFilterLabel = (key: keyof OfficeCommissionFilters) => {
    const value = filters[key];
    if (!value) return null;

    switch (key) {
      case 'seller_id':
        return vendedorOptions.find(v => v.value === value)?.label || value;
      case 'office_id':
        return escritorioOptions.find(e => e.value === value)?.label || value;
      case 'month':
        return mesOptions.find(m => m.value === value)?.label || value;
      case 'year':
        return value;
      default:
        return value;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Filtros:</span>
        </div>

        <Select
          value={filters.office_id || 'all'}
          onValueChange={(value) => updateFilter('office_id', value)}
          disabled={isLoading}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Escritório" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os escritórios</SelectItem>
            {escritorioOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.seller_id || 'all'}
          onValueChange={(value) => updateFilter('seller_id', value)}
          disabled={isLoading}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Vendedor" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os vendedores</SelectItem>
            {vendedorOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.month || 'all'}
          onValueChange={(value) => updateFilter('month', value)}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Mês" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os meses</SelectItem>
            {mesOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.year || 'all'}
          onValueChange={(value) => updateFilter('year', value)}
        >
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Ano" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os anos</SelectItem>
            {anoOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={clearAllFilters}
            className="h-9"
          >
            <X className="h-4 w-4 mr-1" />
            Limpar filtros
          </Button>
        )}
      </div>

      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(filters).map(([key, value]) => {
            const label = getFilterLabel(key as keyof OfficeCommissionFilters);
            if (!label) return null;

            return (
              <Badge key={key} variant="secondary" className="gap-1">
                {label}
                <button
                  onClick={() => updateFilter(key as keyof OfficeCommissionFilters, undefined)}
                  className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
};
