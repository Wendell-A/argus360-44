
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type ProfileInsert = Database["public"]["Tables"]["profiles"]["Insert"];
type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];

interface VendedorData extends Profile {
  sales_count?: number;
  commission_total?: number;
  active_status?: boolean;
}

export const useVendedores = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Buscar todos os vendedores (profiles que são vendedores)
  const { data: vendedores = [], isLoading } = useQuery({
    queryKey: ["vendedores"],
    queryFn: async () => {
      console.log("Fetching vendedores...");
      
      // Buscar profiles básicos primeiro
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("full_name");

      if (profilesError) {
        console.error("Error fetching profiles:", profilesError);
        throw profilesError;
      }

      // Para cada profile, buscar dados de vendas e comissões separadamente
      const processedData = await Promise.all(
        profiles.map(async (profile) => {
          try {
            // Buscar vendas onde o seller_id corresponde ao profile.id
            const { data: salesData, error: salesError } = await supabase
              .from("sales")
              .select("id")
              .eq("seller_id", profile.id);

            // Buscar comissões onde o recipient_id corresponde ao profile.id
            const { data: commissionsData, error: commissionsError } = await supabase
              .from("commissions")
              .select("commission_amount")
              .eq("recipient_id", profile.id);

            const sales = salesData || [];
            const commissions = commissionsData || [];

            return {
              ...profile,
              sales_count: sales.length,
              commission_total: commissions.reduce((sum, c) => sum + (c.commission_amount || 0), 0),
              active_status: true, // Por enquanto assumindo todos ativos
            } as VendedorData;
          } catch (error) {
            console.error("Error processing profile data:", error);
            // Retornar dados básicos em caso de erro
            return {
              ...profile,
              sales_count: 0,
              commission_total: 0,
              active_status: true,
            } as VendedorData;
          }
        })
      );

      console.log("Fetched vendedores:", processedData);
      return processedData;
    },
  });

  // Criar vendedor
  const createVendedorMutation = useMutation({
    mutationFn: async (vendedor: ProfileInsert) => {
      console.log("Creating vendedor:", vendedor);
      const { data, error } = await supabase
        .from("profiles")
        .insert([vendedor])
        .select()
        .single();

      if (error) {
        console.error("Error creating vendedor:", error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendedores"] });
      toast({
        title: "Sucesso",
        description: "Vendedor criado com sucesso!",
      });
    },
    onError: (error) => {
      console.error("Error creating vendedor:", error);
      toast({
        title: "Erro",
        description: "Erro ao criar vendedor. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  // Atualizar vendedor
  const updateVendedorMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: ProfileUpdate }) => {
      console.log("Updating vendedor:", id, updates);
      const { data, error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error("Error updating vendedor:", error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendedores"] });
      toast({
        title: "Sucesso",
        description: "Vendedor atualizado com sucesso!",
      });
    },
    onError: (error) => {
      console.error("Error updating vendedor:", error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar vendedor. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  // Deletar vendedor (soft delete - só desativar)
  const deleteVendedorMutation = useMutation({
    mutationFn: async (id: string) => {
      console.log("Deactivating vendedor:", id);
      
      // Por enquanto, vamos apenas atualizar o status para inativo
      // Em uma implementação completa, teríamos uma coluna 'active' na tabela profiles
      const { error } = await supabase
        .from("profiles")
        .update({ 
          settings: { active: false }
        })
        .eq("id", id);

      if (error) {
        console.error("Error deactivating vendedor:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendedores"] });
      toast({
        title: "Sucesso",
        description: "Vendedor desativado com sucesso!",
      });
    },
    onError: (error) => {
      console.error("Error deactivating vendedor:", error);
      toast({
        title: "Erro",
        description: "Erro ao desativar vendedor. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  return {
    vendedores,
    isLoading,
    createVendedor: createVendedorMutation.mutate,
    updateVendedor: updateVendedorMutation.mutate,
    deleteVendedor: deleteVendedorMutation.mutate,
    isCreating: createVendedorMutation.isPending,
    isUpdating: updateVendedorMutation.isPending,
    isDeleting: deleteVendedorMutation.isPending,
  };
};
