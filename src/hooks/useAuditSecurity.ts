import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface AuditLogEntry {
  id: string;
  user_id: string;
  tenant_id: string;
  table_name: string;
  record_id?: string;
  action: string;
  old_values?: any;
  new_values?: any;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  user_role?: string;
  context_level?: number;
}

export interface AuditStatistics {
  total_events: number;
  events_today: number;
  events_this_week: number;
  user_role: string;
  context_level: number;
  top_actions?: Array<{ action: string; count: number }>;
  top_users?: Array<{ user_id: string; count: number }>;
}

export interface SecurityMonitoring {
  failed_logins_24h: number;
  suspicious_ips: number;
  admin_actions_24h: number;
  active_sessions: number;
  last_updated: string;
  security_level: 'LOW' | 'MEDIUM' | 'HIGH';
  error?: string;
}

export function useContextualAuditLogs(
  enabled: boolean = true,
  filters?: {
    limit?: number;
    offset?: number;
    resource_type?: string;
    action_filter?: string;
    date_from?: string;
    date_to?: string;
  }
) {
  const { user, activeTenant } = useAuth();

  return useQuery({
    queryKey: ['contextual-audit-logs', user?.id, activeTenant?.tenant_id, filters],
    queryFn: async (): Promise<AuditLogEntry[]> => {
      if (!user?.id || !activeTenant?.tenant_id) {
        throw new Error('Usuário ou tenant não encontrado');
      }

      const { data, error } = await supabase.rpc('get_contextual_audit_logs', {
        user_uuid: user.id,
        tenant_uuid: activeTenant.tenant_id,
        p_limit: filters?.limit || 100,
        p_offset: filters?.offset || 0,
        p_resource_type: filters?.resource_type || null,
        p_action_filter: filters?.action_filter || null,
        p_date_from: filters?.date_from || null,
        p_date_to: filters?.date_to || null
      });

      if (error) {
        console.error('Erro ao buscar logs de auditoria:', error);
        throw error;
      }

      return data || [];
    },
    enabled: enabled && !!user?.id && !!activeTenant?.tenant_id,
    staleTime: 2 * 60 * 1000, // 2 minutos
    gcTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: false,
  });
}

export function useAuditStatistics(enabled: boolean = true) {
  const { user, activeTenant } = useAuth();

  return useQuery({
    queryKey: ['audit-statistics', user?.id, activeTenant?.tenant_id],
    queryFn: async (): Promise<AuditStatistics> => {
      if (!user?.id || !activeTenant?.tenant_id) {
        throw new Error('Usuário ou tenant não encontrado');
      }

      const { data, error } = await supabase.rpc('get_audit_statistics', {
        user_uuid: user.id,
        tenant_uuid: activeTenant.tenant_id
      });

      if (error) {
        console.error('Erro ao buscar estatísticas de auditoria:', error);
        throw error;
      }

      return data as unknown as AuditStatistics;
    },
    enabled: enabled && !!user?.id && !!activeTenant?.tenant_id,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    refetchOnWindowFocus: false,
  });
}

export function useSecurityMonitoring(enabled: boolean = true) {
  const { user, activeTenant } = useAuth();

  return useQuery({
    queryKey: ['security-monitoring', user?.id, activeTenant?.tenant_id],
    queryFn: async (): Promise<SecurityMonitoring> => {
      if (!user?.id || !activeTenant?.tenant_id) {
        throw new Error('Usuário ou tenant não encontrado');
      }

      const { data, error } = await supabase.rpc('get_security_monitoring_data', {
        user_uuid: user.id,
        tenant_uuid: activeTenant.tenant_id
      });

      if (error) {
        console.error('Erro ao buscar dados de monitoramento:', error);
        throw error;
      }

      return data as unknown as SecurityMonitoring;
    },
    enabled: enabled && !!user?.id && !!activeTenant?.tenant_id,
    staleTime: 1 * 60 * 1000, // 1 minuto (dados de segurança precisam ser mais atuais)
    gcTime: 2 * 60 * 1000, // 2 minutos
    refetchOnWindowFocus: true,
    refetchInterval: 2 * 60 * 1000, // Atualizar a cada 2 minutos
  });
}

export async function logAuditEvent(
  action: string,
  resourceType: string,
  resourceId?: string,
  oldValues?: any,
  newValues?: any,
  additionalContext?: any
) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const tenant = JSON.parse(localStorage.getItem('activeTenant') || '{}');
    
    if (!user?.id || !tenant?.tenant_id) {
      console.warn('Não foi possível registrar evento de auditoria: usuário ou tenant não encontrado');
      return;
    }

    const { data, error } = await supabase.rpc('log_contextual_audit_event', {
      p_user_uuid: user.id,
      p_tenant_uuid: tenant.tenant_id,
      p_action: action,
      p_resource_type: resourceType,
      p_resource_id: resourceId || null,
      p_old_values: oldValues || null,
      p_new_values: newValues || null,
      p_additional_context: additionalContext || {}
    });

    if (error) {
      console.error('Erro ao registrar evento de auditoria:', error);
    }

    return data;
  } catch (error) {
    console.error('Erro ao registrar evento de auditoria:', error);
  }
}