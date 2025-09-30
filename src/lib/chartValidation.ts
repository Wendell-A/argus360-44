import { ChartConfig } from '@/hooks/useDashboardPersonalization';

/**
 * Sistema de validação centralizado para configurações de gráficos
 */

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export type YAxisType = 'sales' | 'commissions' | 'clients' | 'goals';
export type XAxisType = 'time' | 'product' | 'seller' | 'office';
export type AggregationType = 'sum' | 'count' | 'count_distinct' | 'avg' | 'min' | 'max';

/**
 * Matriz de compatibilidade entre Y-axis e X-axis
 */
const COMPATIBILITY_MATRIX: Record<string, Record<string, boolean>> = {
  sales: {
    time: true,      // Vendas tem sale_date
    product: true,   // Vendas tem product_id
    seller: true,    // Vendas tem seller_id
    office: true,    // Vendas tem office_id
  },
  commissions: {
    time: true,      // Comissões tem due_date
    product: true,   // Comissões -> sale_id -> sales -> product_id
    seller: true,    // Comissões tem recipient_id (quando recipient_type='seller')
    office: true,    // Comissões tem recipient_id (quando recipient_type='office')
  },
  clients: {
    time: true,      // Clientes tem created_at
    product: false,  // Clientes não tem FK direto para produtos
    seller: true,    // Clientes tem responsible_user_id
    office: true,    // Clientes tem office_id
  },
  goals: {
    time: true,      // Metas tem period_start/period_end
    product: false,  // Metas não tem FK direto para produtos
    seller: true,    // Metas individuais tem user_id
    office: true,    // Metas de escritório tem office_id
  },
};

/**
 * Agregações válidas por tipo de dado
 */
const VALID_AGGREGATIONS: Record<string, AggregationType[]> = {
  sales: ['sum', 'count', 'avg', 'min', 'max'],           // Valores monetários
  commissions: ['sum', 'count', 'avg', 'min', 'max'],     // Valores monetários
  clients: ['count', 'count_distinct'],                    // Apenas contagem
  goals: ['sum', 'count', 'avg', 'min', 'max'],           // Valores de meta
};

/**
 * Valida configuração completa do gráfico
 */
export function validateChartConfig(config: ChartConfig): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validar Y-axis
  if (!config.yAxis?.type) {
    errors.push('Tipo de Y-axis não definido');
  }

  // Validar X-axis
  if (!config.xAxis) {
    errors.push('Tipo de X-axis não definido');
  }

  // Validar agregação
  if (!config.yAxis?.aggregation) {
    errors.push('Tipo de agregação não definido');
  }

  if (errors.length > 0) {
    return { isValid: false, errors, warnings };
  }

  const yAxis = config.yAxis?.type as string;
  const xAxis = config.xAxis as string;
  const aggregation = config.yAxis?.aggregation;

  // Validar compatibilidade Y x X
  if (!COMPATIBILITY_MATRIX[yAxis]?.[xAxis]) {
    errors.push(
      `Combinação ${yAxis} × ${xAxis} não é compatível. ` +
      `Não existe relacionamento direto entre essas entidades no banco de dados.`
    );
  }

  // Validar agregação para tipo de dado
  if (!VALID_AGGREGATIONS[yAxis]?.includes(aggregation)) {
    errors.push(
      `Agregação "${aggregation}" não é válida para ${yAxis}. ` +
      `Agregações válidas: ${VALID_AGGREGATIONS[yAxis]?.join(', ') || 'nenhuma'}`
    );
  }

  // Avisos específicos
  if (yAxis === 'commissions' && xAxis === 'product') {
    warnings.push(
      'Esta combinação requer JOIN através de sales. Performance pode ser impactada.'
    );
  }

  if (aggregation === 'count_distinct' && xAxis === 'time') {
    warnings.push(
      'Contagem distinta por tempo pode gerar valores inesperados se houver duplicatas no período.'
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Valida se uma combinação é semanticamente válida (sem avisos)
 */
export function isValidCombination(
  yAxis: string,
  xAxis: string,
  aggregation: AggregationType
): boolean {
  const isCompatible = COMPATIBILITY_MATRIX[yAxis]?.[xAxis] ?? false;
  const isValidAgg = VALID_AGGREGATIONS[yAxis]?.includes(aggregation) ?? false;
  return isCompatible && isValidAgg;
}

/**
 * Obtém mensagem de erro amigável
 */
export function getValidationMessage(config: ChartConfig): string {
  const result = validateChartConfig(config);
  
  if (result.isValid && result.warnings.length === 0) {
    return '';
  }

  if (!result.isValid) {
    return result.errors.join(' ');
  }

  return result.warnings.join(' ');
}


/**
 * Obtém sugestões de configuração válida
 */
export function getSuggestedConfigs(yAxis: string): Array<{
  xAxis: string;
  aggregations: AggregationType[];
}> {
  const validXAxis = Object.entries(COMPATIBILITY_MATRIX[yAxis] || {})
    .filter(([_, isValid]) => isValid)
    .map(([xAxis]) => xAxis);

  const validAggregations = VALID_AGGREGATIONS[yAxis] || [];

  return validXAxis.map(xAxis => ({
    xAxis,
    aggregations: validAggregations,
  }));
}
