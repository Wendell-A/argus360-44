import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface ClientTransfer {
  id: string;
  tenant_id: string;
  client_id: string;
  from_user_id: string;
  to_user_id: string;
  reason?: string;
  notes?: string;
  status: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  from_user?: {
    full_name: string;
    email: string;
  };
  to_user?: {
    full_name: string;
    email: string;
  };
  client?: {
    name: string;
  };
}

export interface CreateClientTransfer {
  client_id: string;
  to_user_id: string;
  reason?: string;
  notes?: string;
}

export const useClientTransfers = (clientId?: string) => {
  const { activeTenant } = useAuth();

  return useQuery({
    queryKey: ["clientTransfers", activeTenant?.tenant_id, clientId],
    queryFn: async () => {
      if (!activeTenant?.tenant_id) return [];

      // First get basic transfer data
      let query = supabase
        .from("client_transfers")
        .select("*")
        .eq("tenant_id", activeTenant.tenant_id)
        .order("created_at", { ascending: false });

      if (clientId) {
        query = query.eq("client_id", clientId);
      }

      const { data: transfers, error } = await query;
      if (error) throw error;

      if (!transfers || transfers.length === 0) return [];

      // Get user profiles for from_user and to_user
      const userIds = [
        ...transfers.map(t => t.from_user_id),
        ...transfers.map(t => t.to_user_id)
      ].filter((id, index, arr) => arr.indexOf(id) === index);

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", userIds);

      // Get client names if needed
      const clientIds = transfers.map(t => t.client_id)
        .filter((id, index, arr) => arr.indexOf(id) === index);

      const { data: clients } = await supabase
        .from("clients")
        .select("id, name")
        .in("id", clientIds);

      // Combine data
      return transfers.map(transfer => ({
        ...transfer,
        from_user: profiles?.find(p => p.id === transfer.from_user_id),
        to_user: profiles?.find(p => p.id === transfer.to_user_id),
        client: clients?.find(c => c.id === transfer.client_id)
      })) as ClientTransfer[];
    },
    enabled: !!activeTenant?.tenant_id,
  });
};

export const useCreateClientTransfer = () => {
  const { activeTenant } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (transfer: CreateClientTransfer) => {
      if (!activeTenant?.tenant_id) {
        throw new Error("Tenant não encontrado");
      }

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Buscar dados do cliente atual
      const { data: clientData, error: clientError } = await supabase
        .from("clients")
        .select("responsible_user_id, name")
        .eq("id", transfer.client_id)
        .single();

      if (clientError) throw clientError;

      const from_user_id = clientData.responsible_user_id;

      // Criar registro do repasse
      const { data: transferData, error: transferError } = await supabase
        .from("client_transfers")
        .insert({
          tenant_id: activeTenant.tenant_id,
          client_id: transfer.client_id,
          from_user_id,
          to_user_id: transfer.to_user_id,
          reason: transfer.reason,
          notes: transfer.notes,
          created_by: user.id,
        })
        .select()
        .single();

      if (transferError) throw transferError;

      // Atualizar o responsável do cliente
      const { error: updateError } = await supabase
        .from("clients")
        .update({ responsible_user_id: transfer.to_user_id })
        .eq("id", transfer.client_id);

      if (updateError) throw updateError;

      return transferData;
    },
    onSuccess: () => {
      toast({
        title: "Cliente repassado com sucesso",
        description: "O cliente foi transferido para o novo responsável.",
      });
      
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ["clientTransfers"] });
      queryClient.invalidateQueries({ queryKey: ["clients"] });
    },
    onError: (error) => {
      toast({
        title: "Erro ao repassar cliente",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useTransferStatistics = () => {
  const { activeTenant } = useAuth();

  return useQuery({
    queryKey: ["transferStatistics", activeTenant?.tenant_id],
    queryFn: async () => {
      if (!activeTenant?.tenant_id) return null;

      // Buscar estatísticas de repasses
      const { data, error } = await supabase
        .from("client_transfers")
        .select("from_user_id, to_user_id, created_at")
        .eq("tenant_id", activeTenant.tenant_id);

      if (error) throw error;

      const totalTransfers = data.length;
      const thisMonth = data.filter(t => 
        new Date(t.created_at).getMonth() === new Date().getMonth()
      ).length;

      // Contar repasses por usuário
      const userStats = data.reduce((acc, transfer) => {
        // Quem doou
        if (!acc[transfer.from_user_id]) {
          acc[transfer.from_user_id] = { given: 0, received: 0 };
        }
        acc[transfer.from_user_id].given++;

        // Quem recebeu
        if (!acc[transfer.to_user_id]) {
          acc[transfer.to_user_id] = { given: 0, received: 0 };
        }
        acc[transfer.to_user_id].received++;

        return acc;
      }, {} as Record<string, { given: number; received: number }>);

      return {
        totalTransfers,
        thisMonth,
        userStats,
      };
    },
    enabled: !!activeTenant?.tenant_id,
  });
};