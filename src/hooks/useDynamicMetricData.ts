import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { MetricConfig } from './useDashboardPersonalization';

interface MetricData {
  value: number;
  change?: number;
}

export function useDynamicMetricData(config: MetricConfig) {
  const { activeTenant } = useAuth();

  return useQuery({
    queryKey: ['dynamic-metric', config.id, config.type, config.aggregation, activeTenant?.tenant_id],
    queryFn: async (): Promise<MetricData> => {
      if (!activeTenant?.tenant_id) throw new Error('No active tenant');

      // Calcular período atual e anterior
      const now = new Date();
      const currentPeriodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const previousPeriodStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const previousPeriodEnd = new Date(now.getFullYear(), now.getMonth(), 0);

      const currentValue = await getMetricValue(config, activeTenant.tenant_id, currentPeriodStart, now);
      const previousValue = await getMetricValue(config, activeTenant.tenant_id, previousPeriodStart, previousPeriodEnd);

      const change = previousValue > 0 ? ((currentValue - previousValue) / previousValue) * 100 : 0;

      return {
        value: currentValue,
        change,
      };
    },
    enabled: !!activeTenant?.tenant_id,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

async function getMetricValue(
  config: MetricConfig, 
  tenantId: string, 
  startDate: Date, 
  endDate: Date
): Promise<number> {
  const tableName = getTableName(config.type);
  let query = supabase.from(tableName as any);

  // Aplicar filtros básicos
  query = (query as any).eq('tenant_id', tenantId);
  
  // Aplicar filtro de data baseado no tipo
  const dateField = getDateField(config.type);
  if (dateField) {
    query = query
      .gte(dateField, startDate.toISOString().split('T')[0])
      .lte(dateField, endDate.toISOString().split('T')[0]);
  }

  // Aplicar filtros específicos da configuração
  if (config.filter?.products?.length) {
    query = query.in('product_id', config.filter.products);
  }
  
  if (config.filter?.offices?.length) {
    query = query.in('office_id', config.filter.offices);
  }

  // Aplicar status específicos por tipo
  if (config.type === 'sales') {
    query = query.eq('status', 'approved');
  }

  const { data, error } = await query.select(getSelectField(config));

  if (error) throw error;

  return calculateAggregation(data || [], config);
}

function getTableName(type: MetricConfig['type']): string {
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

function getDateField(type: MetricConfig['type']): string | null {
  switch (type) {
    case 'sales': return 'sale_date';
    case 'commissions': return 'due_date';
    case 'clients': return 'created_at';
    case 'sellers': return 'joined_at';
    case 'goals': return 'created_at';
    case 'products': return 'created_at';
    default: return 'created_at';
  }
}

function getSelectField(config: MetricConfig): string {
  if (config.aggregation === 'count') {
    return 'id';
  }

  switch (config.type) {
    case 'sales': return 'sale_value';
    case 'commissions': return 'commission_amount';
    case 'goals': return 'target_amount';
    default: return 'id';
  }
}

function calculateAggregation(data: any[], config: MetricConfig): number {
  if (!data.length) return 0;

  switch (config.aggregation) {
    case 'count':
      return data.length;
    
    case 'sum':
      const field = getSelectField(config);
      return data.reduce((sum, item) => sum + (parseFloat(item[field]) || 0), 0);
    
    case 'avg':
      const fieldAvg = getSelectField(config);
      const total = data.reduce((sum, item) => sum + (parseFloat(item[fieldAvg]) || 0), 0);
      return total / data.length;
    
    default:
      return data.length;
  }
}