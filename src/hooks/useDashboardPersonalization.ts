import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface AggregationFilter {
  type: 'specific' | 'others';
  selectedIds?: string[];
  otherLabel?: string;
}

export interface CommissionTypeConfig {
  includeOffice: boolean;
  includeSeller: boolean;
  separateTypes: boolean;
}

export interface MetricConfig {
  id: string;
  type: 'sales' | 'commissions' | 'clients' | 'sellers' | 'goals' | 'products' | 'conversion_rate';
  title: string;
  aggregation?: 'sum' | 'count' | 'avg' | 'min' | 'max' | 'count_distinct';
  dynamicTitle?: boolean;
  aggregationFilters?: {
    products?: AggregationFilter;
    offices?: AggregationFilter;
    sellers?: AggregationFilter;
    clients?: AggregationFilter;
  };
  commissionConfig?: CommissionTypeConfig;
  filter?: {
    products?: string[];
    offices?: string[];
    period?: string;
  };
}

export interface ChartConfig {
  id: string;
  type: 'bar' | 'line' | 'pie' | 'area';
  title: string;
  dynamicTitle?: boolean;
  yAxis: MetricConfig;
  xAxis?: 'time' | 'products' | 'sellers' | 'offices' | 'clients';
  aggregationFilters?: {
    products?: AggregationFilter;
    offices?: AggregationFilter;
    sellers?: AggregationFilter;
    clients?: AggregationFilter;
  };
  commissionConfig?: CommissionTypeConfig;
  aggregation?: string[];
}

export interface ListConfig {
  id: string;
  type: 'recent_sales' | 'top_sellers' | 'upcoming_tasks' | 'commission_breakdown';
  title: string;
  dynamicTitle?: boolean;
  limit: number;
  aggregationFilters?: {
    products?: AggregationFilter;
    offices?: AggregationFilter;
    sellers?: AggregationFilter;
    clients?: AggregationFilter;
  };
  commissionConfig?: CommissionTypeConfig;
}

export interface WidgetConfigs {
  metrics: MetricConfig[];
  charts: ChartConfig[];
  lists: ListConfig[];
}

export interface DashboardConfiguration {
  id?: string;
  tenant_id: string;
  config_name: 'A' | 'B' | 'C';
  is_default: boolean;
  widget_configs: WidgetConfigs;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export function useDashboardConfigurations() {
  const { activeTenant } = useAuth();

  return useQuery({
    queryKey: ['dashboard-configurations', activeTenant?.tenant_id],
    queryFn: async () => {
      if (!activeTenant?.tenant_id) throw new Error('No active tenant');

      const { data, error } = await supabase
        .from('dashboard_configurations')
        .select('*')
        .eq('tenant_id', activeTenant.tenant_id)
        .order('config_name');

      if (error) throw error;
      return data as unknown as DashboardConfiguration[];
    },
    enabled: !!activeTenant?.tenant_id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useActiveDashboardConfig(configName?: 'A' | 'B' | 'C') {
  const { activeTenant } = useAuth();
  const { data: configurations } = useDashboardConfigurations();

  return useQuery({
    queryKey: ['active-dashboard-config', activeTenant?.tenant_id, configName],
    queryFn: () => {
      if (!configurations || configurations.length === 0) {
        // Retornar configuração padrão
        return getDefaultConfiguration(activeTenant?.tenant_id || '');
      }

      // Buscar configuração específica ou a padrão
      const targetConfig = configName 
        ? configurations.find(c => c.config_name === configName)
        : configurations.find(c => c.is_default) || configurations[0];

      return targetConfig || getDefaultConfiguration(activeTenant?.tenant_id || '');
    },
    enabled: !!activeTenant?.tenant_id,
  });
}

export function useSaveDashboardConfiguration() {
  const queryClient = useQueryClient();
  const { activeTenant, user } = useAuth();

  return useMutation({
    mutationFn: async (config: Omit<DashboardConfiguration, 'id' | 'created_at' | 'updated_at'>) => {
      if (!activeTenant?.tenant_id || !user?.id) {
        throw new Error('No active tenant or user');
      }

      const configData = {
        ...config,
        tenant_id: activeTenant.tenant_id,
        created_by: user.id,
        widget_configs: config.widget_configs as any,
      };

      const { data, error } = await supabase
        .from('dashboard_configurations')
        .upsert([configData], {
          onConflict: 'tenant_id,config_name'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['dashboard-configurations', activeTenant?.tenant_id]
      });
    },
  });
}

function getDefaultConfiguration(tenantId: string): DashboardConfiguration {
  return {
    tenant_id: tenantId,
    config_name: 'A',
    is_default: true,
    widget_configs: {
      metrics: [
        {
          id: 'metric-1',
          type: 'sales',
          title: 'Vendas do Período',
          aggregation: 'sum',
          dynamicTitle: true,
        },
        {
          id: 'metric-2',
          type: 'commissions',
          title: 'Comissões Pagas',
          aggregation: 'sum',
          dynamicTitle: true,
          commissionConfig: {
            includeOffice: true,
            includeSeller: true,
            separateTypes: false,
          },
        },
        {
          id: 'metric-3',
          type: 'clients',
          title: 'Clientes Ativos',
          aggregation: 'count',
          dynamicTitle: true,
        },
        {
          id: 'metric-4',
          type: 'sellers',
          title: 'Vendedores Ativos',
          aggregation: 'count',
          dynamicTitle: true,
        },
      ],
      charts: [
        {
          id: 'chart-1',
          type: 'bar',
          title: 'Vendas Mensais',
          dynamicTitle: true,
          yAxis: {
            id: 'y-1',
            type: 'sales',
            title: 'Vendas',
            aggregation: 'sum',
            dynamicTitle: true,
          },
          xAxis: 'time',
        },
        {
          id: 'chart-2',
          type: 'line',
          title: 'Evolução das Comissões',
          dynamicTitle: true,
          yAxis: {
            id: 'y-2',
            type: 'commissions',
            title: 'Comissões',
            aggregation: 'sum',
            dynamicTitle: true,
          },
          xAxis: 'time',
          commissionConfig: {
            includeOffice: true,
            includeSeller: true,
            separateTypes: true,
          },
        },
        {
          id: 'chart-3',
          type: 'pie',
          title: 'Vendas por Produto',
          dynamicTitle: true,
          yAxis: {
            id: 'y-3',
            type: 'sales',
            title: 'Vendas',
            aggregation: 'sum',
            dynamicTitle: true,
          },
          xAxis: 'products',
          aggregationFilters: {
            products: {
              type: 'others',
              otherLabel: 'Outros Produtos',
            },
          },
        },
      ],
      lists: [
        {
          id: 'list-1',
          type: 'recent_sales',
          title: 'Vendas Recentes',
          dynamicTitle: true,
          limit: 5,
        },
        {
          id: 'list-2',
          type: 'commission_breakdown',
          title: 'Detalhamento de Comissões',
          dynamicTitle: true,
          limit: 10,
          commissionConfig: {
            includeOffice: true,
            includeSeller: true,
            separateTypes: true,
          },
        },
      ],
    },
  };
}