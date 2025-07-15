
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface AuditLogEntry {
  id: string;
  action: string;
  table_name: string | null;
  record_id: string | null;
  old_values: any;
  new_values: any;
  user_id: string | null;
  tenant_id: string | null;
  ip_address: any;
  user_agent: string | null;
  created_at: string | null;
}

export const useAuditLog = () => {
  const { activeTenant } = useAuth();

  const {
    data: auditLogs,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["auditLogs", activeTenant?.tenant_id],
    queryFn: async () => {
      if (!activeTenant?.tenant_id) {
        return [];
      }

      const { data, error } = await supabase
        .from("audit_log")
        .select("*")
        .eq("tenant_id", activeTenant.tenant_id)
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      return data as AuditLogEntry[];
    },
    enabled: !!activeTenant?.tenant_id,
  });

  return {
    auditLogs: auditLogs || [],
    isLoading,
    error,
    refetch,
  };
};
