
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, XCircle, Clock, DollarSign, TrendingUp, Users, Calendar, Settings } from 'lucide-react';
import { useCommissions, useApproveCommission, usePayCommission } from '@/hooks/useCommissions';
import { formatCurrency } from '@/lib/utils';
import { CommissionScheduleModal } from '@/components/CommissionScheduleModal';
import { CommissionBreakdown } from '@/components/CommissionBreakdown';
import { SellerCommissionsTableEnhanced } from '@/components/SellerCommissionsTableEnhanced';
import { CommissionFilterBar } from '@/components/CommissionFilters';
import { useAdvancedFilters } from '@/hooks/useAdvancedFilters';
import { CommissionFilters } from '@/types/filterTypes';

const Comissoes = () => {
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [selectedCommission, setSelectedCommission] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<string>('overview');
  
  // Estado de filtros por aba
  const [tabFilters, setTabFilters] = useState<Record<string, CommissionFilters>>({
    overview: {},
    pending: {},
    approved: {},
    paid: {},
    'seller-config': {}
  });

  const { commissions, isLoading, refetch } = useCommissions();
  const { approveCommissionAsync } = useApproveCommission();
  const { payCommissionAsync } = usePayCommission();

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center">Carregando comissões...</div>
      </div>
    );
  }

  // Filtros de comissões base
  const pendingCommissions = commissions?.filter(c => c.status === 'pending') || [];
  const approvedCommissions = commissions?.filter(c => c.status === 'approved') || [];
  const paidCommissions = commissions?.filter(c => c.status === 'paid') || [];

  // Métricas
  const totalCommissions = commissions?.length || 0;
  const totalAmount = commissions?.reduce((sum, c) => sum + c.commission_amount, 0) || 0;
  const pendingAmount = pendingCommissions.reduce((sum, c) => sum + c.commission_amount, 0);
  const paidAmount = paidCommissions.reduce((sum, c) => sum + c.commission_amount, 0);

  const handleApprove = async (commissionId: string) => {
    try {
      await approveCommissionAsync(commissionId);
      refetch();
    } catch (error) {
      console.error('Error approving commission:', error);
    }
  };

  const handlePay = async (commissionId: string, paymentMethod: string, paymentReference?: string) => {
    try {
      await payCommissionAsync({ commissionId, paymentMethod, paymentReference });
      refetch();
    } catch (error) {
      console.error('Error paying commission:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: { label: 'Pendente', variant: 'secondary' as const, icon: Clock },
      approved: { label: 'Aprovada', variant: 'default' as const, icon: CheckCircle },
      paid: { label: 'Paga', variant: 'default' as const, icon: CheckCircle },
      cancelled: { label: 'Cancelada', variant: 'destructive' as const, icon: XCircle },
    };
    
    const config = variants[status as keyof typeof variants] || variants.pending;
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  // Função de filtro para comissões
  const filterCommissions = (commissionsList: any[], filters: CommissionFilters) => {
    return commissionsList.filter(commission => {
      // Filtro por vendedor
      if (filters.vendedor && commission.sales?.seller_id !== filters.vendedor) {
        return false;
      }

      // Filtro por escritório
      if (filters.escritorio && commission.sales?.office_id !== filters.escritorio) {
        return false;
      }

      // Filtro por mês
      if (filters.mes) {
        const commissionMonth = new Date(commission.created_at).getMonth() + 1;
        if (commissionMonth.toString() !== filters.mes) return false;
      }

      // Filtro por ano
      if (filters.ano) {
        const commissionYear = new Date(commission.created_at).getFullYear();
        if (commissionYear.toString() !== filters.ano) return false;
      }

      // Filtro por status
      if (filters.status && commission.status !== filters.status) {
        return false;
      }

      return true;
    });
  };

  const updateTabFilters = (tabKey: string, filters: CommissionFilters) => {
    setTabFilters(prev => ({
      ...prev,
      [tabKey]: filters
    }));
  };

  const renderCommissionsTable = (commissionsList: any[], tableType: string) => {
    const currentFilters = tabFilters[tableType] || {};
    const filteredCommissions = filterCommissions(commissionsList, currentFilters);

    return (
      <Card>
        <CardHeader>
          <CardTitle>
            {tableType === 'pending' && 'Comissões Pendentes'}
            {tableType === 'approved' && 'Comissões Aprovadas'}
            {tableType === 'paid' && 'Comissões Pagas'}
          </CardTitle>
          <CardDescription>
            {filteredCommissions.length} comissão{filteredCommissions.length !== 1 ? 'ões' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filtros específicos da aba */}
          <CommissionFilterBar
            filters={currentFilters}
            onFiltersChange={(filters) => updateTabFilters(tableType, filters)}
            tabType={tableType as any}
            isLoading={isLoading}
          />

          {filteredCommissions.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Venda</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Valor Base</TableHead>
                  <TableHead>Taxa</TableHead>
                  <TableHead>Comissão</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCommissions.map((commission) => (
                  <TableRow key={commission.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">#Venda-{commission.sale_id.slice(0, 8)}</p>
                        <p className="text-sm text-muted-foreground">
                          {commission.sales?.clients?.name || 'N/A'}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {commission.sales?.clients?.name || 'N/A'}
                    </TableCell>
                    <TableCell>{formatCurrency(commission.base_amount)}</TableCell>
                    <TableCell>{commission.commission_rate}%</TableCell>
                    <TableCell className="font-semibold">
                      {formatCurrency(commission.commission_amount)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {commission.commission_type === 'office' ? 'Escritório' : 'Vendedor'}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(commission.due_date)}</TableCell>
                    <TableCell>{getStatusBadge(commission.status)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {commission.status === 'pending' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleApprove(commission.id)}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Aprovar
                          </Button>
                        )}
                        {commission.status === 'approved' && (
                          <Button
                            size="sm"
                            onClick={() => handlePay(commission.id, 'pix')}
                          >
                            <DollarSign className="w-4 h-4 mr-1" />
                            Pagar
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              {Object.keys(currentFilters).length > 0 
                ? "Nenhuma comissão encontrada com os filtros aplicados."
                : "Nenhuma comissão encontrada nesta categoria."
              }
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Comissões</h1>
          <p className="text-gray-600">Gerencie comissões de vendas e pagamentos</p>
        </div>
        <Button variant="outline" disabled>
          <Settings className="h-4 w-4 mr-2" />
          Configurações
        </Button>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Comissões</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalAmount)}</div>
            <p className="text-xs text-muted-foreground">{totalCommissions} comissões</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(pendingAmount)}</div>
            <p className="text-xs text-muted-foreground">{pendingCommissions.length} comissões</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aprovadas</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvedCommissions.length}</div>
            <p className="text-xs text-muted-foreground">aguardando pagamento</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pagas</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(paidAmount)}</div>
            <p className="text-xs text-muted-foreground">{paidCommissions.length} comissões</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs de Comissões */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Resumo</TabsTrigger>
          <TabsTrigger value="pending">Pendentes</TabsTrigger>
          <TabsTrigger value="approved">Aprovadas</TabsTrigger>
          <TabsTrigger value="paid">Pagas</TabsTrigger>
          <TabsTrigger value="seller-config">Config. Vendedores</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="space-y-6">
            {/* Filtros do resumo */}
            <CommissionFilterBar
              filters={tabFilters.overview || {}}
              onFiltersChange={(filters) => updateTabFilters('overview', filters)}
              tabType="overview"
              isLoading={isLoading}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Resumo de Comissões</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p>Total: {formatCurrency(totalAmount)}</p>
                    <p>Pendentes: {pendingCommissions.length}</p>
                    <p>Aprovadas: {approvedCommissions.length}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Comissões por Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Pendentes</span>
                      <Badge variant="secondary">{pendingCommissions.length}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Aprovadas</span>
                      <Badge variant="default">{approvedCommissions.length}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Pagas</span>
                      <Badge variant="default">{paidCommissions.length}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="pending">
          {renderCommissionsTable(pendingCommissions, 'pending')}
        </TabsContent>

        <TabsContent value="approved">
          {renderCommissionsTable(approvedCommissions, 'approved')}
        </TabsContent>

        <TabsContent value="paid">
          {renderCommissionsTable(paidCommissions, 'paid')}
        </TabsContent>

        <TabsContent value="seller-config">
          <SellerCommissionsTableEnhanced />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Comissoes;
