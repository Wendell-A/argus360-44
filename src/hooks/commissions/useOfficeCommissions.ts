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

  const metrics = useMemo(() => {
    if (!commissions || commissions.length === 0) {
      return {
        totalToReceive: 0,
        totalReceived: 0,
        avgTicket: 0,
        byOffice: [],
        byProduct: [],
        activeOffices: 0,
      };
    }

    const totalToReceive = commissions
      .filter(c => c.status === 'approved')
      .reduce((sum, c) => sum + (c.commission_amount || 0), 0);

    const totalReceived = commissions
      .filter(c => c.status === 'paid')
      .reduce((sum, c) => sum + (c.commission_amount || 0), 0);

    const avgTicket = commissions.length > 0
      ? commissions.reduce((sum, c) => sum + (c.commission_amount || 0), 0) / commissions.length
      : 0;

    // Agrupar por escritório
    const officeMap = new Map();
    commissions.forEach(c => {
      const officeId = (c as any).office_id || 'unknown';
      const officeName = (c as any).office_name || 'Escritório Desconhecido';
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
    commissions.forEach(c => {
      const productId = (c as any).product_id || 'unknown';
      const productName = (c as any).product_name || 'Produto Desconhecido';
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
  }, [commissions]);

  return {
    commissions,
    isLoading,
    refetch,
    metrics
  };
}
