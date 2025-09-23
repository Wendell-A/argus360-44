
import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, Filter } from 'lucide-react';
import { CommissionFilters, FilterOption } from '@/types/filterTypes';
import { useFilterData } from '@/hooks/useFilterData';

interface BaseFilterConfig {
  vendedor: boolean;
}

interface OverviewFilterConfig extends BaseFilterConfig {
  escritorio: boolean;
  mes: boolean;
  ano: boolean;
  status: boolean;
  tipoComissao: boolean;
}

interface PendingFilterConfig extends BaseFilterConfig {
  escritorio: boolean;
  mes: boolean;
  ano: boolean;
  vencimento: boolean;
  valor: boolean;
  tipoComissao: boolean;
}

interface ApprovedFilterConfig extends BaseFilterConfig {
  escritorio: boolean;
  mes: boolean;
  ano: boolean;
  dataAprovacao: boolean;
  valor: boolean;
  tipoComissao: boolean;
}

interface PaidFilterConfig extends BaseFilterConfig {
  escritorio: boolean;
  mes: boolean;
  ano: boolean;
  dataPagamento: boolean;
  metodoPagamento: boolean;
  valor: boolean;
  tipoComissao: boolean;
}

interface SellerConfigFilterConfig extends BaseFilterConfig {
  produto: boolean;
  status: boolean;
}

type FilterConfig = OverviewFilterConfig | PendingFilterConfig | ApprovedFilterConfig | PaidFilterConfig | SellerConfigFilterConfig;

interface CommissionFilterBarProps {
  filters: CommissionFilters;
  onFiltersChange: (filters: CommissionFilters) => void;
  tabType: 'overview' | 'pending' | 'approved' | 'paid' | 'seller-config';
  isLoading?: boolean;
}

export const CommissionFilterBar: React.FC<CommissionFilterBarProps> = ({
  filters,
  onFiltersChange,
  tabType,
  isLoading = false
}) => {
  const { 
    vendedorOptions, 
    escritorioOptions,
    mesOptions,
    anoOptions 
  } = useFilterData();

  const updateFilter = (key: keyof CommissionFilters, value: string | undefined) => {
    const newFilters = { ...filters };
    if (value && value !== 'all') {
      newFilters[key] = value;
    } else {
      delete newFilters[key];
    }
    onFiltersChange(newFilters);
  };

  const clearAllFilters = () => {
    onFiltersChange({});
  };

  const hasActiveFilters = Object.keys(filters).length > 0;

  // Opções de status por aba
  const getStatusOptions = (): FilterOption[] => {
    switch (tabType) {
      case 'pending':
        return [
          { value: 'pending', label: 'Pendente' },
          { value: 'reviewing', label: 'Em análise' }
        ];
      case 'approved':
        return [
          { value: 'approved', label: 'Aprovada' },
          { value: 'scheduled', label: 'Programada' }
        ];
      case 'paid':
        return [
          { value: 'paid', label: 'Paga' },
          { value: 'processed', label: 'Processada' }
        ];
      default:
        return [
          { value: 'pending', label: 'Pendente' },
          { value: 'approved', label: 'Aprovada' },
          { value: 'paid', label: 'Paga' },
          { value: 'cancelled', label: 'Cancelada' }
        ];
    }
  };

  // Configurações específicas por aba
  const getTabConfig = (): FilterConfig => {
    switch (tabType) {
      case 'overview':
        return {
          vendedor: true,
          escritorio: true,
          mes: true,
          ano: true,
          status: true,
          tipoComissao: true
        } as OverviewFilterConfig;
      case 'pending':
        return {
          vendedor: true,
          escritorio: true,
          mes: true,
          ano: true,
          vencimento: true,
          valor: true,
          tipoComissao: true
        } as PendingFilterConfig;
      case 'approved':
        return {
          vendedor: true,
          escritorio: true,
          mes: true,
          ano: true,
          dataAprovacao: true,
          valor: true,
          tipoComissao: true
        } as ApprovedFilterConfig;
      case 'paid':
        return {
          vendedor: true,
          escritorio: true,
          mes: true,
          ano: true,
          dataPagamento: true,
          metodoPagamento: true,
          valor: true,
          tipoComissao: true
        } as PaidFilterConfig;
      case 'seller-config':
        return {
          vendedor: true,
          produto: true,
          status: true
        } as SellerConfigFilterConfig;
      default:
        return {
          vendedor: true,
          escritorio: true,
          mes: true,
          ano: true,
          status: true
        } as OverviewFilterConfig;
    }
  };

  const config = getTabConfig();
  const statusOptions = getStatusOptions();

  const hasProperty = (obj: any, prop: string): boolean => {
    return prop in obj;
  };

  const getFilterLabel = (key: keyof CommissionFilters) => {
    const value = filters[key];
    if (!value) return null;

    switch (key) {
      case 'vendedor':
        return vendedorOptions.find(v => v.value === value)?.label || value;
      case 'escritorio':
        return escritorioOptions.find(e => e.value === value)?.label || value;
      case 'mes':
        return mesOptions.find(m => m.value === value)?.label || value;
      case 'ano':
        return value;
      case 'status':
        return statusOptions.find(s => s.value === value)?.label || value;
      case 'tipoComissao':
        return value === 'office' ? 'Escritório' : value === 'seller' ? 'Vendedor' : value;
      default:
        return value;
    }
  };

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Filtros:</span>
        </div>

        {config.vendedor && (
          <Select
            value={filters.vendedor || 'all'}
            onValueChange={(value) => updateFilter('vendedor', value)}
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
        )}

        {hasProperty(config, 'escritorio') && (config as any).escritorio && (
          <Select
            value={filters.escritorio || 'all'}
            onValueChange={(value) => updateFilter('escritorio', value)}
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
        )}

        {hasProperty(config, 'mes') && (config as any).mes && (
          <Select
            value={filters.mes || 'all'}
            onValueChange={(value) => updateFilter('mes', value)}
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
        )}

        {hasProperty(config, 'ano') && (config as any).ano && (
          <Select
            value={filters.ano || 'all'}
            onValueChange={(value) => updateFilter('ano', value)}
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
        )}

        {hasProperty(config, 'status') && (config as any).status && (
          <Select
            value={filters.status || 'all'}
            onValueChange={(value) => updateFilter('status', value)}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {hasProperty(config, 'tipoComissao') && (config as any).tipoComissao && (
          <Select
            value={filters.tipoComissao || 'all'}
            onValueChange={(value) => updateFilter('tipoComissao', value)}
            disabled={isLoading}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Tipo de Comissão" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              <SelectItem value="office">Escritório</SelectItem>
              <SelectItem value="seller">Vendedor</SelectItem>
            </SelectContent>
          </Select>
        )}

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

      {/* Filtros ativos */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(filters).map(([key, value]) => {
            const label = getFilterLabel(key as keyof CommissionFilters);
            if (!label) return null;

            return (
              <Badge key={key} variant="secondary" className="gap-1">
                {label}
                <button
                  onClick={() => updateFilter(key as keyof CommissionFilters, undefined)}
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
