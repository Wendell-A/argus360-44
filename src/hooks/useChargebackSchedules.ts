
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export type ChargebackSchedule = Database["public"]["Tables"]["product_chargeback_schedules"]["Row"];
type ChargebackScheduleInsert = Database["public"]["Tables"]["product_chargeback_schedules"]["Insert"];
type ChargebackScheduleUpdate = Database["public"]["Tables"]["product_chargeback_schedules"]["Update"];

export const useChargebackSchedules = (productId?: string) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { activeTenant } = useAuth();

  const { data: schedules = [], isLoading, error } = useQuery({
    queryKey: ["chargeback_schedules", activeTenant?.tenant_id, productId],
    queryFn: async () => {
      if (!activeTenant?.tenant_id) return [];

      let query = supabase
        .from("product_chargeback_schedules")
        .select("*")
        .eq("tenant_id", activeTenant.tenant_id)
        .order("max_payment_number");

      if (productId) {
        query = query.eq("product_id", productId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as ChargebackSchedule[];
    },
    enabled: !!activeTenant?.tenant_id,
  });

  const createSchedule = useMutation({
    mutationFn: async (schedule: Omit<ChargebackScheduleInsert, 'tenant_id'>) => {
      if (!activeTenant?.tenant_id) throw new Error("Tenant não encontrado");

      const { data, error } = await supabase
        .from("product_chargeback_schedules")
        .insert([{ ...schedule, tenant_id: activeTenant.tenant_id }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chargeback_schedules"] });
      toast({
        title: "Sucesso",
        description: "Cronograma de estorno criado com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao criar cronograma. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const updateSchedule = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: ChargebackScheduleUpdate }) => {
      const { data, error } = await supabase
        .from("product_chargeback_schedules")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chargeback_schedules"] });
      toast({
        title: "Sucesso",
        description: "Cronograma atualizado com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar cronograma. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const deleteSchedule = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("product_chargeback_schedules")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chargeback_schedules"] });
      toast({
        title: "Sucesso",
        description: "Cronograma removido com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao remover cronograma. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  return {
    schedules,
    isLoading,
    error,
    createSchedule: createSchedule.mutate,
    updateSchedule: updateSchedule.mutate,
    deleteSchedule: deleteSchedule.mutate,
    isCreating: createSchedule.isPending,
    isUpdating: updateSchedule.isPending,
    isDeleting: deleteSchedule.isPending,
  };
};
