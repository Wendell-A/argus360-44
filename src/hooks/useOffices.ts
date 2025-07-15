
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";

type Office = Database["public"]["Tables"]["offices"]["Row"];
type OfficeInsert = Database["public"]["Tables"]["offices"]["Insert"];
type OfficeUpdate = Database["public"]["Tables"]["offices"]["Update"];

export const useOffices = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Buscar todos os escritórios
  const { data: offices = [], isLoading } = useQuery({
    queryKey: ["offices"],
    queryFn: async () => {
      console.log("Fetching offices...");
      const { data, error } = await supabase
        .from("offices")
        .select("*")
        .order("name");

      if (error) {
        console.error("Error fetching offices:", error);
        throw error;
      }

      console.log("Fetched offices:", data);
      return data as Office[];
    },
  });

  // Criar escritório
  const createOfficeMutation = useMutation({
    mutationFn: async (office: OfficeInsert) => {
      console.log("Creating office:", office);
      const { data, error } = await supabase
        .from("offices")
        .insert([office])
        .select()
        .single();

      if (error) {
        console.error("Error creating office:", error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["offices"] });
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
        .select()
        .single();

      if (error) {
        console.error("Error updating office:", error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["offices"] });
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
        .delete()
        .eq("id", id);

      if (error) {
        console.error("Error deleting office:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["offices"] });
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
