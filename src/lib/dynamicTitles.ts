import { MetricConfig, ChartConfig } from '@/hooks/useDashboardPersonalization';

// Mapeamento de tipos para títulos base
const TYPE_TITLE_MAP = {
  sales: 'Vendas',
  commissions: 'Comissões',
  clients: 'Clientes',
  sellers: 'Vendedores',
  goals: 'Metas',
  products: 'Produtos',
} as const;

// Mapeamento de agregações para descritores
const AGGREGATION_TITLE_MAP = {
  sum: 'Total de',
  count: 'Quantidade de',
  count_distinct: 'Contagem Única de',
  avg: 'Média de',
  min: 'Mínimo de',
  max: 'Máximo de',
} as const;

// Mapeamento de eixo X para sufixos
const X_AXIS_SUFFIX_MAP = {
  time: 'Mensais',
  products: 'por Produto',
  sellers: 'por Vendedor',
  offices: 'por Escritório',
} as const;

/**
 * Gera título dinâmico para métricas
 */
export function generateMetricTitle(config: MetricConfig): string {
  const baseTitle = TYPE_TITLE_MAP[config.type] || config.type;
  const aggregationPrefix = AGGREGATION_TITLE_MAP[config.aggregation || 'count'] || '';
  
  // Para comissões, considerar configuração específica
  if (config.type === 'commissions' && config.commissionConfig) {
    const { includeOffice, includeSeller, separateTypes } = config.commissionConfig;
    
    if (separateTypes) {
      if (includeOffice && !includeSeller) return `${aggregationPrefix} Comissões de Escritório`;
      if (!includeOffice && includeSeller) return `${aggregationPrefix} Comissões de Vendedores`;
    }
  }
  
  return `${aggregationPrefix} ${baseTitle}`;
}

/**
 * Gera título dinâmico para gráficos
 */
export function generateChartTitle(config: ChartConfig): string {
  const baseTitle = TYPE_TITLE_MAP[config.yAxis.type] || config.yAxis.type;
  const xAxisSuffix = config.xAxis ? X_AXIS_SUFFIX_MAP[config.xAxis] || '' : '';
  
  // Para comissões, considerar configuração específica
  if (config.yAxis.type === 'commissions' && config.commissionConfig) {
    const { includeOffice, includeSeller, separateTypes } = config.commissionConfig;
    
    if (separateTypes) {
      if (includeOffice && !includeSeller) {
        return `Comissões de Escritório ${xAxisSuffix}`;
      }
      if (!includeOffice && includeSeller) {
        return `Comissões de Vendedores ${xAxisSuffix}`;
      }
    }
  }
  
  // Agregações específicas para agrupamento "Outros"
  if (config.aggregationFilters) {
    const activeFilters = Object.entries(config.aggregationFilters)
      .filter(([_, filter]) => filter?.type === 'others')
      .map(([key]) => key);
    
    if (activeFilters.length > 0) {
      return `${baseTitle} ${xAxisSuffix} (Top + Outros)`;
    }
  }
  
  return `${baseTitle} ${xAxisSuffix}`.trim();
}

/**
 * Gera título para listas
 */
export function generateListTitle(type: string, limit: number): string {
  const listTitleMap = {
    recent_sales: `${limit} Vendas Recentes`,
    top_sellers: `Top ${limit} Vendedores`,
    upcoming_tasks: `${limit} Próximas Tarefas`,
    commission_breakdown: `Detalhamento de ${limit} Comissões`,
  } as const;
  
  return listTitleMap[type as keyof typeof listTitleMap] || `Lista de ${type}`;
}

/**
 * Aplica título dinâmico se habilitado
 */
export function applyDynamicTitle<T extends { title: string; dynamicTitle?: boolean }>(
  config: T,
  generator: (config: T) => string
): T {
  if (config.dynamicTitle) {
    return {
      ...config,
      title: generator(config),
    };
  }
  return config;
}

/**
 * Valida se agregação é compatível com tipo de dado
 */
export function validateAggregationForType(
  type: MetricConfig['type'], 
  aggregation: MetricConfig['aggregation']
): boolean {
  // Tipos que suportam operações numéricas
  const numericTypes = ['sales', 'commissions', 'goals'];
  const numericAggregations = ['sum', 'avg', 'min', 'max'];
  
  // Tipos que suportam contagem
  const countableTypes = ['sales', 'commissions', 'clients', 'sellers', 'goals', 'products'];
  const countAggregations = ['count', 'count_distinct'];
  
  if (numericAggregations.includes(aggregation || '')) {
    return numericTypes.includes(type);
  }
  
  if (countAggregations.includes(aggregation || '')) {
    return countableTypes.includes(type);
  }
  
  return true;
}

/**
 * Otimiza configuração de métrica para performance
 */
export function optimizeMetricConfig(config: MetricConfig): MetricConfig {
  const optimized = { ...config };
  
  // Validar agregação
  if (!validateAggregationForType(config.type, config.aggregation)) {
    optimized.aggregation = config.type === 'sales' || config.type === 'commissions' 
      ? 'sum' 
      : 'count';
  }
  
  // Aplicar título dinâmico se habilitado
  if (config.dynamicTitle) {
    optimized.title = generateMetricTitle(optimized);
  }
  
  return optimized;
}