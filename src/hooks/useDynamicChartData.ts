import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ChartConfig, AggregationFilter } from './useDashboardPersonalization';
import { applyDynamicTitle, generateChartTitle } from '@/lib/dynamicTitles';

interface ChartDataPoint {
  name: string;
  value: number;
}

export function useDynamicChartData(config: ChartConfig) {
  const { activeTenant } = useAuth();
  
  // Aplicar título dinâmico se habilitado
  const optimizedConfig = applyDynamicTitle(config, generateChartTitle);

  return useQuery({
    queryKey: [
      'dynamic-chart', 
      optimizedConfig.id, 
      optimizedConfig.type, 
      optimizedConfig.yAxis.type, 
      optimizedConfig.xAxis,
      optimizedConfig.aggregationFilters,
      optimizedConfig.commissionConfig,
      activeTenant?.tenant_id
    ],
    queryFn: async (): Promise<ChartDataPoint[]> => {
      if (!activeTenant?.tenant_id) throw new Error('No active tenant');

      return await getChartData(optimizedConfig, activeTenant.tenant_id);
    },
    enabled: !!activeTenant?.tenant_id,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
  });
}

async function getChartData(config: ChartConfig, tenantId: string): Promise<ChartDataPoint[]> {
  const selectFields = getSelectFields(config);
  let query;

  // Criar query específica por tipo para garantir tipagem correta
  switch (config.yAxis.type) {
    case 'sales':
      query = supabase.from('sales')
        .select(selectFields)
        .eq('tenant_id', tenantId)
        .eq('status', 'approved');
      break;
    case 'commissions':
      query = supabase.from('commissions')
        .select(selectFields)
        .eq('tenant_id', tenantId);
      
      // Aplicar filtros de comissão se especificados
      if (config.commissionConfig) {
        const types = [];
        if (config.commissionConfig.includeOffice) types.push('office');
        if (config.commissionConfig.includeSeller) types.push('seller');
        if (types.length > 0) {
          query = query.in('commission_type', types);
        }
      }
      break;
    case 'clients':
      query = supabase.from('clients')
        .select(selectFields)
        .eq('tenant_id', tenantId);
      break;
    case 'sellers':
      query = supabase.from('tenant_users')
        .select(selectFields)
        .eq('tenant_id', tenantId)
        .eq('active', true);
      break;
    case 'goals':
      query = supabase.from('goals')
        .select(selectFields)
        .eq('tenant_id', tenantId);
      break;
    case 'products':
      query = supabase.from('consortium_products')
        .select(selectFields)
        .eq('tenant_id', tenantId);
      break;
    default:
      query = supabase.from('sales')
        .select(selectFields)
        .eq('tenant_id', tenantId);
  }

  const { data, error } = await query;

  if (error) throw error;

  return processChartData(data || [], config);
}

function getTableName(type: string): string {
  switch (type) {
    case 'sales': return 'sales';
    case 'commissions': return 'commissions';
    case 'clients': return 'clients';
    case 'sellers': return 'tenant_users';
    case 'goals': return 'goals';
    case 'products': return 'consortium_products';
    default: return 'sales';
  }
}

function getSelectFields(config: ChartConfig): string {
  const valueField = getValueField(config.yAxis.type);
  
  switch (config.xAxis) {
    case 'time':
      const dateField = getDateField(config.yAxis.type);
      return `${valueField}, ${dateField}`;
    
    case 'products':
      return `${valueField}, product_id, consortium_products(name)`;
    
    case 'sellers':
      return `${valueField}, seller_id, profiles(full_name)`;
    
    case 'offices':
      return `${valueField}, office_id, offices(name)`;
    
    default:
      const defaultDateField = getDateField(config.yAxis.type);
      return `${valueField}, ${defaultDateField}`;
  }
}

function getValueField(type: string): string {
  switch (type) {
    case 'sales': return 'sale_value';
    case 'commissions': return 'commission_amount';
    case 'goals': return 'target_amount';
    default: return 'id';
  }
}

function getDateField(type: string): string {
  switch (type) {
    case 'sales': return 'sale_date';
    case 'commissions': return 'due_date';
    case 'clients': return 'created_at';
    case 'sellers': return 'joined_at';
    case 'goals': return 'created_at';
    default: return 'created_at';
  }
}

function processChartData(data: any[], config: ChartConfig): ChartDataPoint[] {
  if (!data.length) return [];

  // Aplicar filtros de agregação se especificados
  let processedData = data;
  
  if (config.aggregationFilters) {
    processedData = applyAggregationFilters(data, config);
  }

  switch (config.xAxis) {
    case 'time':
      return processTimeData(processedData, config);
    
    case 'products':
      return processProductData(processedData, config);
    
    case 'sellers':
      return processSellerData(processedData, config);
    
    case 'offices':
      return processOfficeData(processedData, config);
    
    default:
      return processTimeData(processedData, config);
  }
}

function processTimeData(data: any[], config: ChartConfig): ChartDataPoint[] {
  const dateField = getDateField(config.yAxis.type);
  const valueField = getValueField(config.yAxis.type);
  
  // Agrupar por mês com otimização
  const monthlyData = new Map<string, { count: number; sum: number; values: number[] }>();
  
  data.forEach(item => {
    const date = new Date(item[dateField]);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!monthlyData.has(monthKey)) {
      monthlyData.set(monthKey, { count: 0, sum: 0, values: [] });
    }
    
    const monthData = monthlyData.get(monthKey)!;
    monthData.count++;
    
    if (config.yAxis.aggregation !== 'count' && config.yAxis.aggregation !== 'count_distinct') {
      const value = parseFloat(item[valueField] || 0);
      monthData.sum += isNaN(value) ? 0 : value;
      monthData.values.push(value);
    }
  });
  
  // Converter para array e calcular valores finais
  const result = Array.from(monthlyData.entries())
    .map(([monthKey, data]) => {
      let value: number;
      
      switch (config.yAxis.aggregation) {
        case 'count':
        case 'count_distinct':
          value = data.count;
          break;
        case 'sum':
          value = data.sum;
          break;
        case 'avg':
          value = data.values.length > 0 ? data.sum / data.values.length : 0;
          break;
        case 'min':
          value = data.values.length > 0 ? Math.min(...data.values) : 0;
          break;
        case 'max':
          value = data.values.length > 0 ? Math.max(...data.values) : 0;
          break;
        default:
          value = data.sum;
      }
      
      return {
        name: formatMonth(monthKey),
        value,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name))
    .slice(-6); // Últimos 6 meses
  
  return result;
}

function processProductData(data: any[], config: ChartConfig): ChartDataPoint[] {
  const valueField = getValueField(config.yAxis.type);
  const grouped = groupAndAggregateData(data, 'product_id', valueField, config.yAxis.aggregation || 'sum');
  
  let result = Array.from(grouped.entries())
    .map(([productId, value]) => ({
      name: `Produto ${productId.slice(0, 8)}`,
      value
    }))
    .sort((a, b) => b.value - a.value);

  // Aplicar lógica de "Others" se configurado
  if (config.aggregationFilters?.products?.type === 'others' && result.length > 5) {
    const top5 = result.slice(0, 5);
    const othersValue = result.slice(5).reduce((sum, item) => sum + item.value, 0);
    
    if (othersValue > 0) {
      top5.push({
        name: config.aggregationFilters.products.otherLabel || 'Outros Produtos',
        value: othersValue
      });
    }
    
    return top5;
  }

  return result.slice(0, 10);
}

function processSellerData(data: any[], config: ChartConfig): ChartDataPoint[] {
  const valueField = getValueField(config.yAxis.type);
  const grouped = groupAndAggregateData(data, 'seller_id', valueField, config.yAxis.aggregation || 'sum');
  
  let result = Array.from(grouped.entries())
    .map(([sellerId, value]) => ({
      name: `Vendedor ${sellerId.slice(0, 8)}`,
      value
    }))
    .sort((a, b) => b.value - a.value);

  // Aplicar lógica de "Others" se configurado
  if (config.aggregationFilters?.sellers?.type === 'others' && result.length > 5) {
    const top5 = result.slice(0, 5);
    const othersValue = result.slice(5).reduce((sum, item) => sum + item.value, 0);
    
    if (othersValue > 0) {
      top5.push({
        name: config.aggregationFilters.sellers.otherLabel || 'Outros Vendedores',
        value: othersValue
      });
    }
    
    return top5;
  }

  return result.slice(0, 10);
}

function processOfficeData(data: any[], config: ChartConfig): ChartDataPoint[] {
  const valueField = getValueField(config.yAxis.type);
  const grouped = groupAndAggregateData(data, 'office_id', valueField, config.yAxis.aggregation || 'sum');
  
  return Array.from(grouped.entries())
    .map(([officeId, value]) => ({
      name: `Escritório ${officeId.slice(0, 8)}`,
      value
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);
}

/**
 * Função utilitária para agrupar e agregar dados
 */
function groupAndAggregateData(
  data: any[], 
  groupField: string, 
  valueField: string, 
  aggregation: string
): Map<string, number> {
  const grouped = new Map<string, { count: number; sum: number; values: number[] }>();
  
  data.forEach(item => {
    const groupKey = item[groupField] || 'N/A';
    
    if (!grouped.has(groupKey)) {
      grouped.set(groupKey, { count: 0, sum: 0, values: [] });
    }
    
    const groupData = grouped.get(groupKey)!;
    groupData.count++;
    
    if (aggregation !== 'count' && aggregation !== 'count_distinct') {
      const value = parseFloat(item[valueField] || 0);
      if (!isNaN(value)) {
        groupData.sum += value;
        groupData.values.push(value);
      }
    }
  });
  
  // Calcular valores finais baseado na agregação
  const result = new Map<string, number>();
  
  grouped.forEach((data, key) => {
    let finalValue: number;
    
    switch (aggregation) {
      case 'count':
      case 'count_distinct':
        finalValue = data.count;
        break;
      case 'avg':
        finalValue = data.values.length > 0 ? data.sum / data.values.length : 0;
        break;
      case 'min':
        finalValue = data.values.length > 0 ? Math.min(...data.values) : 0;
        break;
      case 'max':
        finalValue = data.values.length > 0 ? Math.max(...data.values) : 0;
        break;
      case 'sum':
      default:
        finalValue = data.sum;
    }
    
    result.set(key, finalValue);
  });
  
  return result;
}

function applyAggregationFilters(data: any[], config: ChartConfig): any[] {
  let filteredData = data;

  // Aplicar filtros de produtos
  if (config.aggregationFilters?.products) {
    filteredData = applySpecificFilter(
      filteredData,
      config.aggregationFilters.products,
      'product_id'
    );
  }

  // Aplicar filtros de escritórios
  if (config.aggregationFilters?.offices) {
    filteredData = applySpecificFilter(
      filteredData,
      config.aggregationFilters.offices,
      'office_id'
    );
  }

  // Aplicar filtros de vendedores
  if (config.aggregationFilters?.sellers) {
    filteredData = applySpecificFilter(
      filteredData,
      config.aggregationFilters.sellers,
      'seller_id'
    );
  }

  return filteredData;
}

function applySpecificFilter(data: any[], filter: AggregationFilter, fieldName: string): any[] {
  if (filter.type === 'specific' && filter.selectedIds) {
    return data.filter(item => filter.selectedIds!.includes(item[fieldName]));
  }
  return data;
}

function formatMonth(monthKey: string): string {
  const [year, month] = monthKey.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString('pt-BR', { 
    year: '2-digit', 
    month: 'short' 
  });
}