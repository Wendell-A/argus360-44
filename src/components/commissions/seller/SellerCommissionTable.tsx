import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CommissionStatusBadge } from '../shared/CommissionStatusBadge';
import { CommissionActions } from '../shared/CommissionActions';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Commission {
  id: string;
  sale_id: string;
  client_name?: string;
  seller_name?: string;
  office_name?: string;
  product_name?: string;
  base_amount: number;
  commission_rate: number;
  commission_amount: number;
  due_date: string;
  status: string;
  approval_date?: string;
  payment_date?: string;
  payment_method?: string;
}

interface SellerCommissionTableProps {
  commissions: Commission[];
  onApprove?: (commissionId: string) => void;
  onPay?: (commissionId: string) => void;
  isLoading?: boolean;
}

export const SellerCommissionTable: React.FC<SellerCommissionTableProps> = ({
  commissions,
  onApprove,
  onPay,
  isLoading = false
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const totalPages = Math.ceil(commissions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentCommissions = commissions.slice(startIndex, endIndex);

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Venda</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Vendedor</TableHead>
              <TableHead className="text-right">Valor Base</TableHead>
              <TableHead className="text-right">Taxa</TableHead>
              <TableHead className="text-right">Comissão</TableHead>
              <TableHead>Vencimento</TableHead>
              <TableHead>Pagamento</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentCommissions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center text-muted-foreground">
                  Nenhuma comissão encontrada
                </TableCell>
              </TableRow>
            ) : (
              currentCommissions.map((commission) => (
                <TableRow key={commission.id}>
                  <TableCell className="font-mono text-sm">
                    {commission.sale_id}
                    {commission.product_name && (
                      <div className="text-xs text-muted-foreground">{commission.product_name}</div>
                    )}
                  </TableCell>
                  <TableCell>{commission.client_name || '-'}</TableCell>
                  <TableCell>
                    <div className="font-medium">{commission.seller_name || '-'}</div>
                    {commission.office_name && (
                      <div className="text-xs text-muted-foreground">{commission.office_name}</div>
                    )}
                  </TableCell>
                  <TableCell className="text-right">{formatCurrency(commission.base_amount)}</TableCell>
                  <TableCell className="text-right">{commission.commission_rate}%</TableCell>
                  <TableCell className="text-right font-semibold text-primary">
                    {formatCurrency(commission.commission_amount)}
                  </TableCell>
                  <TableCell>{formatDate(commission.due_date)}</TableCell>
                  <TableCell>
                    {commission.payment_date ? (
                      <div>
                        <div className="text-sm">{formatDate(commission.payment_date)}</div>
                        {commission.payment_method && (
                          <div className="text-xs text-muted-foreground">{commission.payment_method.toUpperCase()}</div>
                        )}
                      </div>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    <CommissionStatusBadge status={commission.status as any} type="seller" />
                  </TableCell>
                  <TableCell className="text-right">
                    <CommissionActions
                      commission={commission}
                      type="seller"
                      onApprove={onApprove ? () => onApprove(commission.id) : undefined}
                      onPay={onPay ? () => onPay(commission.id) : undefined}
                      isLoading={isLoading}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Mostrando {startIndex + 1} a {Math.min(endIndex, commissions.length)} de {commissions.length} comissões
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm">
              Página {currentPage} de {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
