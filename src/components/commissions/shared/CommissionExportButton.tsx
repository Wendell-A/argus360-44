import React from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import * as XLSX from 'xlsx';

interface Commission {
  id: string;
  sale_id: string;
  recipient_id: string;
  commission_amount: number;
  commission_rate: number;
  base_amount: number;
  status: string;
  due_date: string;
  approval_date?: string;
  payment_date?: string;
  payment_method?: string;
  [key: string]: any;
}

interface CommissionExportButtonProps {
  data: Commission[];
  filename: string;
  type: 'office' | 'seller';
}

export const CommissionExportButton: React.FC<CommissionExportButtonProps> = ({
  data,
  filename,
  type
}) => {
  const exportToExcel = () => {
    if (!data || data.length === 0) {
      return;
    }

    const formattedData = data.map((commission) => {
      const baseRow = {
        'Venda': commission.sale_id || '-',
        'Cliente': commission.client_name || '-',
        'Vendedor': commission.seller_name || '-',
        'Escritório': commission.office_name || '-',
        'Valor Base': commission.base_amount || 0,
        'Taxa (%)': commission.commission_rate || 0,
        'Comissão': commission.commission_amount || 0,
        'Vencimento': commission.due_date || '-',
        'Status': commission.status || '-',
      };

      // Adiciona colunas específicas por tipo
      if (type === 'office') {
        return {
          ...baseRow,
          'Data Aprovação': commission.approval_date || '-',
          'Data Recebimento': commission.payment_date || '-',
          'Forma Recebimento': commission.payment_method || '-',
        };
      } else {
        return {
          ...baseRow,
          'Data Aprovação': commission.approval_date || '-',
          'Data Pagamento': commission.payment_date || '-',
          'Forma Pagamento': commission.payment_method || '-',
        };
      }
    });

    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Comissões');

    // Auto ajustar largura das colunas
    const maxWidth = 30;
    const wscols = Object.keys(formattedData[0] || {}).map(() => ({ wch: maxWidth }));
    worksheet['!cols'] = wscols;

    const timestamp = new Date().toISOString().split('T')[0];
    XLSX.writeFile(workbook, `${filename}_${timestamp}.xlsx`);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={exportToExcel}
      disabled={!data || data.length === 0}
    >
      <Download className="h-4 w-4 mr-2" />
      Exportar Excel
    </Button>
  );
};
