
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export type ConsortiumProduct = Database["public"]["Tables"]["consortium_products"]["Row"];
type ConsortiumProductInsert = Database["public"]["Tables"]["consortium_products"]["Insert"];
type ConsortiumProductUpdate = Database["public"]["Tables"]["consortium_products"]["Update"];

// Tipo estendido para incluir os novos campos
export interface ExtendedConsortiumProduct extends ConsortiumProduct {
  min_credit_value: number | null;
  max_credit_value: number | null;
  advance_fee_rate: number | null;
  min_admin_fee: number | null;
  max_admin_fee: number | null;
  reserve_fund_rate: number | null;
  embedded_bid_rate: number | null;
  adjustment_index: string | null;
  contemplation_modes: any[] | null;
}

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
      return data as ExtendedConsortiumProduct[];
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

  // Mutation para duplicar produto
  const duplicateProductMutation = useMutation({
    mutationFn: async (productId: string) => {
      if (!activeTenant?.tenant_id) throw new Error('Tenant não encontrado');

      const { data: original, error: fetchError } = await supabase
        .from('consortium_products')
        .select('*')
        .eq('id', productId)
        .single();

      if (fetchError) throw fetchError;

      const baseName = original.name.replace(/ #\d+$/, '');
      const { data: existing } = await supabase
        .from('consortium_products')
        .select('name')
        .eq('tenant_id', activeTenant.tenant_id)
        .ilike('name', `${baseName} #%`);

      const nextNumber = (existing?.length || 0) + 1;
      const { id, created_at, updated_at, ...productData } = original;

      const { data, error } = await supabase
        .from('consortium_products')
        .insert({ ...productData, name: `${baseName} #${nextNumber}` })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consortium_products'] });
      toast({ title: 'Sucesso', description: 'Produto duplicado!' });
    },
    onError: () => {
      toast({ title: 'Erro', description: 'Erro ao duplicar', variant: 'destructive' });
    },
  });

  return {
    products,
    isLoading,
    error,
    createProduct: createProductMutation.mutate,
    updateProduct: updateProductMutation.mutate,
    deleteProduct: deleteProductMutation.mutate,
    duplicateProduct: duplicateProductMutation.mutate,
    isCreating: createProductMutation.isPending,
    isUpdating: updateProductMutation.isPending,
    isDeleting: deleteProductMutation.isPending,
    isDuplicating: duplicateProductMutation.isPending,
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
