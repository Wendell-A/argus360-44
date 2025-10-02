import { useMemo } from 'react';
import { useCommissions } from '@/hooks/useCommissions';

export interface OfficeCommissionFilters {
  office_id?: string;
  seller_id?: string;
  product_id?: string;
  month?: string;
  year?: string;
  min_value?: number;
  max_value?: number;
  status?: string;
}

export function useOfficeCommissions(filters?: OfficeCommissionFilters) {
  const { commissions, isLoading, refetch } = useCommissions({
    ...filters,
    commission_type: 'office', // Sempre filtrado para office
  } as any);

  // Mapear dados para o formato esperado pelas tabelas
  const mappedCommissions = useMemo(() => {
    return commissions.map((c: any) => ({
      ...c,
      client_name: c.sales?.clients?.name || 'Cliente Desconhecido',
      seller_name: c.seller_profile?.full_name || c.recipient_profile?.full_name || 'Vendedor Desconhecido',
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
        totalToReceive: 0,
        totalReceived: 0,
        avgTicket: 0,
        byOffice: [],
        byProduct: [],
        activeOffices: 0,
      };
    }

    const totalToReceive = mappedCommissions
      .filter(c => c.status === 'approved')
      .reduce((sum, c) => sum + (c.commission_amount || 0), 0);

    const totalReceived = mappedCommissions
      .filter(c => c.status === 'paid')
      .reduce((sum, c) => sum + (c.commission_amount || 0), 0);

    const avgTicket = mappedCommissions.length > 0
      ? mappedCommissions.reduce((sum, c) => sum + (c.commission_amount || 0), 0) / mappedCommissions.length
      : 0;

    // Agrupar por escritório
    const officeMap = new Map();
    mappedCommissions.forEach(c => {
      const officeId = c.office_id || 'unknown';
      const officeName = c.office_name || 'Escritório Desconhecido';
      if (!officeMap.has(officeId)) {
        officeMap.set(officeId, {
          id: officeId,
          name: officeName,
          total: 0,
          count: 0
        });
      }
      const office = officeMap.get(officeId);
      office.total += c.commission_amount || 0;
      office.count += 1;
    });

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
      totalToReceive,
      totalReceived,
      avgTicket,
      byOffice: Array.from(officeMap.values()),
      byProduct: Array.from(productMap.values()),
      activeOffices: officeMap.size,
    };
  }, [mappedCommissions]);

  return {
    commissions: mappedCommissions,
    isLoading,
    refetch,
    metrics
  };
}
