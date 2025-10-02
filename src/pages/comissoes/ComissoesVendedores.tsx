import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSellerCommissionsData, SellerCommissionFilters } from '@/hooks/commissions/useSellerCommissionsData';
import { useApproveCommission, usePayCommission } from '@/hooks/useCommissions';
import { SellerCommissionFiltersComponent } from '@/components/commissions/seller/SellerCommissionFilters';
import { SellerCommissionMetrics } from '@/components/commissions/seller/SellerCommissionMetrics';
import { SellerCommissionTable } from '@/components/commissions/seller/SellerCommissionTable';
import { CommissionExportButton } from '@/components/commissions/shared/CommissionExportButton';
import { PaymentConfigModal } from '@/components/PaymentConfigModal';
import { SellerCommissionsTableEnhanced } from '@/components/SellerCommissionsTableEnhanced';

export default function ComissoesVendedores() {
  const [activeTab, setActiveTab] = useState('overview');
  const [filters, setFilters] = useState<SellerCommissionFilters>({});
  const [selectedCommission, setSelectedCommission] = useState<any>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const { commissions = [], isLoading, refetch, metrics } = useSellerCommissionsData(filters);
  const { approveCommissionAsync, isApproving } = useApproveCommission();
  const { payCommissionAsync, isPaying } = usePayCommission();

  const handleApprove = async (commissionId: string) => {
    await approveCommissionAsync(commissionId);
    refetch();
  };

  const handlePaymentClick = (commissionId: string) => {
    const commission = commissions.find(c => c.id === commissionId);
    if (commission) {
      setSelectedCommission(commission);
      setShowPaymentModal(true);
    }
  };

  const handlePaymentConfirm = async (data: any) => {
    if (!selectedCommission) return;

    await payCommissionAsync({
      commissionId: selectedCommission.id,
      paymentMethod: data.paymentMethod,
      paymentReference: data.paymentReference
    });
    
    setShowPaymentModal(false);
    setSelectedCommission(null);
    refetch();
  };

  const filterCommissionsByStatus = (status?: string) => {
    if (!status) return commissions;
    return commissions.filter(c => c.status === status);
  };

  const pendingCommissions = filterCommissionsByStatus('pending');
  const approvedCommissions = filterCommissionsByStatus('approved');
  const paidCommissions = filterCommissionsByStatus('paid');

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Comissões de Vendedores</h1>
        <p className="text-muted-foreground">
          Gerencie as comissões pagas aos vendedores
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Resumo</TabsTrigger>
          <TabsTrigger value="pending">
            Pendentes ({pendingCommissions.length})
          </TabsTrigger>
          <TabsTrigger value="approved">
            A Pagar ({approvedCommissions.length})
          </TabsTrigger>
          <TabsTrigger value="paid">
            Pagas ({paidCommissions.length})
          </TabsTrigger>
          <TabsTrigger value="config">Configurações</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <SellerCommissionMetrics
            totalToPay={metrics.totalToPay}
            totalPaid={metrics.totalPaid}
            avgPerSeller={metrics.avgPerSeller}
            activeSellers={metrics.activeSellers}
          />

          <Card>
            <CardHeader>
              <CardTitle>Todas as Comissões</CardTitle>
              <CardDescription>Visualize e filtre todas as comissões de vendedores</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <SellerCommissionFiltersComponent
                filters={filters}
                onChange={setFilters}
                isLoading={isLoading}
              />
              <SellerCommissionTable
                commissions={commissions}
                onApprove={handleApprove}
                onPay={handlePaymentClick}
                isLoading={isApproving || isPaying}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Comissões Pendentes</CardTitle>
                <CardDescription>Comissões aguardando aprovação</CardDescription>
              </div>
              <CommissionExportButton
                data={pendingCommissions as any}
                filename="comissoes-vendedores-pendentes"
                type="seller"
              />
            </CardHeader>
            <CardContent className="space-y-4">
              <SellerCommissionFiltersComponent
                filters={filters}
                onChange={setFilters}
                isLoading={isLoading}
              />
              <SellerCommissionTable
                commissions={pendingCommissions}
                onApprove={handleApprove}
                isLoading={isApproving}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approved" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Comissões A Pagar</CardTitle>
                <CardDescription>Comissões aprovadas aguardando pagamento</CardDescription>
              </div>
              <CommissionExportButton
                data={approvedCommissions as any}
                filename="comissoes-vendedores-a-pagar"
                type="seller"
              />
            </CardHeader>
            <CardContent className="space-y-4">
              <SellerCommissionFiltersComponent
                filters={filters}
                onChange={setFilters}
                isLoading={isLoading}
              />
              <SellerCommissionTable
                commissions={approvedCommissions}
                onPay={handlePaymentClick}
                isLoading={isPaying}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="paid" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Comissões Pagas</CardTitle>
                <CardDescription>Histórico de comissões já pagas</CardDescription>
              </div>
              <CommissionExportButton
                data={paidCommissions as any}
                filename="comissoes-vendedores-pagas"
                type="seller"
              />
            </CardHeader>
            <CardContent className="space-y-4">
              <SellerCommissionFiltersComponent
                filters={filters}
                onChange={setFilters}
                isLoading={isLoading}
              />
              <SellerCommissionTable
                commissions={paidCommissions}
                isLoading={false}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="config" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Comissões</CardTitle>
              <CardDescription>Configure as taxas de comissão por vendedor e produto</CardDescription>
            </CardHeader>
            <CardContent>
              <SellerCommissionsTableEnhanced />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <PaymentConfigModal
        open={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false);
          setSelectedCommission(null);
        }}
        onConfirm={handlePaymentConfirm}
        commission={selectedCommission}
      />
    </div>
  );
}
