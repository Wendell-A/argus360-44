
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

type Office = Database["public"]["Tables"]["offices"]["Row"];
type OfficeInsert = Database["public"]["Tables"]["offices"]["Insert"];
type OfficeUpdate = Database["public"]["Tables"]["offices"]["Update"];

export const useOffices = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { activeTenant } = useAuth();

  // Buscar todos os escritórios do tenant ativo
  const { data: offices = [], isLoading } = useQuery({
    queryKey: ["offices", activeTenant?.tenant_id],
    queryFn: async () => {
      if (!activeTenant?.tenant_id) {
        console.log("No active tenant found");
        return [];
      }

      console.log("Fetching offices for tenant:", activeTenant.tenant_id);
      const { data, error } = await supabase
        .from("offices")
        .select("*")
        .eq("tenant_id", activeTenant.tenant_id)
        .eq("active", true)
        .order("name");

      if (error) {
        console.error("Error fetching offices:", error);
        throw error;
      }

      console.log("Fetched offices:", data);
      return data as Office[];
    },
    enabled: !!activeTenant?.tenant_id,
  });

  // Criar escritório
  const createOfficeMutation = useMutation({
    mutationFn: async (office: Omit<OfficeInsert, 'tenant_id'>) => {
      if (!activeTenant?.tenant_id) {
        throw new Error("Tenant não encontrado");
      }

      console.log("Creating office:", office);
      const { data, error } = await supabase
        .from("offices")
        .insert([{ ...office, tenant_id: activeTenant.tenant_id }])
        .select()
        .single();

      if (error) {
        console.error("Error creating office:", error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["offices", activeTenant?.tenant_id] });
      toast({
        title: "Sucesso",
        description: "Escritório criado com sucesso!",
      });
    },
    onError: (error) => {
      console.error("Error creating office:", error);
      toast({
        title: "Erro",
        description: "Erro ao criar escritório. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  // Atualizar escritório
  const updateOfficeMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: OfficeUpdate }) => {
      console.log("Updating office:", id, updates);
      const { data, error } = await supabase
        .from("offices")
        .update(updates)
        .eq("id", id)
        .eq("tenant_id", activeTenant?.tenant_id) // Garantir isolamento
        .select()
        .single();

      if (error) {
        console.error("Error updating office:", error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["offices", activeTenant?.tenant_id] });
      toast({
        title: "Sucesso",
        description: "Escritório atualizado com sucesso!",
      });
    },
    onError: (error) => {
      console.error("Error updating office:", error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar escritório. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  // Deletar escritório
  const deleteOfficeMutation = useMutation({
    mutationFn: async (id: string) => {
      console.log("Deleting office:", id);
      const { error } = await supabase
        .from("offices")
        .update({ active: false })
        .eq("id", id)
        .eq("tenant_id", activeTenant?.tenant_id); // Garantir isolamento

      if (error) {
        console.error("Error deleting office:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["offices", activeTenant?.tenant_id] });
      toast({
        title: "Sucesso",
        description: "Escritório removido com sucesso!",
      });
    },
    onError: (error) => {
      console.error("Error deleting office:", error);
      toast({
        title: "Erro",
        description: "Erro ao remover escritório. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  return {
    offices,
    isLoading,
    createOffice: createOfficeMutation.mutate,
    updateOffice: updateOfficeMutation.mutate,
    deleteOffice: deleteOfficeMutation.mutate,
    isCreating: createOfficeMutation.isPending,
    isUpdating: updateOfficeMutation.isPending,
    isDeleting: deleteOfficeMutation.isPending,
  };
};
