
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
  active: boolean;
  user?: {
    full_name: string | null;
    email: string;
  };
  office?: {
    name: string;
  };
  team?: {
    name: string;
  };
}

export const useVendedores = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { activeTenant } = useAuth();

  // Buscar todos os vendedores usando tenant_users como filtro principal
  const { data: vendedores = [], isLoading } = useQuery({
    queryKey: ["vendedores", activeTenant?.tenant_id],
    queryFn: async () => {
      if (!activeTenant?.tenant_id) {
        return [];
      }

      console.log("Fetching vendedores for tenant:", activeTenant.tenant_id);
      
      // Buscar usuários que pertencem ao tenant através de tenant_users
      const { data: tenantUsers, error: tenantUsersError } = await supabase
        .from("tenant_users")
        .select("user_id")
        .eq("tenant_id", activeTenant.tenant_id)
        .eq("active", true);

      if (tenantUsersError) {
        console.error("Error fetching tenant users:", tenantUsersError);
        throw tenantUsersError;
      }

      if (!tenantUsers || tenantUsers.length === 0) {
        console.log("No tenant users found for tenant:", activeTenant.tenant_id);
        return [];
      }

      const userIds = tenantUsers.map(tu => tu.user_id);
      console.log("Found user IDs for tenant:", userIds);

      // Buscar profiles desses usuários com joins de escritórios e equipes
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select(`
          *,
          office_users!inner (
            office_id,
            active,
            offices (
              id,
              name
            )
          ),
          team_members (
            team_id,
            teams (
              id,
              name
            )
          )
        `)
        .in("id", userIds);

      if (profilesError) {
        console.error("Error fetching profiles:", profilesError);
        throw profilesError;
      }

      if (!profiles || profiles.length === 0) {
        console.log("No profiles found for user IDs:", userIds);
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
      const processedData = profiles.map((profile: any) => {
        const profileSales = sales.filter(s => s.seller_id === profile.id);
        const profileCommissions = commissions.filter(c => c.recipient_id === profile.id);

        // Extrair dados do escritório
        const activeOfficeUser = profile.office_users?.find((ou: any) => ou.active);
        const officeName = activeOfficeUser?.offices?.name || 'N/A';

        // Extrair dados da equipe
        const activeTeamMember = profile.team_members?.[0];
        const teamName = activeTeamMember?.teams?.name || 'Sem equipe';

        return {
          ...profile,
          sales_count: profileSales.length,
          commission_total: profileCommissions.reduce((sum, c) => sum + (c.commission_amount || 0), 0),
          active: profile.settings?.active !== false,
          office_id: activeOfficeUser?.office_id,
          team_id: activeTeamMember?.team_id,
          commission_rate: profile.settings?.commission_rate || 0,
          sales_goal: profile.settings?.sales_goal || 0,
          user: {
            full_name: profile.full_name,
            email: profile.email,
          },
          office: {
            name: officeName
          },
          team: {
            name: teamName
          }
        } as VendedorData;
      });

      console.log("Processed vendedores data:", processedData);
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

      // Garantir que o usuário está associado ao tenant
      const { error: tenantUserError } = await supabase
        .from("tenant_users")
        .insert([{
          user_id: profileData.id,
          tenant_id: activeTenant.tenant_id,
          role: "user",
          active: true,
        }]);

      if (tenantUserError) {
        console.error("Error creating tenant user:", tenantUserError);
        // Não falhar a criação do vendedor por causa disso, mas logar o erro
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
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      if (!activeTenant?.tenant_id) {
        throw new Error("Tenant não encontrado");
      }

      console.log("Updating vendedor:", id, data);
      
      // Atualizar profile com todas as informações
      const { data: result, error } = await supabase
        .from("profiles")
        .update({
          full_name: data.full_name,
          email: data.email,
          phone: data.phone,
          department: data.department,
          position: data.position,
          hierarchical_level: data.hierarchical_level,
          settings: data.settings
        })
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error("Error updating profile:", error);
        throw error;
      }

      // Atualizar office_users se office_id foi fornecido
      if (data.settings?.office_id) {
        // Primeiro, desativar todas as associações existentes
        await supabase
          .from("office_users")
          .update({ active: false })
          .eq("user_id", id)
          .eq("tenant_id", activeTenant.tenant_id);

        // Criar nova associação com o escritório
        const { error: officeError } = await supabase
          .from("office_users")
          .upsert({
            user_id: id,
            office_id: data.settings.office_id,
            tenant_id: activeTenant.tenant_id,
            role: "user",
            active: true,
          });

        if (officeError) {
          console.error("Error updating office association:", officeError);
          // Não falhar a atualização por causa disso
        }
      }

      return result;
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
    createVendedor: createVendedorMutation,
    updateVendedor: updateVendedorMutation,
    deleteVendedor: deleteVendedorMutation,
    isCreating: createVendedorMutation.isPending,
    isUpdating: updateVendedorMutation.isPending,
    isDeleting: deleteVendedorMutation.isPending,
  };
};
