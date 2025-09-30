import { ChartConfig } from '@/hooks/useDashboardPersonalization';
import { normalizeXAxis, normalizeDataType, type CanonicalDimension } from './dimensions';

/**
 * Sistema de validação centralizado para configurações de gráficos
 * 
 * ATUALIZAÇÃO v2.3 (30/09/2025):
 * - Integrado com sistema de normalização de dimensões
 * - Suporte a aliases (plural/singular, PT/EN)
 * - Matriz de compatibilidade usa dimensões canônicas (PLURAL)
 */

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export type YAxisType = 'sales' | 'commissions' | 'clients' | 'goals';
export type XAxisType = CanonicalDimension;
export type AggregationType = 'sum' | 'count' | 'count_distinct' | 'avg' | 'min' | 'max';

/**
 * REGRA DE OURO: Uma combinação Y-axis × X-axis é válida se e somente se 
 * a tabela de FATOS (Y-axis) possui uma Foreign Key direta para a dimensão (X-axis).
 * 
 * NUNCA buscamos dados das tabelas de cadastro (products, users). 
 * SEMPRE buscamos das tabelas de FATOS e fazemos JOIN apenas para obter nomes.
 * 
 * Mapeamento de Foreign Keys nas Tabelas de FATOS:
 * ================================================
 * 
 * SALES (Vendas):
 *   - sale_date        → time dimension ✓
 *   - product_id       → products ✓ (DIRETO!)
 *   - seller_id        → users/profiles ✓ (DIRETO!)
 *   - office_id        → offices ✓
 *   - client_id        → clients ✓
 * 
 * COMMISSIONS (Comissões):
 *   - due_date         → time dimension ✓
 *   - sale_id          → sales → product_id (JOIN indireto via sales)
 *   - recipient_id     → users/profiles (quando recipient_type='seller') ✓
 *   - recipient_id     → offices (quando recipient_type='office') ✓
 *   - sale_id          → sales → client_id (JOIN indireto via sales)
 * 
 * CLIENTS (Novos Clientes):
 *   - created_at       → time dimension ✓
 *   - responsible_user_id → users/profiles ✓
 *   - office_id        → offices ✓
 *   - NÃO TEM product_id ✗
 *   - NÃO TEM client_id (não faz sentido) ✗
 * 
 * GOALS (Metas):
 *   - period_start/end → time dimension ✓
 *   - user_id          → users/profiles (vendedor da meta individual) ✓
 *   - office_id        → offices (meta de escritório) ✓
 *   - NÃO TEM product_id ✗
 *   - NÃO TEM client_id ✗
 * 
 * NOTA: Dimensões são normalizadas para PLURAL (products, sellers, offices, clients, time)
 */
const COMPATIBILITY_MATRIX: Record<string, Record<string, boolean>> = {
  sales: {
    time: true,       // ✅ FK: sale_date
    products: true,   // ✅ FK: product_id (DIRETO!)
    sellers: true,    // ✅ FK: seller_id (DIRETO!)
    offices: true,    // ✅ FK: office_id
    clients: true,    // ✅ FK: client_id
  },
  commissions: {
    time: true,       // ✅ FK: due_date
    products: true,   // ✅ FK indireto: sale_id → sales.product_id (JOIN válido)
    sellers: true,    // ✅ FK: recipient_id (quando recipient_type='seller')
    offices: true,    // ✅ FK: recipient_id (quando recipient_type='office')
    clients: true,    // ✅ FK indireto: sale_id → sales.client_id (JOIN válido)
  },
  clients: {
    time: true,       // ✅ FK: created_at
    products: false,  // ❌ NÃO TEM product_id (tabela clients não tem FK para produtos)
    sellers: true,    // ✅ FK: responsible_user_id
    offices: true,    // ✅ FK: office_id
    clients: false,   // ❌ Não faz sentido agrupar clientes por clientes
  },
  goals: {
    time: true,       // ✅ FK: period_start/period_end
    products: false,  // ❌ NÃO TEM product_id (tabela goals não tem FK para produtos)
    sellers: true,    // ✅ FK: user_id (É O VENDEDOR da meta individual!)
    offices: true,    // ✅ FK: office_id (meta de escritório)
    clients: false,   // ❌ NÃO TEM client_id (metas não são por cliente)
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

  const yAxis = normalizeDataType(config.yAxis?.type);
  const xAxis = normalizeXAxis(config.xAxis);
  const aggregation = config.yAxis?.aggregation;

  // Validar compatibilidade Y x X baseado em Foreign Keys reais
  if (!COMPATIBILITY_MATRIX[yAxis]?.[xAxis]) {
    errors.push(
      `Combinação ${yAxis} × ${xAxis} não é compatível. ` +
      `A tabela de fatos "${yAxis}" não possui Foreign Key para "${xAxis}".`
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
  if (yAxis === 'commissions' && xAxis === 'products') {
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
  const normalizedYAxis = normalizeDataType(yAxis);
  const normalizedXAxis = normalizeXAxis(xAxis);
  
  const isCompatible = COMPATIBILITY_MATRIX[normalizedYAxis]?.[normalizedXAxis] ?? false;
  const isValidAgg = VALID_AGGREGATIONS[normalizedYAxis]?.includes(aggregation) ?? false;
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
