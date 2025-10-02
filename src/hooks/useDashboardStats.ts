import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useContextualDashboard } from './useContextualDashboard';

export interface DashboardStats {
  totalSales: number;
  monthSales: number;
  totalCommissions: number;
  monthCommissions: number;
  activeVendedores: number;
  goalCompletion: number;
  recentSales: RecentSale[];
  topVendedores: TopVendedor[];
  monthlyData: MonthlyData[];
}

// Interface simples para compatibilidade
export interface SimpleDashboardStats {
  totalClients: number;
  totalSales: number;
  totalCommission: number;
  pendingTasks: number;
  monthSales: number;
  monthCommission: number;
}

export interface RecentSale {
  id: string;
  client_name: string;
  vendedor_name: string;
  sale_value: number;
  commission_amount: number;
  sale_date: string;
}

export interface TopVendedor {
  id: string;
  name: string;
  total_sales: number;
  commission_total: number;
}

export interface MonthlyData {
  month: string;
  vendas: number;
  meta: number;
  comissoes: number;
}

// Hook legado mantido para compatibilidade com dados contextuais simples
export const useDashboardStatsSimple = () => {
  const { 
    data: contextualData, 
    isLoading, 
    error,
    refetch 
  } = useContextualDashboard();

  // Transforma dados contextuais para formato legado simples
  const legacyStats: SimpleDashboardStats | undefined = contextualData ? {
    totalClients: contextualData.total_clients,
    totalSales: contextualData.total_sales,
    totalCommission: contextualData.total_commission,
    pendingTasks: contextualData.pending_tasks,
    monthSales: contextualData.month_sales,
    monthCommission: contextualData.month_commission,
  } : undefined;

  return {
    data: legacyStats,
    isLoading,
    error,
    refetch
  };
};

// Hook complexo original mantido
export const useDashboardStats = () => {
  const { activeTenant } = useAuth();

  return useQuery({
    queryKey: ['dashboard-stats', activeTenant?.tenant_id],
    queryFn: async (): Promise<DashboardStats> => {
      if (!activeTenant?.tenant_id) {
        throw new Error('No tenant selected');
      }

      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1;
      const currentYear = currentDate.getFullYear();
      const startOfMonth = `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`;
      const endOfMonth = new Date(currentYear, currentMonth, 0);
      const endOfMonthStr = `${currentYear}-${currentMonth.toString().padStart(2, '0')}-${endOfMonth.getDate()}`;

      // Buscar vendas totais e do mês
      const { data: salesData, error: salesError } = await supabase
        .from('sales')
        .select(`
          id,
          sale_value,
          commission_amount,
          sale_date,
          seller_id,
          client_id,
          status
        `)
        .eq('tenant_id', activeTenant.tenant_id)
        .eq('status', 'approved')
        .order('sale_date', { ascending: false });

      if (salesError) throw salesError;

      const sales = salesData || [];
      const monthSales = sales.filter(sale => 
        sale.sale_date >= startOfMonth && sale.sale_date <= endOfMonthStr
      );

      // Buscar comissões
      const { data: commissionsData, error: commissionsError } = await supabase
        .from('commissions')
        .select('commission_amount, status, created_at')
        .eq('tenant_id', activeTenant.tenant_id);

      if (commissionsError) throw commissionsError;

      const commissions = commissionsData || [];
      const paidCommissions = commissions.filter(c => c.status === 'paid');
      const monthCommissions = paidCommissions.filter(commission => {
        const commissionDate = new Date(commission.created_at);
        return commissionDate.getMonth() + 1 === currentMonth && 
               commissionDate.getFullYear() === currentYear;
      });

      // Buscar usuários ativos
      const { data: activeUsersData, error: usersError } = await supabase
        .from('tenant_users')
        .select('user_id')
        .eq('tenant_id', activeTenant.tenant_id)
        .eq('active', true);

      if (usersError) throw usersError;

      // Buscar metas para calcular completion
      const { data: goalsData, error: goalsError } = await supabase
        .from('goals')
        .select('target_amount, current_amount, period_start, period_end')
        .eq('tenant_id', activeTenant.tenant_id)
        .eq('status', 'active');

      if (goalsError) throw goalsError;

      const goals = goalsData || [];
      const goalCompletion = goals.length > 0 
        ? (goals.reduce((sum, goal) => sum + (goal.current_amount / goal.target_amount), 0) / goals.length) * 100
        : 0;

      // Buscar dados de clientes e vendedores separadamente
      const clientIds = [...new Set(sales.map(sale => sale.client_id))];
      const vendedorIds = [...new Set(sales.map(sale => sale.seller_id))];

      const { data: clientsData } = await supabase
        .from('clients')
        .select('id, name')
        .in('id', clientIds);

      const { data: profilesData } = await supabase
        .from('profiles_masked')
        .select('id, full_name, data_masked')
        .in('id', vendedorIds);

      const clientsMap = new Map(clientsData?.map(c => [c.id, c]) || []);
      const vendedoresMap = new Map(profilesData?.map(v => [v.id, v]) || []);

      // Vendas recentes (últimas 5)
      const recentSales: RecentSale[] = sales.slice(0, 5).map(sale => ({
        id: sale.id,
        client_name: clientsMap.get(sale.client_id)?.name || 'Cliente não encontrado',
        vendedor_name: vendedoresMap.get(sale.seller_id)?.full_name || 'Vendedor não encontrado',
        sale_value: sale.sale_value,
        commission_amount: sale.commission_amount,
        sale_date: sale.sale_date,
      }));

      // Top vendedores
      const vendedorStats = sales.reduce((acc, sale) => {
        const vendedorId = sale.seller_id;
        const vendedorName = vendedoresMap.get(vendedorId)?.full_name || 'Vendedor não encontrado';
        
        if (!acc[vendedorId]) {
          acc[vendedorId] = {
            id: vendedorId,
            name: vendedorName,
            total_sales: 0,
            commission_total: 0,
          };
        }
        
        acc[vendedorId].total_sales += sale.sale_value;
        acc[vendedorId].commission_total += sale.commission_amount;
        
        return acc;
      }, {} as Record<string, TopVendedor>);

      const topVendedores = Object.values(vendedorStats)
        .sort((a, b) => b.total_sales - a.total_sales)
        .slice(0, 4);

      // Dados mensais (últimos 6 meses)
      const monthlyData: MonthlyData[] = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const month = date.toLocaleDateString('pt-BR', { month: 'short' });
        const monthNum = date.getMonth() + 1;
        const year = date.getFullYear();
        
        const monthStart = `${year}-${monthNum.toString().padStart(2, '0')}-01`;
        const monthEnd = new Date(year, monthNum, 0);
        const monthEndStr = `${year}-${monthNum.toString().padStart(2, '0')}-${monthEnd.getDate()}`;
        
        const monthSalesData = sales.filter(sale => 
          sale.sale_date >= monthStart && sale.sale_date <= monthEndStr
        );
        
        const monthCommissionsData = paidCommissions.filter(commission => {
          const commissionDate = new Date(commission.created_at);
          return commissionDate.getMonth() + 1 === monthNum && 
                 commissionDate.getFullYear() === year;
        });

        const monthGoals = goals.filter(goal => {
          const goalStart = new Date(goal.period_start);
          const goalEnd = new Date(goal.period_end);
          return goalStart <= new Date(monthEndStr) && goalEnd >= new Date(monthStart);
        });

        monthlyData.push({
          month: month.charAt(0).toUpperCase() + month.slice(1),
          vendas: monthSalesData.reduce((sum, sale) => sum + sale.sale_value, 0),
          meta: monthGoals.reduce((sum, goal) => sum + goal.target_amount, 0),
          comissoes: monthCommissionsData.reduce((sum, comm) => sum + comm.commission_amount, 0),
        });
      }

      return {
        totalSales: sales.length,
        monthSales: monthSales.length,
        totalCommissions: paidCommissions.reduce((sum, c) => sum + c.commission_amount, 0),
        monthCommissions: monthCommissions.reduce((sum, c) => sum + c.commission_amount, 0),
        activeVendedores: activeUsersData?.length || 0,
        goalCompletion,
        recentSales,
        topVendedores,
        monthlyData,
      };
    },
    enabled: !!activeTenant?.tenant_id,
  });
};