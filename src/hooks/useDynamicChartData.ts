import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ChartConfig, AggregationFilter } from './useDashboardPersonalization';
import { applyDynamicTitle, generateChartTitle } from '@/lib/dynamicTitles';

// Cache inteligente por tipo de dado (gráficos)
const getStaleTimeByType = (dataType: string): number => {
  switch (dataType) {
    case 'commissions':
      return 2 * 60 * 1000; // 2 minutos para comissões
    case 'sales':
      return 5 * 60 * 1000; // 5 minutos para vendas
    case 'clients':
      return 10 * 60 * 1000; // 10 minutos para clientes
    default:
      return 5 * 60 * 1000; // 5 minutos padrão
  }
};

const getGcTimeByType = (dataType: string): number => {
  switch (dataType) {
    case 'commissions':
      return 5 * 60 * 1000; // 5 minutos para comissões
    case 'sales':
      return 10 * 60 * 1000; // 10 minutos para vendas
    case 'clients':
      return 15 * 60 * 1000; // 15 minutos para clientes
    default:
      return 10 * 60 * 1000; // 10 minutos padrão
  }
};

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
    staleTime: getStaleTimeByType(optimizedConfig.yAxis.type), // Cache inteligente por tipo
    gcTime: getGcTimeByType(optimizedConfig.yAxis.type), // TTL diferenciado
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
      return `${valueField}, product_id, consortium_products!inner(name)`;
    
    case 'sellers':
      // Para comissões, usar recipient_id + commission_type
      if (config.yAxis.type === 'commissions') {
        return `${valueField}, recipient_id, commission_type, profiles!commissions_recipient_id_fkey(full_name)`;
      }
      // Para vendas, usar seller_id
      if (config.yAxis.type === 'sales') {
        return `${valueField}, seller_id, profiles!sales_seller_id_fkey(full_name)`;
      }
      return `${valueField}, seller_id, profiles(full_name)`;
    
    case 'offices':
      return `${valueField}, office_id, offices!inner(name)`;
    
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
  
  // Agrupar dados com nomes de produtos
  const productMap = new Map<string, { name: string; values: number[] }>();
  
  data.forEach(item => {
    const productId = item.product_id;
    const productName = item.consortium_products?.name || `Produto ${productId?.slice(0, 8) || 'N/A'}`;
    const value = parseFloat(item[valueField] || 0);
    
    if (!productMap.has(productId)) {
      productMap.set(productId, { name: productName, values: [] });
    }
    
    productMap.get(productId)!.values.push(value);
  });

  // Calcular agregação e converter para array
  let result = Array.from(productMap.entries())
    .map(([productId, data]) => {
      const aggregatedValue = aggregateValues(data.values, config.yAxis.aggregation || 'sum');
      return {
        name: data.name,
        value: aggregatedValue
      };
    })
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
  
  // Agrupar dados com nomes de vendedores
  const sellerMap = new Map<string, { name: string; values: number[] }>();
  
  data.forEach(item => {
    let sellerId: string;
    let sellerName: string;
    
    // Para comissões, usar recipient_id e filtrar por commission_type
    if (config.yAxis.type === 'commissions') {
      // Se configurado para mostrar apenas sellers
      if (config.commissionConfig?.includeSeller === true && 
          config.commissionConfig?.includeOffice === false) {
        // Filtrar apenas comissões de vendedores
        if (item.commission_type !== 'seller') return;
      }
      
      // Se configurado para mostrar apenas offices
      if (config.commissionConfig?.includeOffice === true && 
          config.commissionConfig?.includeSeller === false) {
        // Filtrar apenas comissões de escritórios
        if (item.commission_type !== 'office') return;
      }
      
      sellerId = item.recipient_id;
      sellerName = item.profiles?.full_name || `Vendedor ${sellerId?.slice(0, 8) || 'N/A'}`;
    } else {
      // Para outros tipos, usar seller_id
      sellerId = item.seller_id;
      sellerName = item.profiles?.full_name || `Vendedor ${sellerId?.slice(0, 8) || 'N/A'}`;
    }
    
    if (!sellerId) return; // Pular itens sem vendedor
    
    const value = parseFloat(item[valueField] || 0);
    
    if (!sellerMap.has(sellerId)) {
      sellerMap.set(sellerId, { name: sellerName, values: [] });
    }
    
    sellerMap.get(sellerId)!.values.push(value);
  });

  // Calcular agregação e converter para array
  let result = Array.from(sellerMap.entries())
    .map(([sellerId, data]) => {
      const aggregatedValue = aggregateValues(data.values, config.yAxis.aggregation || 'sum');
      return {
        name: data.name,
        value: aggregatedValue
      };
    })
    .filter(item => item.value > 0) // Filtrar itens com valor zero
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
  
  // Agrupar dados com nomes de escritórios
  const officeMap = new Map<string, { name: string; values: number[] }>();
  
  data.forEach(item => {
    const officeId = item.office_id;
    const officeName = item.offices?.name || `Escritório ${officeId?.slice(0, 8) || 'N/A'}`;
    const value = parseFloat(item[valueField] || 0);
    
    if (!officeMap.has(officeId)) {
      officeMap.set(officeId, { name: officeName, values: [] });
    }
    
    officeMap.get(officeId)!.values.push(value);
  });

  // Calcular agregação e converter para array
  return Array.from(officeMap.entries())
    .map(([officeId, data]) => {
      const aggregatedValue = aggregateValues(data.values, config.yAxis.aggregation || 'sum');
      return {
        name: data.name,
        value: aggregatedValue
      };
    })
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);
}

function aggregateValues(values: number[], aggregation: string): number {
  if (values.length === 0) return 0;
  
  switch (aggregation) {
    case 'sum':
      return values.reduce((sum, val) => sum + val, 0);
    case 'avg':
      return values.reduce((sum, val) => sum + val, 0) / values.length;
    case 'min':
      return Math.min(...values);
    case 'max':
      return Math.max(...values);
    case 'count':
    case 'count_distinct':
      return values.length;
    default:
      return values.reduce((sum, val) => sum + val, 0);
  }
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