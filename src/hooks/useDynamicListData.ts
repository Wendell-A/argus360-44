import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ListConfig } from './useDashboardPersonalization';
import { useDashboardFiltersStore } from '@/stores/useDashboardFiltersStore';

export function useDynamicListData(config: ListConfig) {
  const { activeTenant } = useAuth();
  const { filters, isActive } = useDashboardFiltersStore();

  // Converter year/month em datas globais
  const globalStart = filters.year && filters.month
    ? new Date(filters.year, filters.month - 1, 1)
    : filters.startDate
    ? new Date(filters.startDate)
    : null;

  const globalEnd = filters.year && filters.month
    ? new Date(filters.year, filters.month, 0)
    : filters.endDate
    ? new Date(filters.endDate)
    : null;

  const globalFilters = isActive ? {
    isActive: true,
    startDate: globalStart,
    endDate: globalEnd,
    officeIds: filters.officeIds || [],
    productIds: filters.productIds || [],
  } : null;

  return useQuery({
    queryKey: [
      'dynamic-list',
      config.id,
      config.type,
      config.limit,
      activeTenant?.tenant_id,
      isActive,
      globalStart?.toISOString(),
      globalEnd?.toISOString(),
      filters.officeIds,
      filters.productIds,
    ],
    queryFn: async () => {
      if (!activeTenant?.tenant_id) throw new Error('No active tenant');

      switch (config.type) {
        case 'recent_sales':
          return await getRecentSales(activeTenant.tenant_id, config.limit, globalFilters);
        case 'top_sellers':
          return await getTopSellers(activeTenant.tenant_id, config.limit, globalFilters);
        case 'upcoming_tasks':
          return await getUpcomingTasks(activeTenant.tenant_id, config.limit, globalFilters);
        case 'commission_breakdown':
          return await getCommissionBreakdown(activeTenant.tenant_id, config.limit, globalFilters);
        default:
          return [];
      }
    },
    enabled: !!activeTenant?.tenant_id,
    staleTime: 2 * 60 * 1000, // 2 minutos
    gcTime: 5 * 60 * 1000, // 5 minutos
  });
}

async function getRecentSales(
  tenantId: string, 
  limit: number, 
  globalFilters?: { isActive: boolean; startDate: Date | null; endDate: Date | null; officeIds: string[]; productIds: string[]; } | null
) {
  // Etapa 1: Buscar vendas básicas
  let query = supabase
    .from('sales')
    .select('id, sale_value, sale_date, status, client_id, product_id, seller_id')
    .eq('tenant_id', tenantId);

  // Aplicar filtros globais
  if (globalFilters?.isActive) {
    if (globalFilters.startDate) {
      query = query.gte('sale_date', globalFilters.startDate.toISOString().split('T')[0]);
    }
    if (globalFilters.endDate) {
      query = query.lte('sale_date', globalFilters.endDate.toISOString().split('T')[0]);
    }
    if (globalFilters.productIds?.length) {
      query = query.in('product_id', globalFilters.productIds);
    }
    if (globalFilters.officeIds?.length) {
      query = query.in('office_id', globalFilters.officeIds);
    }
  }

  const { data: sales, error } = await query
    .order('sale_date', { ascending: false })
    .limit(limit);

  if (error) throw error;
  if (!sales || sales.length === 0) return [];

  // Etapa 2: Buscar nomes relacionados
  const clientIds = [...new Set(sales.map(s => s.client_id))];
  const productIds = [...new Set(sales.map(s => s.product_id))];
  const sellerIds = [...new Set(sales.map(s => s.seller_id))];

  // Buscar clientes
  const { data: clients } = await supabase
    .from('clients')
    .select('id, name')
    .in('id', clientIds);

  // Buscar produtos
  const { data: products } = await supabase
    .from('consortium_products')
    .select('id, name')
    .in('id', productIds);

  // Buscar vendedores
  const { data: sellers } = await supabase
    .from('profiles')
    .select('id, full_name')
    .in('id', sellerIds);

  // Criar maps para lookup rápido
  const clientMap = new Map(clients?.map(c => [c.id, c.name]) || []);
  const productMap = new Map(products?.map(p => [p.id, p.name]) || []);
  const sellerMap = new Map(sellers?.map(s => [s.id, s.full_name]) || []);

  // Mapear resultados
  return sales.map(sale => ({
    id: sale.id,
    client_name: clientMap.get(sale.client_id) || 'N/A',
    product_name: productMap.get(sale.product_id) || 'N/A',
    seller_name: sellerMap.get(sale.seller_id) || 'N/A',
    sale_value: sale.sale_value,
    sale_date: sale.sale_date,
    status: sale.status,
  }));
}

async function getTopSellers(
  tenantId: string, 
  limit: number,
  globalFilters?: { isActive: boolean; startDate: Date | null; endDate: Date | null; officeIds: string[]; productIds: string[]; } | null
) {
  // Etapa 1: Buscar vendas aprovadas
  let query = supabase
    .from('sales')
    .select('seller_id, sale_value, sale_date')
    .eq('tenant_id', tenantId)
    .eq('status', 'approved');

  // Aplicar filtros globais
  if (globalFilters?.isActive) {
    if (globalFilters.startDate) {
      query = query.gte('sale_date', globalFilters.startDate.toISOString().split('T')[0]);
    }
    if (globalFilters.endDate) {
      query = query.lte('sale_date', globalFilters.endDate.toISOString().split('T')[0]);
    }
    if (globalFilters.productIds?.length) {
      query = query.in('product_id', globalFilters.productIds);
    }
    if (globalFilters.officeIds?.length) {
      query = query.in('office_id', globalFilters.officeIds);
    }
  }

  const { data: sales, error } = await query;

  if (error) throw error;
  if (!sales || sales.length === 0) return [];

  // Etapa 2: Agrupar por vendedor
  const sellerMap = new Map<string, { total: number; count: number }>();
  
  sales.forEach(sale => {
    const sellerId = sale.seller_id;
    if (!sellerMap.has(sellerId)) {
      sellerMap.set(sellerId, { total: 0, count: 0 });
    }
    const seller = sellerMap.get(sellerId)!;
    seller.total += sale.sale_value || 0;
    seller.count += 1;
  });

  // Etapa 3: Buscar nomes dos vendedores
  const sellerIds = Array.from(sellerMap.keys());
  const { data: sellers } = await supabase
    .from('profiles')
    .select('id, full_name')
    .in('id', sellerIds);

  const sellerNameMap = new Map(sellers?.map(s => [s.id, s.full_name]) || []);

  // Converter para array e ordenar
  return Array.from(sellerMap.entries())
    .map(([id, data]) => ({
      seller_id: id,
      seller_name: sellerNameMap.get(id) || 'N/A',
      total_sales: data.total,
      sale_count: data.count,
    }))
    .sort((a, b) => b.total_sales - a.total_sales)
    .slice(0, limit);
}

async function getUpcomingTasks(
  tenantId: string, 
  limit: number,
  globalFilters?: { isActive: boolean; startDate: Date | null; endDate: Date | null; officeIds: string[]; productIds: string[]; } | null
) {
  // Etapa 1: Buscar tarefas pendentes
  let query = supabase
    .from('automated_tasks')
    .select('id, title, due_date, priority, status, client_id, seller_id')
    .eq('tenant_id', tenantId)
    .in('status', ['pending', 'in_progress']);

  // Aplicar filtros globais de data
  if (globalFilters?.isActive) {
    if (globalFilters.startDate) {
      query = query.gte('due_date', globalFilters.startDate.toISOString().split('T')[0]);
    }
    if (globalFilters.endDate) {
      query = query.lte('due_date', globalFilters.endDate.toISOString().split('T')[0]);
    }
  }

  const { data: tasks, error } = await query
    .order('due_date', { ascending: true })
    .limit(limit);

  if (error) throw error;
  if (!tasks || tasks.length === 0) return [];

  // Etapa 2: Buscar nomes relacionados
  const clientIds = [...new Set(tasks.map(t => t.client_id).filter(Boolean))];
  const sellerIds = [...new Set(tasks.map(t => t.seller_id).filter(Boolean))];

  // Buscar clientes
  const { data: clients } = await supabase
    .from('clients')
    .select('id, name')
    .in('id', clientIds);

  // Buscar vendedores
  const { data: sellers } = await supabase
    .from('profiles')
    .select('id, full_name')
    .in('id', sellerIds);

  // Criar maps para lookup rápido
  const clientMap = new Map(clients?.map(c => [c.id, c.name]) || []);
  const sellerMap = new Map(sellers?.map(s => [s.id, s.full_name]) || []);

  // Mapear resultados
  return tasks.map(task => ({
    id: task.id,
    title: task.title,
    client_name: clientMap.get(task.client_id) || 'N/A',
    seller_name: sellerMap.get(task.seller_id) || 'N/A',
    due_date: task.due_date,
    priority: task.priority,
    status: task.status,
  }));
}

async function getCommissionBreakdown(
  tenantId: string, 
  limit: number,
  globalFilters?: { isActive: boolean; startDate: Date | null; endDate: Date | null; officeIds: string[]; productIds: string[]; } | null
) {
  // CRITICAL FIX: commissions.recipient_id não tem FK para profiles/offices
  // Implementar busca em duas etapas (igual useDynamicChartData.ts)
  
  // Etapa 1: Buscar comissões básicas
  let query = supabase
    .from('commissions')
    .select('id, commission_amount, commission_type, status, due_date, recipient_id, recipient_type')
    .eq('tenant_id', tenantId);

  // Aplicar filtros globais de data
  if (globalFilters?.isActive) {
    if (globalFilters.startDate) {
      query = query.gte('due_date', globalFilters.startDate.toISOString().split('T')[0]);
    }
    if (globalFilters.endDate) {
      query = query.lte('due_date', globalFilters.endDate.toISOString().split('T')[0]);
    }
  }

  const { data: commissions, error } = await query
    .order('due_date', { ascending: false })
    .limit(limit);

  if (error) throw error;
  if (!commissions || commissions.length === 0) return [];

  // Etapa 2: Enriquecer com nomes de recipients
  const sellerIds = commissions
    .filter(c => c.recipient_type === 'seller')
    .map(c => c.recipient_id);
  
  const officeIds = commissions
    .filter(c => c.recipient_type === 'office')
    .map(c => c.recipient_id);

  // Buscar nomes de vendedores
  const sellerNames = new Map<string, string>();
  if (sellerIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', sellerIds);
    
    profiles?.forEach(p => sellerNames.set(p.id, p.full_name));
  }

  // Buscar nomes de escritórios
  const officeNames = new Map<string, string>();
  if (officeIds.length > 0) {
    const { data: offices } = await supabase
      .from('offices')
      .select('id, name')
      .in('id', officeIds);
    
    offices?.forEach(o => officeNames.set(o.id, o.name));
  }

  // Mapear resultados com nomes enriquecidos
  return commissions.map(commission => ({
    id: commission.id,
    recipient_name: commission.recipient_type === 'office'
      ? officeNames.get(commission.recipient_id) || 'Escritório Desconhecido'
      : sellerNames.get(commission.recipient_id) || 'Vendedor Desconhecido',
    commission_type: commission.commission_type,
    commission_amount: commission.commission_amount,
    status: commission.status,
    due_date: commission.due_date,
  }));
}
