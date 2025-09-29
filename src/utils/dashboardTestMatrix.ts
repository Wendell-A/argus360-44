import { ChartConfig } from '@/hooks/useDashboardPersonalization';

/**
 * Matriz de Teste para Dashboard Personalizável
 * 
 * Testa sistematicamente todas as 144 combinações possíveis:
 * - 6 tipos de Y-axis (sales, commissions, clients, sellers, goals, products)
 * - 4 tipos de X-axis (time, product, seller, office)
 * - 6 tipos de agregação (sum, count, count_distinct, avg, min, max)
 */

export type YAxisType = 'sales' | 'commissions' | 'clients' | 'sellers' | 'goals' | 'products';
export type XAxisType = 'time' | 'product' | 'seller' | 'office';
export type AggregationType = 'sum' | 'count' | 'count_distinct' | 'avg' | 'min' | 'max';

export interface TestCase {
  id: number;
  yAxis: YAxisType;
  xAxis: XAxisType;
  aggregation: AggregationType;
  expectedValid: boolean;
  description: string;
}

export interface TestResult {
  testCase: TestCase;
  status: 'success' | 'query_error' | 'empty_data' | 'processing_error' | 'invalid_combination';
  error?: string;
  dataPoints?: number;
  timestamp: string;
}

/**
 * Matriz de compatibilidade - combinações que fazem sentido semanticamente
 */
const COMPATIBILITY_MATRIX: Record<YAxisType, Record<XAxisType, boolean>> = {
  sales: {
    time: true,      // Vendas ao longo do tempo ✓
    product: true,   // Vendas por produto ✓
    seller: true,    // Vendas por vendedor ✓
    office: true,    // Vendas por escritório ✓
  },
  commissions: {
    time: true,      // Comissões ao longo do tempo ✓
    product: true,   // Comissões por produto ✓
    seller: true,    // Comissões por vendedor ✓
    office: true,    // Comissões por escritório ✓
  },
  clients: {
    time: true,      // Clientes ao longo do tempo ✓
    product: false,  // Clientes por produto ✗ (não tem FK direto)
    seller: true,    // Clientes por vendedor responsável ✓
    office: true,    // Clientes por escritório ✓
  },
  sellers: {
    time: false,     // Vendedores ao longo do tempo ✗ (não tem data)
    product: false,  // Vendedores por produto ✗ (não tem FK direto)
    seller: false,   // Vendedores por vendedor ✗ (não faz sentido)
    office: true,    // Vendedores por escritório ✓
  },
  goals: {
    time: true,      // Metas ao longo do tempo ✓
    product: false,  // Metas por produto ✗ (não tem FK direto)
    seller: true,    // Metas individuais por vendedor ✓
    office: true,    // Metas por escritório ✓
  },
  products: {
    time: false,     // Produtos ao longo do tempo ✗ (não tem data)
    product: false,  // Produtos por produto ✗ (não faz sentido)
    seller: false,   // Produtos por vendedor ✗ (não tem FK direto)
    office: false,   // Produtos por escritório ✗ (não tem FK direto)
  },
};

/**
 * Agregações válidas por tipo de Y-axis
 */
const VALID_AGGREGATIONS: Record<YAxisType, AggregationType[]> = {
  sales: ['sum', 'count', 'avg', 'min', 'max'],
  commissions: ['sum', 'count', 'avg', 'min', 'max'],
  clients: ['count', 'count_distinct'],
  sellers: ['count', 'count_distinct'],
  goals: ['sum', 'count', 'avg', 'min', 'max'],
  products: ['count', 'count_distinct'],
};

/**
 * Gera todos os casos de teste (144 combinações)
 */
export function generateTestCases(): TestCase[] {
  const yAxisTypes: YAxisType[] = ['sales', 'commissions', 'clients', 'sellers', 'goals', 'products'];
  const xAxisTypes: XAxisType[] = ['time', 'product', 'seller', 'office'];
  const aggregations: AggregationType[] = ['sum', 'count', 'count_distinct', 'avg', 'min', 'max'];

  const testCases: TestCase[] = [];
  let id = 1;

  for (const yAxis of yAxisTypes) {
    for (const xAxis of xAxisTypes) {
      for (const aggregation of aggregations) {
        const isCompatible = COMPATIBILITY_MATRIX[yAxis][xAxis];
        const isValidAggregation = VALID_AGGREGATIONS[yAxis].includes(aggregation);
        const expectedValid = isCompatible && isValidAggregation;

        testCases.push({
          id: id++,
          yAxis,
          xAxis,
          aggregation,
          expectedValid,
          description: `${yAxis} (${aggregation}) por ${xAxis}`,
        });
      }
    }
  }

  return testCases;
}

/**
 * Converte caso de teste para configuração de gráfico
 */
export function testCaseToChartConfig(testCase: TestCase, tenantId: string): ChartConfig {
  return {
    id: `test-${testCase.id}`,
    type: 'bar',
    title: testCase.description,
    yAxis: {
      id: `yaxis-${testCase.id}`,
      type: testCase.yAxis as any,
      title: testCase.yAxis,
      aggregation: testCase.aggregation,
    },
    xAxis: testCase.xAxis as any,
  };
}

/**
 * Determina o campo correto baseado no Y-axis e agregação
 */
function getFieldForYAxis(yAxis: YAxisType, aggregation: AggregationType): string {
  const fieldMap: Record<YAxisType, string> = {
    sales: aggregation === 'count' ? 'id' : 'sale_value',
    commissions: aggregation === 'count' ? 'id' : 'commission_amount',
    clients: 'id',
    sellers: 'id',
    goals: aggregation === 'count' ? 'id' : 'target_amount',
    products: 'id',
  };

  return fieldMap[yAxis];
}

/**
 * Valida se uma combinação é semanticamente válida
 */
export function isValidCombination(yAxis: YAxisType, xAxis: XAxisType, aggregation: AggregationType): boolean {
  const isCompatible = COMPATIBILITY_MATRIX[yAxis][xAxis];
  const isValidAggregation = VALID_AGGREGATIONS[yAxis].includes(aggregation);
  return isCompatible && isValidAggregation;
}

/**
 * Obtém motivo de invalidação
 */
export function getInvalidReason(yAxis: YAxisType, xAxis: XAxisType, aggregation: AggregationType): string | null {
  const isCompatible = COMPATIBILITY_MATRIX[yAxis][xAxis];
  const isValidAggregation = VALID_AGGREGATIONS[yAxis].includes(aggregation);

  if (!isCompatible && !isValidAggregation) {
    return `Combinação ${yAxis} x ${xAxis} não é compatível e agregação ${aggregation} não é válida para ${yAxis}`;
  }
  
  if (!isCompatible) {
    return `Combinação ${yAxis} x ${xAxis} não é compatível (sem relacionamento direto no banco)`;
  }
  
  if (!isValidAggregation) {
    return `Agregação ${aggregation} não é válida para tipo ${yAxis}`;
  }

  return null;
}

/**
 * Categoriza resultados de teste
 */
export function categorizeResults(results: TestResult[]) {
  return {
    total: results.length,
    success: results.filter(r => r.status === 'success').length,
    queryError: results.filter(r => r.status === 'query_error').length,
    emptyData: results.filter(r => r.status === 'empty_data').length,
    processingError: results.filter(r => r.status === 'processing_error').length,
    invalidCombination: results.filter(r => r.status === 'invalid_combination').length,
    expectedValid: results.filter(r => r.testCase.expectedValid).length,
    expectedInvalid: results.filter(r => !r.testCase.expectedValid).length,
  };
}

/**
 * Exporta resultados em formato JSON
 */
export function exportTestResults(results: TestResult[]): string {
  const summary = categorizeResults(results);
  
  return JSON.stringify({
    timestamp: new Date().toISOString(),
    summary,
    results: results.map(r => ({
      id: r.testCase.id,
      description: r.testCase.description,
      status: r.status,
      expectedValid: r.testCase.expectedValid,
      error: r.error,
      dataPoints: r.dataPoints,
    })),
  }, null, 2);
}
