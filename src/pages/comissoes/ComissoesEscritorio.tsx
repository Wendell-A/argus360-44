import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useOfficeCommissions, OfficeCommissionFilters } from '@/hooks/commissions/useOfficeCommissions';
import { useApproveCommission, usePayCommission } from '@/hooks/useCommissions';
import { OfficeCommissionFiltersComponent } from '@/components/commissions/office/OfficeCommissionFilters';
import { OfficeCommissionMetrics } from '@/components/commissions/office/OfficeCommissionMetrics';
import { OfficeCommissionTable } from '@/components/commissions/office/OfficeCommissionTable';
import { CommissionExportButton } from '@/components/commissions/shared/CommissionExportButton';
import { PaymentConfigModal } from '@/components/PaymentConfigModal';

export default function ComissoesEscritorio() {
  const [activeTab, setActiveTab] = useState('overview');
  const [filters, setFilters] = useState<OfficeCommissionFilters>({});
  const [selectedCommission, setSelectedCommission] = useState<any>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const { commissions = [], isLoading, refetch, metrics } = useOfficeCommissions(filters);
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
        <h1 className="text-3xl font-bold">Comissões de Escritório</h1>
        <p className="text-muted-foreground">
          Gerencie as comissões recebidas pelos escritórios
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Resumo</TabsTrigger>
          <TabsTrigger value="pending">
            Pendentes ({pendingCommissions.length})
          </TabsTrigger>
          <TabsTrigger value="approved">
            A Receber ({approvedCommissions.length})
          </TabsTrigger>
          <TabsTrigger value="paid">
            Recebidas ({paidCommissions.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <OfficeCommissionMetrics
            totalToReceive={metrics.totalToReceive}
            totalReceived={metrics.totalReceived}
            avgTicket={metrics.avgTicket}
            activeOffices={metrics.activeOffices}
          />

          <Card>
            <CardHeader>
              <CardTitle>Todas as Comissões</CardTitle>
              <CardDescription>Visualize e filtre todas as comissões de escritório</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <OfficeCommissionFiltersComponent
                filters={filters}
                onChange={setFilters}
                isLoading={isLoading}
              />
              <OfficeCommissionTable
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
                filename="comissoes-escritorio-pendentes"
                type="office"
              />
            </CardHeader>
            <CardContent className="space-y-4">
              <OfficeCommissionFiltersComponent
                filters={filters}
                onChange={setFilters}
                isLoading={isLoading}
              />
              <OfficeCommissionTable
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
                <CardTitle>Comissões A Receber</CardTitle>
                <CardDescription>Comissões aprovadas aguardando recebimento</CardDescription>
              </div>
              <CommissionExportButton
                data={approvedCommissions as any}
                filename="comissoes-escritorio-a-receber"
                type="office"
              />
            </CardHeader>
            <CardContent className="space-y-4">
              <OfficeCommissionFiltersComponent
                filters={filters}
                onChange={setFilters}
                isLoading={isLoading}
              />
              <OfficeCommissionTable
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
                <CardTitle>Comissões Recebidas</CardTitle>
                <CardDescription>Histórico de comissões já recebidas</CardDescription>
              </div>
              <CommissionExportButton
                data={paidCommissions as any}
                filename="comissoes-escritorio-recebidas"
                type="office"
              />
            </CardHeader>
            <CardContent className="space-y-4">
              <OfficeCommissionFiltersComponent
                filters={filters}
                onChange={setFilters}
                isLoading={isLoading}
              />
              <OfficeCommissionTable
                commissions={paidCommissions}
                isLoading={false}
              />
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
