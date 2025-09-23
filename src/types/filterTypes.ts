
export interface FilterOption {
  value: string;
  label: string;
}

export interface BaseFilters {
  vendedor?: string;
  escritorio?: string;
  mes?: string;
  ano?: string;
  status?: string;
}

export interface DateRangeFilter {
  startDate?: Date;
  endDate?: Date;
}

export interface FilterConfig {
  vendedor?: boolean;
  escritorio?: boolean;
  mes?: boolean;
  ano?: boolean;
  status?: boolean;
  dateRange?: boolean;
  customFilters?: Record<string, any>;
}

export interface FilterBarProps {
  filters: BaseFilters;
  onFiltersChange: (filters: BaseFilters) => void;
  config: FilterConfig;
  vendedorOptions?: FilterOption[];
  escritorioOptions?: FilterOption[];
  statusOptions?: FilterOption[];
  isLoading?: boolean;
}

export interface CommissionFilters extends BaseFilters {
  vencimento?: string;
  valor?: string;
  dataAprovacao?: string;
  dataPagamento?: string;
  metodoPagamento?: string;
  produto?: string;
  tipoComissao?: string;
}
