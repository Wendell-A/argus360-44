import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ListConfig } from './useDashboardPersonalization';

export function useDynamicListData(config: ListConfig) {
  const { activeTenant } = useAuth();

  return useQuery({
    queryKey: [
      'dynamic-list',
      config.id,
      config.type,
      config.limit,
      activeTenant?.tenant_id,
    ],
    queryFn: async () => {
      if (!activeTenant?.tenant_id) throw new Error('No active tenant');

      switch (config.type) {
        case 'recent_sales':
          return await getRecentSales(activeTenant.tenant_id, config.limit);
        case 'top_sellers':
          return await getTopSellers(activeTenant.tenant_id, config.limit);
        case 'upcoming_tasks':
          return await getUpcomingTasks(activeTenant.tenant_id, config.limit);
        case 'commission_breakdown':
          return await getCommissionBreakdown(activeTenant.tenant_id, config.limit);
        default:
          return [];
      }
    },
    enabled: !!activeTenant?.tenant_id,
    staleTime: 2 * 60 * 1000, // 2 minutos
    gcTime: 5 * 60 * 1000, // 5 minutos
  });
}

async function getRecentSales(tenantId: string, limit: number) {
  const { data, error } = await supabase
    .from('sales')
    .select(`
      id,
      sale_value,
      sale_date,
      status,
      clients(name),
      consortium_products(name),
      profiles!sales_seller_id_fkey(full_name)
    `)
    .eq('tenant_id', tenantId)
    .order('sale_date', { ascending: false })
    .limit(limit);

  if (error) throw error;

  return (data || []).map(sale => ({
    id: sale.id,
    client_name: (sale.clients as any)?.name || 'N/A',
    product_name: (sale.consortium_products as any)?.name || 'N/A',
    seller_name: (sale.profiles as any)?.full_name || 'N/A',
    sale_value: sale.sale_value,
    sale_date: sale.sale_date,
    status: sale.status,
  }));
}

async function getTopSellers(tenantId: string, limit: number) {
  const { data, error } = await supabase
    .from('sales')
    .select(`
      seller_id,
      sale_value,
      profiles!sales_seller_id_fkey(full_name)
    `)
    .eq('tenant_id', tenantId)
    .eq('status', 'approved');

  if (error) throw error;

  // Agrupar por vendedor e somar valores
  const sellerMap = new Map<string, { name: string; total: number; count: number }>();

  (data || []).forEach(sale => {
    const sellerId = sale.seller_id;
    const sellerName = (sale.profiles as any)?.full_name || 'N/A';
    
    if (!sellerMap.has(sellerId)) {
      sellerMap.set(sellerId, { name: sellerName, total: 0, count: 0 });
    }
    
    const seller = sellerMap.get(sellerId)!;
    seller.total += sale.sale_value || 0;
    seller.count += 1;
  });

  // Converter para array e ordenar
  return Array.from(sellerMap.entries())
    .map(([id, data]) => ({
      seller_id: id,
      seller_name: data.name,
      total_sales: data.total,
      sale_count: data.count,
    }))
    .sort((a, b) => b.total_sales - a.total_sales)
    .slice(0, limit);
}

async function getUpcomingTasks(tenantId: string, limit: number) {
  const { data, error } = await supabase
    .from('automated_tasks')
    .select(`
      id,
      title,
      due_date,
      priority,
      status,
      clients(name),
      profiles!automated_tasks_seller_id_fkey(full_name)
    `)
    .eq('tenant_id', tenantId)
    .in('status', ['pending', 'in_progress'])
    .order('due_date', { ascending: true })
    .limit(limit);

  if (error) throw error;

  return (data || []).map(task => ({
    id: task.id,
    title: task.title,
    client_name: (task.clients as any)?.name || 'N/A',
    seller_name: (task.profiles as any)?.full_name || 'N/A',
    due_date: task.due_date,
    priority: task.priority,
    status: task.status,
  }));
}

async function getCommissionBreakdown(tenantId: string, limit: number) {
  // CRITICAL FIX: commissions.recipient_id não tem FK para profiles/offices
  // Implementar busca em duas etapas (igual useDynamicChartData.ts)
  
  // Etapa 1: Buscar comissões básicas
  const { data: commissions, error } = await supabase
    .from('commissions')
    .select('id, commission_amount, commission_type, status, due_date, recipient_id, recipient_type')
    .eq('tenant_id', tenantId)
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
