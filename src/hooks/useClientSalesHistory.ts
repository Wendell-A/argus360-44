import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ClientSale {
  id: string;
  sale_date: string;
  sale_value: number;
  status: string;
  product: {
    id: string;
    name: string;
    category: string;
  };
}

export const useClientSalesHistory = (clientId: string | undefined) => {
  const { activeTenant } = useAuth();

  return useQuery({
    queryKey: ['client-sales-history', clientId, activeTenant?.tenant_id],
    queryFn: async (): Promise<ClientSale[]> => {
      if (!clientId || !activeTenant?.tenant_id) {
        return [];
      }

      const { data, error } = await supabase
        .from('sales')
        .select(`
          id,
          sale_date,
          sale_value,
          status,
          consortium_products!inner (
            id,
            name,
            category
          )
        `)
        .eq('client_id', clientId)
        .eq('tenant_id', activeTenant.tenant_id)
        .order('sale_date', { ascending: false });

      if (error) {
        console.error('Erro ao buscar histórico de vendas:', error);
        throw error;
      }

      return data?.map(sale => ({
        id: sale.id,
        sale_date: sale.sale_date,
        sale_value: sale.sale_value,
        status: sale.status || 'pending',
        product: {
          id: sale.consortium_products.id,
          name: sale.consortium_products.name,
          category: sale.consortium_products.category,
        },
      })) || [];
    },
    enabled: !!clientId && !!activeTenant?.tenant_id,
  });
};

// Hook para sugerir produtos complementares baseado no histórico
export const useProductSuggestions = (clientId: string | undefined) => {
  const { data: salesHistory } = useClientSalesHistory(clientId);
  const { activeTenant } = useAuth();

  return useQuery({
    queryKey: ['product-suggestions', clientId, activeTenant?.tenant_id],
    queryFn: async () => {
      if (!salesHistory || salesHistory.length === 0 || !activeTenant?.tenant_id) {
        return [];
      }

      // Categorias já adquiridas pelo cliente
      const ownedCategories = [...new Set(salesHistory.map(sale => sale.product.category))];

      // Buscar produtos de categorias diferentes
      const { data: allProducts, error } = await supabase
        .from('consortium_products')
        .select('id, name, category, min_credit_value, max_credit_value')
        .eq('tenant_id', activeTenant.tenant_id)
        .not('category', 'in', `(${ownedCategories.map(cat => `"${cat}"`).join(',')})`);

      if (error) {
        console.error('Erro ao buscar sugestões de produtos:', error);
        return [];
      }

      return allProducts || [];
    },
    enabled: !!salesHistory && salesHistory.length > 0 && !!activeTenant?.tenant_id,
  });
};