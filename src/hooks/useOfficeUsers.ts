
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

type OfficeUser = Database["public"]["Tables"]["office_users"]["Row"];
type OfficeUserInsert = Database["public"]["Tables"]["office_users"]["Insert"];
type OfficeUserUpdate = Database["public"]["Tables"]["office_users"]["Update"];

export const useOfficeUsers = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { activeTenant } = useAuth();

  // Buscar todos os office_users
  const { data: officeUsers = [], isLoading } = useQuery({
    queryKey: ["office_users", activeTenant?.tenant_id],
    queryFn: async () => {
      if (!activeTenant?.tenant_id) {
        return [];
      }

      console.log("Fetching office users...");
      const { data, error } = await supabase
        .from("office_users")
        .select(`
          *,
          offices!inner(id, name),
          profiles!inner(id, full_name, email)
        `)
        .eq("tenant_id", activeTenant.tenant_id)
        .eq("active", true);

      if (error) {
        console.error("Error fetching office users:", error);
        throw error;
      }

      console.log("Fetched office users:", data);
      return data;
    },
    enabled: !!activeTenant?.tenant_id,
  });

  // Criar office_user
  const createOfficeUserMutation = useMutation({
    mutationFn: async (officeUser: Omit<OfficeUserInsert, 'tenant_id'>) => {
      if (!activeTenant?.tenant_id) {
        throw new Error("Tenant não encontrado");
      }

      console.log("Creating office user:", officeUser);
      const { data, error } = await supabase
        .from("office_users")
        .insert([{ ...officeUser, tenant_id: activeTenant.tenant_id }])
        .select()
        .single();

      if (error) {
        console.error("Error creating office user:", error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["office_users", activeTenant?.tenant_id] });
      toast({
        title: "Sucesso",
        description: "Usuário associado ao escritório com sucesso!",
      });
    },
    onError: (error) => {
      console.error("Error creating office user:", error);
      toast({
        title: "Erro",
        description: "Erro ao associar usuário ao escritório. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  // Atualizar office_user
  const updateOfficeUserMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: OfficeUserUpdate }) => {
      console.log("Updating office user:", id, updates);
      const { data, error } = await supabase
        .from("office_users")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error("Error updating office user:", error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["office_users", activeTenant?.tenant_id] });
      toast({
        title: "Sucesso",
        description: "Associação atualizada com sucesso!",
      });
    },
    onError: (error) => {
      console.error("Error updating office user:", error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar associação. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  // Deletar office_user
  const deleteOfficeUserMutation = useMutation({
    mutationFn: async (id: string) => {
      console.log("Deleting office user:", id);
      const { error } = await supabase
        .from("office_users")
        .update({ active: false })
        .eq("id", id);

      if (error) {
        console.error("Error deleting office user:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["office_users", activeTenant?.tenant_id] });
      toast({
        title: "Sucesso",
        description: "Associação removida com sucesso!",
      });
    },
    onError: (error) => {
      console.error("Error deleting office user:", error);
      toast({
        title: "Erro",
        description: "Erro ao remover associação. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  return {
    officeUsers,
    isLoading,
    createOfficeUser: createOfficeUserMutation.mutate,
    updateOfficeUser: updateOfficeUserMutation.mutate,
    deleteOfficeUser: deleteOfficeUserMutation.mutate,
    isCreating: createOfficeUserMutation.isPending,
    isUpdating: updateOfficeUserMutation.isPending,
    isDeleting: deleteOfficeUserMutation.isPending,
  };
};
