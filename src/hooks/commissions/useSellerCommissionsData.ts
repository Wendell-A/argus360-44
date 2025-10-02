import { useMemo } from 'react';
import { useCommissions } from '@/hooks/useCommissions';

export interface SellerCommissionFilters {
  seller_id?: string;
  office_id?: string;
  product_id?: string;
  month?: string;
  year?: string;
  min_value?: number;
  max_value?: number;
  payment_method?: string;
  status?: string;
}

export function useSellerCommissionsData(filters?: SellerCommissionFilters) {
  const { commissions, isLoading, refetch } = useCommissions({
    ...filters,
    commission_type: 'seller', // Sempre filtrado para seller
  } as any);

  // Mapear dados para o formato esperado pelas tabelas
  const mappedCommissions = useMemo(() => {
    return commissions.map((c: any) => ({
      ...c,
      client_name: c.sales?.clients?.name || 'Cliente Desconhecido',
      seller_name: c.recipient_profile?.full_name || c.seller_profile?.full_name || 'Vendedor Desconhecido',
      office_name: c.sales?.offices?.name || 'Escritório Desconhecido',
      product_name: c.sales?.consortium_products?.name || 'Produto Desconhecido',
      office_id: c.sales?.office_id,
      product_id: c.sales?.product_id,
      sale_id: c.sale_id || c.sales?.id,
    }));
  }, [commissions]);

  const metrics = useMemo(() => {
    if (!mappedCommissions || mappedCommissions.length === 0) {
      return {
        totalToPay: 0,
        totalPaid: 0,
        avgPerSeller: 0,
        topSellers: [],
        bySeller: [],
        byProduct: [],
        activeSellers: 0,
      };
    }

    const totalToPay = mappedCommissions
      .filter(c => c.status === 'approved')
      .reduce((sum, c) => sum + (c.commission_amount || 0), 0);

    const totalPaid = mappedCommissions
      .filter(c => c.status === 'paid')
      .reduce((sum, c) => sum + (c.commission_amount || 0), 0);

    // Agrupar por vendedor
    const sellerMap = new Map();
    mappedCommissions.forEach(c => {
      const sellerId = c.recipient_id || 'unknown';
      const sellerName = c.seller_name || 'Vendedor Desconhecido';
      if (!sellerMap.has(sellerId)) {
        sellerMap.set(sellerId, {
          id: sellerId,
          name: sellerName,
          total: 0,
          count: 0
        });
      }
      const seller = sellerMap.get(sellerId);
      seller.total += c.commission_amount || 0;
      seller.count += 1;
    });

    const avgPerSeller = sellerMap.size > 0
      ? Array.from(sellerMap.values()).reduce((sum, s) => sum + s.total, 0) / sellerMap.size
      : 0;

    // Top 5 vendedores
    const topSellers = Array.from(sellerMap.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    // Agrupar por produto
    const productMap = new Map();
    mappedCommissions.forEach(c => {
      const productId = c.product_id || 'unknown';
      const productName = c.product_name || 'Produto Desconhecido';
      if (!productMap.has(productId)) {
        productMap.set(productId, {
          id: productId,
          name: productName,
          total: 0,
          count: 0
        });
      }
      const product = productMap.get(productId);
      product.total += c.commission_amount || 0;
      product.count += 1;
    });

    return {
      totalToPay,
      totalPaid,
      avgPerSeller,
      topSellers,
      bySeller: Array.from(sellerMap.values()),
      byProduct: Array.from(productMap.values()),
      activeSellers: sellerMap.size,
    };
  }, [mappedCommissions]);

  return {
    commissions: mappedCommissions,
    isLoading,
    refetch,
    metrics
  };
}
