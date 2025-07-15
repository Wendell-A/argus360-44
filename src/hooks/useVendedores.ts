
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

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
  const { activeTenant } = useAuth();

  // Buscar todos os vendedores (profiles que são vendedores) - FILTRADO POR TENANT
  const { data: vendedores = [], isLoading } = useQuery({
    queryKey: ["vendedores", activeTenant?.tenant_id],
    queryFn: async () => {
      if (!activeTenant?.tenant_id) {
        return [];
      }

      console.log("Fetching vendedores for tenant:", activeTenant.tenant_id);
      
      // Primeiro, buscar os usuários que pertencem ao tenant através de office_users
      const { data: officeUsers, error: officeUsersError } = await supabase
        .from("office_users")
        .select("user_id")
        .eq("tenant_id", activeTenant.tenant_id)
        .eq("active", true);

      if (officeUsersError) {
        console.error("Error fetching office users:", officeUsersError);
        throw officeUsersError;
      }

      if (!officeUsers || officeUsers.length === 0) {
        return [];
      }

      const userIds = officeUsers.map(ou => ou.user_id);

      // Buscar profiles desses usuários
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .in("id", userIds);

      if (profilesError) {
        console.error("Error fetching profiles:", profilesError);
        throw profilesError;
      }

      if (!profiles || profiles.length === 0) {
        return [];
      }

      // Buscar vendas apenas para usuários do tenant atual
      const { data: salesData, error: salesError } = await supabase
        .from("sales")
        .select("id, seller_id")
        .eq("tenant_id", activeTenant.tenant_id)
        .in("seller_id", userIds);

      if (salesError) {
        console.error("Error fetching sales:", salesError);
      }

      // Buscar comissões apenas para usuários do tenant atual
      const { data: commissionsData, error: commissionsError } = await supabase
        .from("commissions")
        .select("commission_amount, recipient_id")
        .eq("tenant_id", activeTenant.tenant_id)
        .eq("recipient_type", "seller")
        .in("recipient_id", userIds);

      if (commissionsError) {
        console.error("Error fetching commissions:", commissionsError);
      }

      const sales = salesData || [];
      const commissions = commissionsData || [];

      // Para cada profile, calcular dados de vendas e comissões
      const processedData = profiles.map((profile) => {
        const profileSales = sales.filter(s => s.seller_id === profile.id);
        const profileCommissions = commissions.filter(c => c.recipient_id === profile.id);

        return {
          ...profile,
          sales_count: profileSales.length,
          commission_total: profileCommissions.reduce((sum, c) => sum + (c.commission_amount || 0), 0),
          active_status: true,
        } as VendedorData;
      });

      console.log("Fetched vendedores for tenant:", processedData);
      return processedData;
    },
    enabled: !!activeTenant?.tenant_id,
  });

  // Criar vendedor
  const createVendedorMutation = useMutation({
    mutationFn: async (vendedor: ProfileInsert & { office_id?: string }) => {
      if (!activeTenant?.tenant_id) {
        throw new Error("Tenant não encontrado");
      }

      console.log("Creating vendedor:", vendedor);
      
      // Criar o profile primeiro
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .insert([{
          id: vendedor.id,
          full_name: vendedor.full_name,
          email: vendedor.email,
          phone: vendedor.phone,
          department: vendedor.department,
          position: vendedor.position,
        }])
        .select()
        .single();

      if (profileError) {
        console.error("Error creating profile:", profileError);
        throw profileError;
      }

      // Se foi selecionado um escritório, criar a associação
      if (vendedor.office_id && vendedor.office_id !== "") {
        const { error: officeUserError } = await supabase
          .from("office_users")
          .insert([{
            user_id: profileData.id,
            office_id: vendedor.office_id,
            tenant_id: activeTenant.tenant_id,
            role: "user",
            active: true,
          }]);

        if (officeUserError) {
          console.error("Error creating office user:", officeUserError);
          // Não falhar a criação do vendedor por causa disso
        }
      }

      return profileData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendedores", activeTenant?.tenant_id] });
      queryClient.invalidateQueries({ queryKey: ["office_users", activeTenant?.tenant_id] });
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
      queryClient.invalidateQueries({ queryKey: ["vendedores", activeTenant?.tenant_id] });
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
      
      // Desativar associações com escritórios
      await supabase
        .from("office_users")
        .update({ active: false })
        .eq("user_id", id);

      // Atualizar settings do profile
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
      queryClient.invalidateQueries({ queryKey: ["vendedores", activeTenant?.tenant_id] });
      queryClient.invalidateQueries({ queryKey: ["office_users", activeTenant?.tenant_id] });
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
