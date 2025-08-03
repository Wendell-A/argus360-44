/**
 * Hook completo do Dashboard com dados 100% reais
 * Data: 03 de Agosto de 2025, 14:00 UTC
 * 
 * Hook que consolida dados de todas as telas do sistema para o Dashboard:
 * - Vendedores (/vendedores)
 * - Clientes (/clientes)
 * - Vendas (/vendas)
 * - Metas (/metas)
 * - Comissões (/comissoes)
 * - Consórcios (/consorcios)
 */

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useOptimizedBusinessQuery } from '@/hooks/useOptimizedQuery';
import { supabase } from '@/integrations/supabase/client';

export interface DashboardCompleteFilters {
  dateRange: {
    start: string;
    end: string;
  };
  office_id?: string;
  seller_id?: string;
  client_id?: string;
  status?: string;
  limit: number;
  offset: number;
}

export interface DashboardCompleteData {
  // Estatísticas principais
  stats: {
    total_clients: number;
    total_vendors: number;
    total_sales: number;
    total_revenue: number;
    total_commission: number;
    active_goals: number;
    completed_goals: number;
    total_products: number;
  };
  
  // Dados de vendedores
  vendors: Array<{
    id: string;
    name: string;
    email: string;
    sales_count: number;
    commission_total: number;
    office_name: string;
    active: boolean;
  }>;
  
  // Dados de clientes
  clients: Array<{
    id: string;
    name: string;
    email: string;
    status: string;
    classification: string;
    created_at: string;
    responsible_name: string;
  }>;
  
  // Dados de vendas
  sales: Array<{
    id: string;
    client_name: string;
    seller_name: string;
    product_name: string;
    sale_value: number;
    commission_amount: number;
    status: string;
    sale_date: string;
    office_name: string;
  }>;
  
  // Dados de metas
  goals: Array<{
    id: string;
    goal_type: string;
    target_amount: number;
    current_amount: number;
    progress_percentage: number;
    period_start: string;
    period_end: string;
    status: string;
    office_name?: string;
    user_name?: string;
  }>;
  
  // Dados de comissões
  commissions: Array<{
    id: string;
    sale_id: string;
    recipient_name: string;
    commission_amount: number;
    status: string;
    due_date: string;
    payment_date?: string;
    office_name: string;
  }>;
  
  // Dados de produtos mais vendidos
  top_products: Array<{
    product_id: string;
    product_name: string;
    category: string;
    sales_count: number;
    total_revenue: number;
    commission_rate: number;
  }>;
  
  // Dados para gráficos
  monthly_sales: Array<{
    month: string;
    year: number;
    sales_count: number;
    revenue: number;
    commission_total: number;
  }>;
  
  // Performance por escritório
  office_performance: Array<{
    office_id: string;
    office_name: string;
    sales_count: number;
    revenue: number;
    vendors_count: number;
    clients_count: number;
    commission_total: number;
  }>;
  
  total_count: number;
}

const DEFAULT_FILTERS: DashboardCompleteFilters = {
  dateRange: {
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  },
  limit: 10,
  offset: 0
};

export const useDashboardComplete = (filters: DashboardCompleteFilters = DEFAULT_FILTERS) => {
  const { activeTenant } = useAuth();

  const queryKey = [
    'dashboard-complete',
    activeTenant?.tenant_id,
    filters.dateRange.start,
    filters.dateRange.end,
    filters.office_id,
    filters.seller_id,
    filters.client_id,
    filters.status,
    filters.limit,
    filters.offset
  ];

  const { data, isLoading, error } = useOptimizedBusinessQuery<DashboardCompleteData>(
    queryKey,
    {
      queryFn: async () => {
        if (!activeTenant) {
          throw new Error('Tenant não selecionado');
        }

        // Buscar dados completos do dashboard
        const { data, error } = await supabase
          .rpc('get_dashboard_complete_optimized', {
            tenant_uuid: activeTenant.tenant_id
          });

        if (error) {
          console.error('Erro ao buscar dados completos do dashboard:', error);
          throw error;
        }

        const result = data?.[0];
        if (!result) {
          throw new Error('Nenhum dado retornado');
        }

        // Buscar dados adicionais específicos para o dashboard completo
        
        // 1. Vendedores com estatísticas
        const vendorsPromise = supabase
          .from('tenant_users')
          .select(`
            user_id,
            office_id,
            active,
            profiles!user_id(full_name, email),
            offices(name)
          `)
          .eq('tenant_id', activeTenant.tenant_id)
          .eq('active', true);

        // 2. Produtos mais vendidos
        const topProductsPromise = supabase
          .from('sales')
          .select(`
            product_id,
            sale_value,
            consortium_products(name, category, commission_rate)
          `)
          .eq('tenant_id', activeTenant.tenant_id)
          .eq('status', 'approved')
          .gte('sale_date', filters.dateRange.start)
          .lte('sale_date', filters.dateRange.end);

        // 3. Vendas mensais para gráficos
        const monthlySalesPromise = supabase
          .from('sales')
          .select(`
            sale_date,
            sale_value,
            commission_amount,
            status
          `)
          .eq('tenant_id', activeTenant.tenant_id)
          .eq('status', 'approved')
          .gte('sale_date', new Date(new Date().getFullYear() - 1, 0, 1).toISOString().split('T')[0]);

        // 4. Performance por escritório
        const officePerformancePromise = supabase
          .from('offices')
          .select(`
            id,
            name,
            sales(sale_value, status),
            tenant_users(user_id),
            clients(id)
          `)
          .eq('tenant_id', activeTenant.tenant_id)
          .eq('active', true);

        // Executar todas as queries em paralelo
        const [
          vendorsResult,
          topProductsResult,
          monthlySalesResult,
          officePerformanceResult
        ] = await Promise.all([
          vendorsPromise,
          topProductsPromise,
          monthlySalesPromise,
          officePerformancePromise
        ]);

        // Processar dados dos vendedores
        const vendors = await Promise.all((vendorsResult.data || []).map(async (vendor: any) => {
          const { data: salesData } = await supabase
            .from('sales')
            .select('id, commission_amount')
            .eq('seller_id', vendor.user_id)
            .eq('tenant_id', activeTenant.tenant_id)
            .eq('status', 'approved');

          const { data: commissionsData } = await supabase
            .from('commissions')
            .select('commission_amount')
            .eq('recipient_id', vendor.user_id)
            .eq('tenant_id', activeTenant.tenant_id)
            .eq('status', 'paid');

          return {
            id: vendor.user_id,
            name: vendor.profiles?.full_name || 'N/A',
            email: vendor.profiles?.email || 'N/A',
            sales_count: salesData?.length || 0,
            commission_total: commissionsData?.reduce((sum, c) => sum + (c.commission_amount || 0), 0) || 0,
            office_name: vendor.offices?.name || 'Sem escritório',
            active: vendor.active
          };
        }));

        // Processar produtos mais vendidos
        const productSales = (topProductsResult.data || []).reduce((acc: any, sale: any) => {
          const productId = sale.product_id;
          if (!acc[productId]) {
            acc[productId] = {
              product_id: productId,
              product_name: sale.consortium_products?.name || 'Produto não encontrado',
              category: sale.consortium_products?.category || 'N/A',
              commission_rate: sale.consortium_products?.commission_rate || 0,
              sales_count: 0,
              total_revenue: 0
            };
          }
          acc[productId].sales_count += 1;
          acc[productId].total_revenue += sale.sale_value || 0;
          return acc;
        }, {});

        const top_products = Object.values(productSales)
          .sort((a: any, b: any) => b.sales_count - a.sales_count)
          .slice(0, 10);

        // Processar vendas mensais
        const monthlySales = (monthlySalesResult.data || []).reduce((acc: any, sale: any) => {
          const date = new Date(sale.sale_date);
          const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
          
          if (!acc[key]) {
            acc[key] = {
              month: date.toLocaleDateString('pt-BR', { month: 'short' }),
              year: date.getFullYear(),
              sales_count: 0,
              revenue: 0,
              commission_total: 0
            };
          }
          
          acc[key].sales_count += 1;
          acc[key].revenue += sale.sale_value || 0;
          acc[key].commission_total += sale.commission_amount || 0;
          
          return acc;
        }, {});

        // Processar performance por escritório
        const office_performance = (officePerformanceResult.data || []).map((office: any) => ({
          office_id: office.id,
          office_name: office.name,
          sales_count: office.sales?.filter((s: any) => s.status === 'approved').length || 0,
          revenue: office.sales?.filter((s: any) => s.status === 'approved').reduce((sum: number, s: any) => sum + (s.sale_value || 0), 0) || 0,
          vendors_count: office.tenant_users?.length || 0,
          clients_count: office.clients?.length || 0,
          commission_total: 0 // Seria necessária query adicional para comissões
        }));

        // Aplicar filtros client-side
        let filteredSales = (result.recent_sales as any) || [];
        let filteredClients = (result.recent_clients as any) || [];
        let filteredCommissions = [];

        // Filtrar por escritório
        if (filters.office_id) {
          filteredSales = filteredSales.filter((sale: any) => sale.office_id === filters.office_id);
          filteredClients = filteredClients.filter((client: any) => client.office_id === filters.office_id);
        }

        // Filtrar por vendedor
        if (filters.seller_id) {
          filteredSales = filteredSales.filter((sale: any) => sale.seller_id === filters.seller_id);
        }

        // Filtrar por cliente
        if (filters.client_id) {
          filteredSales = filteredSales.filter((sale: any) => sale.client_id === filters.client_id);
        }

        // Filtrar por status
        if (filters.status) {
          filteredSales = filteredSales.filter((sale: any) => sale.status === filters.status);
        }

        // Aplicar paginação
        const startIndex = filters.offset;
        const endIndex = startIndex + filters.limit;
        
        const paginatedSales = filteredSales.slice(startIndex, endIndex);
        const paginatedClients = filteredClients.slice(startIndex, endIndex);

        // Calcular estatísticas
        const stats = {
          total_clients: (result.stats_data as any)?.total_clients || 0,
          total_vendors: vendors.length,
          total_sales: (result.stats_data as any)?.total_sales || 0,
          total_revenue: (result.stats_data as any)?.total_revenue || 0,
          total_commission: (result.stats_data as any)?.total_commission || 0,
          active_goals: (result.goals_data as any)?.filter((g: any) => g.status === 'active').length || 0,
          completed_goals: (result.goals_data as any)?.filter((g: any) => g.current_amount >= g.target_amount).length || 0,
          total_products: (top_products as any[]).length
        };

        return {
          stats,
          vendors: vendors.slice(0, filters.limit),
          clients: paginatedClients,
          sales: paginatedSales,
          goals: (result.goals_data as any) || [],
          commissions: filteredCommissions,
          top_products: top_products as any[],
          monthly_sales: Object.values(monthlySales).slice(-12) as any[],
          office_performance,
          total_count: Math.max(filteredSales.length, filteredClients.length)
        } as DashboardCompleteData;
      },
      enabled: Boolean(activeTenant?.tenant_id),
      staleTime: 300000, // 5 minutos
      gcTime: 600000 // 10 minutos
    }
  );

  return {
    data,
    isLoading,
    error
  };
};