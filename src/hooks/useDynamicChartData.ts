import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ChartConfig } from './useDashboardPersonalization';

interface ChartDataPoint {
  name: string;
  value: number;
}

export function useDynamicChartData(config: ChartConfig) {
  const { activeTenant } = useAuth();

  return useQuery({
    queryKey: ['dynamic-chart', config.id, config.type, config.yAxis.type, config.xAxis, activeTenant?.tenant_id],
    queryFn: async (): Promise<ChartDataPoint[]> => {
      if (!activeTenant?.tenant_id) throw new Error('No active tenant');

      return await getChartData(config, activeTenant.tenant_id);
    },
    enabled: !!activeTenant?.tenant_id,
    staleTime: 5 * 60 * 1000, // 5 minutos
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

  switch (config.xAxis) {
    case 'time':
      return processTimeData(data, config);
    
    case 'products':
      return processProductData(data, config);
    
    case 'sellers':
      return processSellerData(data, config);
    
    case 'offices':
      return processOfficeData(data, config);
    
    default:
      return processTimeData(data, config);
  }
}

function processTimeData(data: any[], config: ChartConfig): ChartDataPoint[] {
  const dateField = getDateField(config.yAxis.type);
  const valueField = getValueField(config.yAxis.type);
  
  // Agrupar por mês
  const monthlyData: { [key: string]: number } = {};
  
  data.forEach(item => {
    const date = new Date(item[dateField]);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (config.yAxis.aggregation === 'count') {
      monthlyData[monthKey] = (monthlyData[monthKey] || 0) + 1;
    } else {
      monthlyData[monthKey] = (monthlyData[monthKey] || 0) + (parseFloat(item[valueField]) || 0);
    }
  });
  
  // Converter para array e ordenar
  return Object.entries(monthlyData)
    .map(([month, value]) => ({
      name: formatMonth(month),
      value,
    }))
    .sort((a, b) => a.name.localeCompare(b.name))
    .slice(-6); // Últimos 6 meses
}

function processProductData(data: any[], config: ChartConfig): ChartDataPoint[] {
  const valueField = getValueField(config.yAxis.type);
  const productData: { [key: string]: number } = {};
  
  data.forEach(item => {
    const productName = item.consortium_products?.name || 'Produto não identificado';
    
    if (config.yAxis.aggregation === 'count') {
      productData[productName] = (productData[productName] || 0) + 1;
    } else {
      productData[productName] = (productData[productName] || 0) + (parseFloat(item[valueField]) || 0);
    }
  });
  
  return Object.entries(productData)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10); // Top 10
}

function processSellerData(data: any[], config: ChartConfig): ChartDataPoint[] {
  const valueField = getValueField(config.yAxis.type);
  const sellerData: { [key: string]: number } = {};
  
  data.forEach(item => {
    const sellerName = item.profiles?.full_name || 'Vendedor não identificado';
    
    if (config.yAxis.aggregation === 'count') {
      sellerData[sellerName] = (sellerData[sellerName] || 0) + 1;
    } else {
      sellerData[sellerName] = (sellerData[sellerName] || 0) + (parseFloat(item[valueField]) || 0);
    }
  });
  
  return Object.entries(sellerData)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10); // Top 10
}

function processOfficeData(data: any[], config: ChartConfig): ChartDataPoint[] {
  const valueField = getValueField(config.yAxis.type);
  const officeData: { [key: string]: number } = {};
  
  data.forEach(item => {
    const officeName = item.offices?.name || 'Escritório não identificado';
    
    if (config.yAxis.aggregation === 'count') {
      officeData[officeName] = (officeData[officeName] || 0) + 1;
    } else {
      officeData[officeName] = (officeData[officeName] || 0) + (parseFloat(item[valueField]) || 0);
    }
  });
  
  return Object.entries(officeData)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

function formatMonth(monthKey: string): string {
  const [year, month] = monthKey.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString('pt-BR', { 
    year: '2-digit', 
    month: 'short' 
  });
}