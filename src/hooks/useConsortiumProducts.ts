
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export type ConsortiumProduct = Database["public"]["Tables"]["consortium_products"]["Row"];
type ConsortiumProductInsert = Database["public"]["Tables"]["consortium_products"]["Insert"];
type ConsortiumProductUpdate = Database["public"]["Tables"]["consortium_products"]["Update"];

export const useConsortiumProducts = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { activeTenant } = useAuth();

  console.log("useConsortiumProducts - activeTenant:", activeTenant);

  // Buscar todos os produtos de consórcio
  const { data: products = [], isLoading, error } = useQuery({
    queryKey: ["consortium_products", activeTenant?.tenant_id],
    queryFn: async () => {
      console.log("Fetching consortium products for tenant:", activeTenant?.tenant_id);
      
      if (!activeTenant?.tenant_id) {
        console.log("No active tenant, returning empty array");
        return [];
      }

      const { data, error } = await supabase
        .from("consortium_products")
        .select("*")
        .eq("tenant_id", activeTenant.tenant_id)
        .order("name");

      if (error) {
        console.error("Error fetching consortium products:", error);
        throw error;
      }

      console.log("Fetched consortium products:", data);
      return data as ConsortiumProduct[];
    },
    enabled: !!activeTenant?.tenant_id,
  });

  // Criar produto
  const createProductMutation = useMutation({
    mutationFn: async (product: Omit<ConsortiumProductInsert, 'tenant_id'>) => {
      if (!activeTenant?.tenant_id) {
        throw new Error("Tenant não encontrado");
      }

      console.log("Creating consortium product:", product);
      const { data, error } = await supabase
        .from("consortium_products")
        .insert([{ ...product, tenant_id: activeTenant.tenant_id }])
        .select()
        .single();

      if (error) {
        console.error("Error creating consortium product:", error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["consortium_products", activeTenant?.tenant_id] });
      toast({
        title: "Sucesso",
        description: "Produto criado com sucesso!",
      });
    },
    onError: (error) => {
      console.error("Error creating consortium product:", error);
      toast({
        title: "Erro",
        description: "Erro ao criar produto. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  // Atualizar produto
  const updateProductMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: ConsortiumProductUpdate }) => {
      console.log("Updating consortium product:", id, updates);
      const { data, error } = await supabase
        .from("consortium_products")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error("Error updating consortium product:", error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["consortium_products", activeTenant?.tenant_id] });
      toast({
        title: "Sucesso",
        description: "Produto atualizado com sucesso!",
      });
    },
    onError: (error) => {
      console.error("Error updating consortium product:", error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar produto. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  // Deletar produto
  const deleteProductMutation = useMutation({
    mutationFn: async (id: string) => {
      console.log("Deleting consortium product:", id);
      const { error } = await supabase
        .from("consortium_products")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("Error deleting consortium product:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["consortium_products", activeTenant?.tenant_id] });
      toast({
        title: "Sucesso",
        description: "Produto removido com sucesso!",
      });
    },
    onError: (error) => {
      console.error("Error deleting consortium product:", error);
      toast({
        title: "Erro",
        description: "Erro ao remover produto. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  return {
    products,
    isLoading,
    error,
    createProduct: createProductMutation.mutate,
    updateProduct: updateProductMutation.mutate,
    deleteProduct: deleteProductMutation.mutate,
    isCreating: createProductMutation.isPending,
    isUpdating: updateProductMutation.isPending,
    isDeleting: deleteProductMutation.isPending,
  };
};

// Export individual mutation hooks for better separation of concerns
export const useCreateConsortiumProduct = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { activeTenant } = useAuth();

  return useMutation({
    mutationFn: async (product: Omit<ConsortiumProductInsert, 'tenant_id'>) => {
      if (!activeTenant?.tenant_id) {
        throw new Error("Tenant não encontrado");
      }

      const { data, error } = await supabase
        .from("consortium_products")
        .insert([{ ...product, tenant_id: activeTenant.tenant_id }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["consortium_products", activeTenant?.tenant_id] });
      toast({
        title: "Sucesso",
        description: "Produto criado com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao criar produto. Tente novamente.",
        variant: "destructive",
      });
    },
  });
};

export const useUpdateConsortiumProduct = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { activeTenant } = useAuth();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & ConsortiumProductUpdate) => {
      const { data, error } = await supabase
        .from("consortium_products")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["consortium_products", activeTenant?.tenant_id] });
      toast({
        title: "Sucesso",
        description: "Produto atualizado com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar produto. Tente novamente.",
        variant: "destructive",
      });
    },
  });
};

export const useDeleteConsortiumProduct = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { activeTenant } = useAuth();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("consortium_products")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["consortium_products", activeTenant?.tenant_id] });
      toast({
        title: "Sucesso",
        description: "Produto removido com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao remover produto. Tente novamente.",
        variant: "destructive",
      });
    },
  });
};
