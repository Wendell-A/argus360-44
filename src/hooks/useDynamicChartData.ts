import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ChartConfig, AggregationFilter } from './useDashboardPersonalization';
import { applyDynamicTitle, generateChartTitle } from '@/lib/dynamicTitles';
import { normalizeXAxis, normalizeDataType } from '@/lib/dimensions';
import { useDashboardFiltersStore } from '@/stores/useDashboardFiltersStore';

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

function getDateFieldByType(type: string): string | null {
  switch (type) {
    case 'sales':
      return 'sale_date';
    case 'commissions':
      return 'due_date';
    case 'clients':
      return 'created_at';
    case 'goals':
      return 'created_at';
    default:
      return null;
  }
}

export function useDynamicChartData(config: ChartConfig) {
  const { activeTenant } = useAuth();
  const { filters, isActive } = useDashboardFiltersStore();
  
  // Normalizar xAxis para evitar conflitos plural/singular
  const normalizedXAxis = normalizeXAxis(config.xAxis);
  
  // Aplicar título dinâmico e normalização
  const optimizedConfig = {
    ...applyDynamicTitle(config, generateChartTitle),
    xAxis: normalizedXAxis,
  };

  // Converter year/month/start-end em datas para filtros globais
  let globalStart: string | null = filters.startDate?.toISOString().split('T')[0] || null;
  let globalEnd: string | null = filters.endDate?.toISOString().split('T')[0] || null;
  if (isActive && filters.year && !filters.startDate && !filters.endDate) {
    if (filters.month) {
      const y = filters.year;
      const m = filters.month;
      const last = new Date(y, m, 0).getDate();
      globalStart = `${y}-${String(m).padStart(2, '0')}-01`;
      globalEnd = `${y}-${String(m).padStart(2, '0')}-${last}`;
    } else {
      globalStart = `${filters.year}-01-01`;
      globalEnd = `${filters.year}-12-31`;
    }
  }

  return useQuery({
    queryKey: [
      'dynamic-chart', 
      optimizedConfig.id, 
      optimizedConfig.type, 
      optimizedConfig.yAxis.type, 
      normalizedXAxis,
      optimizedConfig.aggregationFilters,
      optimizedConfig.commissionConfig,
      activeTenant?.tenant_id,
      isActive,
      globalStart,
      globalEnd,
      filters.officeIds,
      filters.productIds,
    ],
    queryFn: async (): Promise<ChartDataPoint[]> => {
      if (!activeTenant?.tenant_id) throw new Error('No active tenant');

      return await getChartData(optimizedConfig, activeTenant.tenant_id, {
        isActive,
        start: globalStart,
        end: globalEnd,
        officeIds: filters.officeIds,
        productIds: filters.productIds,
      });
    },
    enabled: !!activeTenant?.tenant_id,
    staleTime: getStaleTimeByType(optimizedConfig.yAxis.type), // Cache inteligente por tipo
    gcTime: getGcTimeByType(optimizedConfig.yAxis.type), // TTL diferenciado
  });
}

async function getChartData(config: ChartConfig, tenantId: string, globalFilters?: { isActive: boolean; start: string | null; end: string | null; officeIds: string[]; productIds: string[]; }): Promise<ChartDataPoint[]> {
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
        const types = [] as string[];
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

  // Aplicar filtros globais (ano/mês/período e ids) quando ativos
  if (globalFilters?.isActive) {
    const dateField = getDateFieldByType(config.yAxis.type);
    if (dateField && globalFilters.start && globalFilters.end) {
      query = query.gte(dateField, globalFilters.start).lte(dateField, globalFilters.end);
    }

    // Filtros por produtos/escritórios apenas quando aplicáveis
    if (config.yAxis.type === 'sales') {
      if (globalFilters.productIds?.length) {
        query = query.in('product_id', globalFilters.productIds);
      }
      if (globalFilters.officeIds?.length) {
        query = query.in('office_id', globalFilters.officeIds);
      }
    }
  }

  const { data, error } = await query;

  if (error) throw error;

  // Se for comissões com vendedores/offices, buscar nomes dos profiles/offices
  let processedData = data || [];
  const normalizedXAxis = normalizeXAxis(config.xAxis);
  if (config.yAxis.type === 'commissions' && (normalizedXAxis === 'sellers' || normalizedXAxis === 'offices')) {
    processedData = await enrichCommissionData(processedData, normalizedXAxis, tenantId);
  }

  return processChartData(processedData, config);
}

// Função auxiliar para enriquecer dados de comissões com nomes
async function enrichCommissionData(data: any[], axis: string, tenantId: string): Promise<any[]> {
  if (!data.length) return data;
  
  const recipientIds = [...new Set(data.map(item => item.recipient_id))].filter(Boolean);
  if (!recipientIds.length) return data;

  if (axis === 'sellers') {
    // IMPORTANTE: Buscar via tenant_users primeiro para garantir contexto do tenant
    const { data: tenantUsers, error: tuError } = await supabase
      .from('tenant_users')
      .select('user_id, active')
      .eq('tenant_id', tenantId)
      .eq('active', true)
      .in('user_id', recipientIds as string[]);

    if (tuError) {
      console.error('[enrichCommissionData] Erro ao buscar tenant_users:', tuError);
      return data;
    }

    const validUserIds = tenantUsers?.map(tu => tu.user_id) || [];
    
    if (validUserIds.length === 0) {
      return data;
    }

    // Agora buscar nomes em profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', validUserIds);

    if (profilesError) {
      console.error('[enrichCommissionData] Erro ao buscar profiles:', profilesError);
    }
    
    const profileMap = new Map(
      profiles?.map(p => [p.id, p.full_name || `Vendedor ${p.id.slice(0, 8)}`]) || []
    );
    
    return data.map(item => ({
      ...item,
      recipient_name: profileMap.get(item.recipient_id) || `Vendedor ${item.recipient_id?.slice(0, 8)}`
    }));
  } else if (axis === 'offices') {
    // Buscar nomes dos escritórios
    const { data: offices } = await supabase
      .from('offices')
      .select('id, name')
      .in('id', recipientIds)
      .eq('tenant_id', tenantId);
    
    const officeMap = new Map(offices?.map(o => [o.id, o.name]) || []);
    
    return data.map(item => ({
      ...item,
      recipient_name: officeMap.get(item.recipient_id) || `Escritório ${item.recipient_id?.slice(0, 8)}`
    }));
  }

  return data;
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
  const baseFields = 'id, tenant_id, created_at';
  const yType = config.yAxis.type;
  const xType = config.xAxis;
  
  switch (yType) {
    case 'sales':
      let salesSelect = `${baseFields}, sale_value, sale_date, seller_id, product_id, office_id, status`;
      
      // Se X-axis é produtos, incluir JOIN com consortium_products
      if (xType === 'products') {
        salesSelect += `, consortium_products(name)`;
      }
      
      // Se X-axis é clientes, incluir client_id e JOIN com clients
      if (xType === 'clients') {
        salesSelect += `, client_id, clients(name)`;
      }
      
      return salesSelect;
    
    case 'commissions':
      // CRITICAL: Não fazer JOIN direto com profiles/offices
      // recipient_id não tem FK - enriquecer dados depois
      let commSelect = `${baseFields}, commission_amount, due_date, recipient_id, recipient_type, commission_type, sale_id`;
      
      // Se X-axis é produto, precisamos do JOIN com sales -> consortium_products
      if (xType === 'products') {
        commSelect += `, sales!inner(product_id, consortium_products(name))`;
      }
      
      // Se X-axis é clientes, precisamos do JOIN com sales -> clients
      if (xType === 'clients') {
        commSelect += `, sales!inner(client_id, clients(name))`;
      }
      
      return commSelect;
    
    case 'clients':
      // Clientes podem ser agrupados por vendedor (responsible_user_id) ou escritório
      let clientSelect = `${baseFields}, name, responsible_user_id, office_id`;
      
      if (xType === 'sellers') {
        clientSelect += `, profiles!clients_responsible_user_id_fkey(full_name)`;
      }
      
      return clientSelect;
    
    case 'sellers':
      // Vendedores sempre vem de tenant_users com JOIN para profiles
      return `${baseFields}, profiles!inner(full_name, id)`;
    
    case 'goals':
      // Metas podem ser individuais (user_id) ou de escritório (office_id)
      let goalsSelect = `${baseFields}, target_amount, current_amount, goal_type, user_id, office_id`;
      
      if (xType === 'sellers') {
        goalsSelect += `, profiles!goals_user_id_fkey(full_name)`;
      }
      
      return goalsSelect;
    
    case 'products':
      return `${baseFields}, name, commission_rate`;
    
    default:
      return baseFields;
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

  // Normalizar xAxis para garantir compatibilidade
  const normalizedXAxis = normalizeXAxis(config.xAxis);

  switch (normalizedXAxis) {
    case 'time':
      return processTimeData(processedData, config);
    
    case 'products':
      return processProductData(processedData, config);
    
    case 'sellers':
      return processSellerData(processedData, config);
    
    case 'offices':
      return processOfficeData(processedData, config);
    
    case 'clients':
      return processClientData(processedData, config);
    
    default:
      console.warn(`[processChartData] Eixo X desconhecido: ${normalizedXAxis}`);
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
  // Sort chronologically by monthKey (YYYY-MM format) BEFORE formatting
  const result = Array.from(monthlyData.entries())
    .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
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
    .slice(-6); // Últimos 6 meses
  
  return result;
}

function processProductData(data: any[], config: ChartConfig): ChartDataPoint[] {
  const valueField = getValueField(config.yAxis.type);
  
  // Agrupar dados com nomes de produtos
  const productMap = new Map<string, { name: string; values: number[] }>();
  
  data.forEach(item => {
    let productId: string;
    let productName: string;

    // Para comissões, buscar via sales.consortium_products
    if (config.yAxis.type === 'commissions' && item.sales?.consortium_products) {
      productId = item.sales.product_id;
      productName = item.sales.consortium_products.name;
    } else {
      productId = item.product_id;
      productName = item.consortium_products?.name || `Produto ${productId?.slice(0, 8) || 'N/A'}`;
    }
    
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
    
    // Para comissões, usar recipient_id e nome enriquecido
    if (config.yAxis.type === 'commissions') {
      // Filtrar por commission_type se configurado
      if (config.commissionConfig?.includeSeller === true && 
          config.commissionConfig?.includeOffice === false) {
        if (item.commission_type !== 'seller') return;
      }
      
      if (config.commissionConfig?.includeOffice === true && 
          config.commissionConfig?.includeSeller === false) {
        if (item.commission_type !== 'office') return;
      }
      
      sellerId = item.recipient_id;
      sellerName = item.recipient_name || `Vendedor ${sellerId?.slice(0, 8) || 'N/A'}`;
    } else {
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
    let officeId: string;
    let officeName: string;

    // Para comissões, usar recipient_id e nome enriquecido
    if (config.yAxis.type === 'commissions') {
      officeId = item.recipient_id;
      officeName = item.recipient_name || `Escritório ${officeId?.slice(0, 8) || 'N/A'}`;
    } else {
      officeId = item.office_id;
      officeName = item.offices?.name || `Escritório ${officeId?.slice(0, 8) || 'N/A'}`;
    }
    
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

function processClientData(data: any[], config: ChartConfig): ChartDataPoint[] {
  const valueField = getValueField(config.yAxis.type);
  
  // Agrupar dados com nomes de clientes
  const clientMap = new Map<string, { name: string; values: number[] }>();
  
  data.forEach(item => {
    let clientId: string;
    let clientName: string;
    
    // Para comissões, buscar via sales.clients
    if (config.yAxis.type === 'commissions' && item.sales?.clients) {
      clientId = item.sales.client_id;
      clientName = item.sales.clients.name;
    } else if (config.yAxis.type === 'sales') {
      clientId = item.client_id;
      clientName = item.clients?.name || `Cliente ${clientId?.slice(0, 8) || 'N/A'}`;
    } else {
      // Para outros tipos, pular se não tiver client_id
      return;
    }
    
    if (!clientId) return; // Pular itens sem cliente
    
    const value = parseFloat(item[valueField] || 0);
    
    if (!clientMap.has(clientId)) {
      clientMap.set(clientId, { name: clientName, values: [] });
    }
    
    clientMap.get(clientId)!.values.push(value);
  });

  // Calcular agregação e converter para array
  let result = Array.from(clientMap.entries())
    .map(([clientId, data]) => {
      const aggregatedValue = aggregateValues(data.values, config.yAxis.aggregation || 'sum');
      return {
        name: data.name,
        value: aggregatedValue
      };
    })
    .filter(item => item.value > 0) // Filtrar itens com valor zero
    .sort((a, b) => b.value - a.value);

  // Aplicar lógica de "Others" se configurado
  if (config.aggregationFilters?.clients?.type === 'others' && result.length > 5) {
    const top5 = result.slice(0, 5);
    const othersValue = result.slice(5).reduce((sum, item) => sum + item.value, 0);
    
    if (othersValue > 0) {
      top5.push({
        name: config.aggregationFilters.clients.otherLabel || 'Outros Clientes',
        value: othersValue
      });
    }
    
    return top5;
  }

  return result.slice(0, 10);
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