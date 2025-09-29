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
  let query;
  const selectField = getSelectField(config);
  const dateField = getDateField(config.type);

  // Criar query específica por tipo para garantir tipagem correta
  switch (config.type) {
    case 'sales':
      query = supabase.from('sales')
        .select(selectField)
        .eq('tenant_id', tenantId)
        .eq('status', 'approved');
      break;
    case 'commissions':
      query = supabase.from('commissions')
        .select(selectField)
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
        .select(selectField)
        .eq('tenant_id', tenantId);
      break;
    case 'sellers':
      query = supabase.from('tenant_users')
        .select(selectField)
        .eq('tenant_id', tenantId)
        .eq('active', true);
      break;
    case 'goals':
      query = supabase.from('goals')
        .select(selectField)
        .eq('tenant_id', tenantId);
      break;
    case 'products':
      query = supabase.from('consortium_products')
        .select(selectField)
        .eq('tenant_id', tenantId);
      break;
    default:
      query = supabase.from('sales')
        .select(selectField)
        .eq('tenant_id', tenantId);
  }

  // Aplicar filtro de data se disponível
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

  const { data, error } = await query;

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
  // Para count_distinct, sempre precisamos do campo específico
  if (config.aggregation === 'count_distinct') {
    switch (config.type) {
      case 'sales':
        return 'seller_id';
      case 'commissions':
        return 'recipient_id';
      case 'clients':
        return 'responsible_user_id';
      case 'sellers':
        return 'user_id';
      case 'goals':
        return 'user_id';
      case 'products':
        return 'id';
      default:
        return 'id';
    }
  }

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
  
  const field = getSelectField(config);

  switch (config.aggregation) {
    case 'count':
      return data.length;
    
    case 'count_distinct':
      const distinctValues = new Set(data.map(item => item[field]).filter(Boolean));
      return distinctValues.size;
    
    case 'sum':
      return data.reduce((sum, item) => sum + (parseFloat(item[field]) || 0), 0);
    
    case 'avg':
      const total = data.reduce((sum, item) => sum + (parseFloat(item[field]) || 0), 0);
      return total / data.length;
    
    case 'min':
      if (data.length === 0) return 0;
      return Math.min(...data.map(item => parseFloat(item[field] || 0)));
    
    case 'max':
      if (data.length === 0) return 0;
      return Math.max(...data.map(item => parseFloat(item[field] || 0)));
    
    default:
      return data.length;
  }
}