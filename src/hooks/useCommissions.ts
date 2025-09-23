
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export const useCommissions = () => {
  const { activeTenant } = useAuth();
  const { toast } = useToast();

  const {
    data: commissions = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["commissions", activeTenant?.tenant_id],
    queryFn: async () => {
      if (!activeTenant?.tenant_id) {
        throw new Error("No active tenant");
      }

      const { data, error } = await supabase
        .from("commissions")
        .select(`
          *,
          sales (
            id,
            sale_value,
            client_id,
            seller_id,
            office_id,
            product_id,
            sale_date,
            contract_number,
            clients (
              name,
              document,
              email
            ),
            consortium_products (
              name,
              category
            ),
            offices (
              name
            )
          )
        `)
        .eq("tenant_id", activeTenant.tenant_id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Buscar informações dos vendedores
      const sellerIds = data?.map(c => c.sales?.seller_id).filter(Boolean) || [];
      const recipientIds = data?.map(c => c.recipient_id).filter(Boolean) || [];
      const allUserIds = [...new Set([...sellerIds, ...recipientIds])];

      let sellersData = [];
      if (allUserIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', allUserIds);
        sellersData = profiles || [];
      }

      // Enriquecer dados com informações dos vendedores
      const enrichedData = data?.map(commission => ({
        ...commission,
        seller_profile: sellersData.find(p => p.id === commission.sales?.seller_id),
        recipient_profile: sellersData.find(p => p.id === commission.recipient_id)
      }));

      return enrichedData || [];
    },
    enabled: !!activeTenant?.tenant_id,
  });

  return {
    commissions,
    isLoading,
    error,
    refetch,
  };
};

export const useApproveCommission = () => {
  const queryClient = useQueryClient();
  const { activeTenant } = useAuth();
  const { toast } = useToast();

  const {
    mutateAsync: approveCommissionAsync,
    isPending: isApproving,
    error,
  } = useMutation({
    mutationFn: async (commissionId: string) => {
      if (!activeTenant?.tenant_id) {
        throw new Error("No active tenant");
      }

      const { data, error } = await supabase
        .from("commissions")
        .update({
          status: 'approved',
          approval_date: new Date().toISOString().split('T')[0],
        })
        .eq("id", commissionId)
        .eq("tenant_id", activeTenant.tenant_id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commissions"] });
      toast({
        title: "Comissão aprovada",
        description: "A comissão foi aprovada com sucesso.",
      });
    },
    onError: (error) => {
      console.error("Error approving commission:", error);
      toast({
        title: "Erro ao aprovar comissão",
        description: "Não foi possível aprovar a comissão. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  return {
    approveCommissionAsync,
    isApproving,
    error,
  };
};

export const usePayCommission = () => {
  const queryClient = useQueryClient();
  const { activeTenant } = useAuth();
  const { toast } = useToast();

  const {
    mutateAsync: payCommissionAsync,
    isPending: isPaying,
    error,
  } = useMutation({
    mutationFn: async ({ 
      commissionId, 
      paymentMethod, 
      paymentReference 
    }: { 
      commissionId: string; 
      paymentMethod: string; 
      paymentReference?: string; 
    }) => {
      if (!activeTenant?.tenant_id) {
        throw new Error("No active tenant");
      }

      const { data, error } = await supabase
        .from("commissions")
        .update({
          status: 'paid',
          payment_date: new Date().toISOString().split('T')[0],
          payment_method: paymentMethod,
          payment_reference: paymentReference,
        })
        .eq("id", commissionId)
        .eq("tenant_id", activeTenant.tenant_id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commissions"] });
      toast({
        title: "Comissão paga",
        description: "O pagamento da comissão foi registrado com sucesso.",
      });
    },
    onError: (error) => {
      console.error("Error paying commission:", error);
      toast({
        title: "Erro ao registrar pagamento",
        description: "Não foi possível registrar o pagamento. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  return {
    payCommissionAsync,
    isPaying,
    error,
  };
};
