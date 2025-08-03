/**
 * Hook de Filtros do Dashboard com Paginação
 * Data: 03 de Agosto de 2025, 13:20 UTC
 * 
 * Hook que fornece filtros e paginação para o Dashboard
 * com dados reais do banco de dados.
 */

import { useState, useMemo } from 'react';
import { useOptimizedBusinessQuery } from '@/hooks/useOptimizedQuery';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface DashboardFilters {
  dateRange: {
    start: string;
    end: string;
  };
  office_id?: string;
  seller_id?: string;
  status?: string;
  limit: number;
  offset: number;
}

interface DashboardFilteredData {
  stats: {
    total_clients: number;
    total_sales: number;
    total_revenue: number;
    total_commission: number;
  };
  recent_sales: Array<{
    id: string;
    sale_value: number;
    status: string;
    sale_date: string;
    client_name: string;
    seller_name: string;
  }>;
  recent_clients: Array<{
    id: string;
    name: string;
    email: string;
    status: string;
    created_at: string;
    responsible_name: string;
  }>;
  pending_tasks: Array<{
    id: string;
    title: string;
    description: string;
    due_date: string;
    priority: string;
    client_name: string;
  }>;
  goals: Array<{
    id: string;
    goal_type: string;
    target_amount: number;
    current_amount: number;
    progress_percentage: number;
    period_start: string;
    period_end: string;
  }>;
  commission_summary: {
    pending_commissions: number;
  };
  total_count: number;
}

const DEFAULT_FILTERS: DashboardFilters = {
  dateRange: {
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  },
  limit: 10,
  offset: 0
};

export const useDashboardFilters = () => {
  const { activeTenant } = useAuth();
  const [filters, setFilters] = useState<DashboardFilters>(DEFAULT_FILTERS);

  const queryKey = useMemo(() => [
    'dashboard-filtered',
    activeTenant?.tenant_id,
    filters.dateRange.start,
    filters.dateRange.end,
    filters.office_id,
    filters.seller_id,
    filters.status,
    filters.limit,
    filters.offset
  ], [activeTenant?.tenant_id, filters]);

  const { data, isLoading, error } = useOptimizedBusinessQuery<DashboardFilteredData>(
    queryKey,
    {
      queryFn: async () => {
        if (!activeTenant) {
          throw new Error('Tenant não selecionado');
        }

        // Buscar dados com filtros aplicados
        const { data, error } = await supabase
          .rpc('get_dashboard_complete_optimized', {
            tenant_uuid: activeTenant.tenant_id
          });

        if (error) {
          console.error('Erro ao buscar dados do dashboard filtrado:', error);
          throw error;
        }

        const result = data?.[0];
        if (!result) {
          throw new Error('Nenhum dado retornado');
        }

        // Aplicar filtros client-side para dados detalhados
        let filteredSales = (result.recent_sales as any) || [];
        let filteredClients = (result.recent_clients as any) || [];

        // Filtrar por intervalo de datas
        if (filters.dateRange.start && filters.dateRange.end) {
          filteredSales = filteredSales.filter((sale: any) => {
            const saleDate = new Date(sale.sale_date);
            const startDate = new Date(filters.dateRange.start);
            const endDate = new Date(filters.dateRange.end);
            return saleDate >= startDate && saleDate <= endDate;
          });

          filteredClients = filteredClients.filter((client: any) => {
            const clientDate = new Date(client.created_at);
            const startDate = new Date(filters.dateRange.start);
            const endDate = new Date(filters.dateRange.end);
            return clientDate >= startDate && clientDate <= endDate;
          });
        }

        // Filtrar por status
        if (filters.status) {
          filteredSales = filteredSales.filter((sale: any) => sale.status === filters.status);
          filteredClients = filteredClients.filter((client: any) => client.status === filters.status);
        }

        // Aplicar paginação
        const startIndex = filters.offset;
        const endIndex = startIndex + filters.limit;
        
        const paginatedSales = filteredSales.slice(startIndex, endIndex);
        const paginatedClients = filteredClients.slice(startIndex, endIndex);

        return {
          stats: (result.stats_data as any) || {
            total_clients: 0,
            total_sales: 0,
            total_revenue: 0,
            total_commission: 0
          },
          recent_sales: paginatedSales,
          recent_clients: paginatedClients,
          pending_tasks: (result.pending_tasks as any) || [],
          goals: (result.goals_data as any) || [],
          commission_summary: (result.commission_summary as any) || {
            pending_commissions: 0
          },
          total_count: Math.max(filteredSales.length, filteredClients.length)
        };
      },
      enabled: Boolean(activeTenant?.tenant_id),
      staleTime: 300000, // 5 minutos
      gcTime: 600000 // 10 minutos
    }
  );

  // Funções para controle de filtros
  const updateFilters = (newFilters: Partial<DashboardFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS);
  };

  const nextPage = () => {
    setFilters(prev => ({
      ...prev,
      offset: prev.offset + prev.limit
    }));
  };

  const prevPage = () => {
    setFilters(prev => ({
      ...prev,
      offset: Math.max(0, prev.offset - prev.limit)
    }));
  };

  const goToPage = (page: number) => {
    setFilters(prev => ({
      ...prev,
      offset: page * prev.limit
    }));
  };

  // Informações de paginação
  const currentPage = Math.floor(filters.offset / filters.limit);
  const totalPages = data ? Math.ceil(data.total_count / filters.limit) : 0;
  const hasNextPage = currentPage < totalPages - 1;
  const hasPrevPage = currentPage > 0;

  return {
    data,
    isLoading,
    error,
    filters,
    updateFilters,
    resetFilters,
    pagination: {
      currentPage,
      totalPages,
      hasNextPage,
      hasPrevPage,
      nextPage,
      prevPage,
      goToPage,
      limit: filters.limit,
      offset: filters.offset,
      totalCount: data?.total_count || 0
    }
  };
};