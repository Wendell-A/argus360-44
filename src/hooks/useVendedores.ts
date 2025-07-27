
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
  user_id: string;
  office_id?: string;
  team_id?: string;
  user?: {
    full_name: string | null;
    email: string;
  };
  office?: {
    id: string;
    name: string;
  };
  team?: {
    id: string;
    name: string;
  };
}

export const useVendedores = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { activeTenant } = useAuth();

  // Buscar todos os vendedores usando tenant_users como fonte principal
  const { data: vendedores = [], isLoading } = useQuery({
    queryKey: ["vendedores", activeTenant?.tenant_id],
    queryFn: async () => {
      if (!activeTenant?.tenant_id) {
        return [];
      }

      console.log("Fetching vendedores for tenant:", activeTenant.tenant_id);
      
      // Buscar usuários do tenant
      const { data: tenantUsersData, error: tenantUsersError } = await supabase
        .from("tenant_users")
        .select(`
          user_id,
          office_id,
          team_id,
          active,
          offices (
            id,
            name
          ),
          teams (
            id,
            name
          )
        `)
        .eq("tenant_id", activeTenant.tenant_id)
        .eq("active", true);

      if (tenantUsersError) {
        console.error("Error fetching tenant users data:", tenantUsersError);
        throw tenantUsersError;
      }

      if (!tenantUsersData || tenantUsersData.length === 0) {
        console.log("No tenant users found for tenant:", activeTenant.tenant_id);
        return [];
      }

<<<<<<< HEAD
      const userIds = tenantUsers.map(tu => tu.user_id);
      console.log("Found user IDs for tenant:", userIds);

      // Buscar profiles desses usuários com informações de escritório e equipe
      const { data: profiles, error: profilesError } = await supabase
=======
      // Buscar profiles dos usuários separadamente
      const userIds = tenantUsersData.map(tu => tu.user_id);
      const { data: profilesData, error: profilesError } = await supabase
>>>>>>> 589d1908680ef0cc2ec077e53d0a035a5f1aaf9a
        .from("profiles")
        .select(`
          id,
          full_name,
          email,
          phone,
          department,
          position,
          hierarchical_level,
          settings
        `)
        .in("id", userIds);

      if (profilesError) {
        console.error("Error fetching profiles:", profilesError);
        throw profilesError;
      }

      console.log("Raw tenant users data:", tenantUsersData);

<<<<<<< HEAD
      // Buscar associações com escritórios
      const { data: officeUsers, error: officeUsersError } = await supabase
        .from("office_users")
        .select(`
          user_id,
          office_id,
          offices!inner(
            id,
            name
          )
        `)
        .eq("tenant_id", activeTenant.tenant_id)
        .eq("active", true)
        .in("user_id", userIds);

      if (officeUsersError) {
        console.error("Error fetching office users:", officeUsersError);
      }

      // Buscar associações com equipes
      const { data: teamMembers, error: teamMembersError } = await supabase
        .from("team_members")
        .select(`
          user_id,
          team_id,
          teams!inner(
            id,
            name
          )
        `)
        .eq("active", true)
        .in("user_id", userIds);

      if (teamMembersError) {
        console.error("Error fetching team members:", teamMembersError);
      }

      // Buscar vendas apenas para usuários do tenant atual
=======
      // Buscar dados de vendas para todos os usuários
>>>>>>> 589d1908680ef0cc2ec077e53d0a035a5f1aaf9a
      const { data: salesData, error: salesError } = await supabase
        .from("sales")
        .select("id, seller_id")
        .eq("tenant_id", activeTenant.tenant_id)
        .in("seller_id", userIds);

      if (salesError) {
        console.error("Error fetching sales:", salesError);
      }

      // Buscar comissões para todos os usuários
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

      // Processar dados dos vendedores
      const processedData = tenantUsersData.map((tenantUser: any) => {
        const profile = profilesData?.find(p => p.id === tenantUser.user_id);
        if (!profile) return null;
        
        const profileSales = sales.filter(s => s.seller_id === profile.id);
        const profileCommissions = commissions.filter(c => c.recipient_id === profile.id);
        
        // Encontrar escritório do usuário
        const userOffice = officeUsers?.find(ou => ou.user_id === profile.id);
        
        // Encontrar equipe do usuário
        const userTeam = teamMembers?.find(tm => tm.user_id === profile.id);

        return {
          ...profile,
          user_id: profile.id,
          office_id: userOffice?.office_id || '',
          team_id: userTeam?.team_id || '',
          sales_count: profileSales.length,
          commission_total: profileCommissions.reduce((sum, c) => sum + (c.commission_amount || 0), 0),
          active: (profile.settings as any)?.active !== false,
          office_id: tenantUser.office_id || null,
          team_id: tenantUser.team_id || null,
          commission_rate: (profile.settings as any)?.commission_rate || 0,
          sales_goal: (profile.settings as any)?.sales_goal || 0,
          user: {
            full_name: profile.full_name,
            email: profile.email,
          },
<<<<<<< HEAD
          office: userOffice ? {
            id: userOffice.office_id,
            name: userOffice.offices?.name || 'N/A'
          } : undefined,
          team: userTeam ? {
            id: userTeam.team_id,
            name: userTeam.teams?.name || 'Sem equipe'
          } : undefined
        } as VendedorData;
      });
=======
          office: {
            name: tenantUser.offices?.name || 'Sem escritório'
          },
          team: {
            name: tenantUser.teams?.name || 'Sem equipe'
          }
        };
      }).filter(Boolean); // Remove nulls
>>>>>>> 589d1908680ef0cc2ec077e53d0a035a5f1aaf9a

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
          hierarchical_level: vendedor.hierarchical_level,
          settings: vendedor.settings,
        }])
        .select()
        .single();

      if (profileError) {
        console.error("Error creating profile:", profileError);
        throw profileError;
      }

      // Garantir que o usuário está associado ao tenant com escritório
      const { error: tenantUserError } = await supabase
        .from("tenant_users")
        .insert([{
          user_id: profileData.id,
          tenant_id: activeTenant.tenant_id,
          office_id: vendedor.office_id || null,
          role: "user",
          active: true,
        }]);

      if (tenantUserError) {
        console.error("Error creating tenant user:", tenantUserError);
        throw tenantUserError;
      }

      return profileData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendedores", activeTenant?.tenant_id] });
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

  // Atualizar vendedor - CORRIGIDO
  const updateVendedorMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      if (!activeTenant?.tenant_id) {
        throw new Error("Tenant não encontrado");
      }

      console.log("Updating vendedor:", id, data);
      
<<<<<<< HEAD
      // Atualizar o profile
=======
      // Atualizar profile com todas as informações incluindo hierarchical_level e settings
>>>>>>> 589d1908680ef0cc2ec077e53d0a035a5f1aaf9a
      const { data: result, error } = await supabase
        .from("profiles")
        .update({
          full_name: data.full_name,
          email: data.email,
          phone: data.phone,
          department: data.department,
          position: data.position,
<<<<<<< HEAD
          commission_rate: data.commission_rate,
          hierarchy_level: data.hierarchy_level,
          sales_goal: data.sales_goal,
          whatsapp: data.whatsapp,
          observations: data.observations,
=======
          hierarchical_level: data.hierarchical_level,
          settings: data.settings
>>>>>>> 589d1908680ef0cc2ec077e53d0a035a5f1aaf9a
        })
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error("Error updating profile:", error);
        throw error;
      }

<<<<<<< HEAD
      // Atualizar associação com escritório se necessário
      if (data.office_id) {
        // Primeiro, desativar associações existentes
        await supabase
          .from("office_users")
          .update({ active: false })
          .eq("user_id", id)
          .eq("tenant_id", activeTenant.tenant_id);

        // Criar nova associação
        const { error: officeError } = await supabase
          .from("office_users")
          .upsert({
            user_id: id,
            office_id: data.office_id,
            tenant_id: activeTenant.tenant_id,
            role: "user",
            active: true,
          });

        if (officeError) {
          console.error("Error updating office association:", officeError);
        }
      }

      // Atualizar associação com equipe se necessário
      if (data.team_id && data.team_id !== '') {
        // Primeiro, desativar associações existentes
        await supabase
          .from("team_members")
          .update({ active: false })
          .eq("user_id", id);

        // Criar nova associação
        const { error: teamError } = await supabase
          .from("team_members")
          .upsert({
            user_id: id,
            team_id: data.team_id,
            role: "member",
            active: true,
          });

        if (teamError) {
          console.error("Error updating team association:", teamError);
=======
      // Atualizar tenant_users se office_id foi fornecido
      if (data.settings?.office_id !== undefined) {
        const { error: tenantUserError } = await supabase
          .from("tenant_users")
          .update({ 
            office_id: data.settings.office_id || null,
            team_id: data.settings.team_id || null
          })
          .eq("user_id", id)
          .eq("tenant_id", activeTenant.tenant_id);

        if (tenantUserError) {
          console.error("Error updating tenant user:", tenantUserError);
          // Não falhar a atualização por causa disso
>>>>>>> 589d1908680ef0cc2ec077e53d0a035a5f1aaf9a
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
      
      // Desativar na tabela tenant_users
      await supabase
        .from("tenant_users")
        .update({ active: false })
        .eq("user_id", id)
        .eq("tenant_id", activeTenant?.tenant_id);

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
