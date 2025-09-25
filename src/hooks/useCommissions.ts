
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface CommissionFilters {
  dateRange?: 'today' | 'week' | 'month' | 'previous_month' | 'current_year' | 'previous_year' | 'all_periods';
  office?: string;
  seller?: string;
  product?: string;
}

export const useCommissions = (filters: CommissionFilters = {}) => {
  const { activeTenant } = useAuth();
  const { toast } = useToast();

  const {
    data: commissions = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["commissions", activeTenant?.tenant_id, filters],
    queryFn: async () => {
      if (!activeTenant?.tenant_id) {
        throw new Error("No active tenant");
      }

      // Calcular datas baseadas no filtro
      const getDateRange = () => {
        if (!filters.dateRange || filters.dateRange === 'all_periods') return { start: null, end: null };
        
        const now = new Date();
        switch (filters.dateRange) {
          case 'today':
            return {
              start: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
              end: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
            };
          case 'week':
            const weekStart = new Date(now);
            weekStart.setDate(now.getDate() - now.getDay());
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 7);
            return { start: weekStart, end: weekEnd };
          case 'month':
            return {
              start: new Date(now.getFullYear(), now.getMonth(), 1),
              end: new Date(now.getFullYear(), now.getMonth() + 1, 1)
            };
          case 'previous_month':
            return {
              start: new Date(now.getFullYear(), now.getMonth() - 1, 1),
              end: new Date(now.getFullYear(), now.getMonth(), 1)
            };
          case 'current_year':
            return {
              start: new Date(now.getFullYear(), 0, 1),
              end: new Date(now.getFullYear() + 1, 0, 1)
            };
          case 'previous_year':
            return {
              start: new Date(now.getFullYear() - 1, 0, 1),
              end: new Date(now.getFullYear(), 0, 1)
            };
          default:
            return { start: null, end: null };
        }
      };

      const dateRange = getDateRange();

      let query = supabase
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
        .eq("tenant_id", activeTenant.tenant_id);

      // Aplicar filtros de data baseado no payment_date
      if (dateRange.start && dateRange.end) {
        query = query.gte('payment_date', dateRange.start.toISOString().split('T')[0])
                     .lt('payment_date', dateRange.end.toISOString().split('T')[0]);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

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
      let enrichedData = data?.map(commission => ({
        ...commission,
        seller_profile: sellersData.find(p => p.id === commission.sales?.seller_id),
        recipient_profile: sellersData.find(p => p.id === commission.recipient_id)
      })) || [];

      // Aplicar filtros adicionais
      if (filters.office && filters.office !== 'all') {
        enrichedData = enrichedData.filter(commission => 
          commission.sales?.offices?.name === filters.office ||
          commission.sales?.office_id === filters.office
        );
      }

      if (filters.seller && filters.seller !== 'all') {
        enrichedData = enrichedData.filter(commission => 
          commission.sales?.seller_id === filters.seller
        );
      }

      if (filters.product && filters.product !== 'all') {
        enrichedData = enrichedData.filter(commission => 
          commission.sales?.consortium_products?.name === filters.product
        );
      }

      return enrichedData;
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
