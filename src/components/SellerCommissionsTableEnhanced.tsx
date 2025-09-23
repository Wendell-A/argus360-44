import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Trash2, Users, TrendingUp, Search, Filter, AlertTriangle, Eye, BarChart3 } from 'lucide-react';
import { CommissionDashboardEnhanced } from './CommissionDashboardEnhanced';
import { useSellerCommissionsEnhanced, useUpdateSellerCommissionEnhanced, useCommissionDashboardMetrics } from '@/hooks/useSellerCommissionsEnhanced';
import { useDeleteSellerCommission } from '@/hooks/useSellerCommissions';
import { useVendedores } from '@/hooks/useVendedores';
import { useConsortiumProducts } from '@/hooks/useConsortiumProducts';
import { SellerCommissionModalEnhanced } from './SellerCommissionModalEnhanced';
import { ConfirmDialog } from './ConfirmDialog';
import { formatCurrency } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface CommissionFilters {
  search?: string;
  seller_id?: string;
  product_id?: string;
  is_active?: boolean;
  commission_rate_min?: number;
  commission_rate_max?: number;
}

export const SellerCommissionsTableEnhanced: React.FC = () => {
  const [filters, setFilters] = useState<CommissionFilters>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCommission, setSelectedCommission] = useState<any>(null);
  const [confirmDelete, setConfirmDelete] = useState<{
    isOpen: boolean;
    commission: any;
  }>({ isOpen: false, commission: null });
  const [showFilters, setShowFilters] = useState(false);

  const { data: commissions, isLoading, refetch } = useSellerCommissionsEnhanced(filters);
  const { data: dashboardMetrics, isLoading: metricsLoading } = useCommissionDashboardMetrics();
  const { vendedores } = useVendedores();
  const { products } = useConsortiumProducts();
  const updateMutation = useUpdateSellerCommissionEnhanced();
  const deleteMutation = useDeleteSellerCommission();

  const handleCreateCommission = () => {
    setSelectedCommission(null);
    setModalOpen(true);
  };

  const handleEditCommission = (commission: any) => {
    setSelectedCommission(commission);
    setModalOpen(true);
  };

  const handleDeleteCommission = (commission: any) => {
    setConfirmDelete({ isOpen: true, commission });
  };

  const handleToggleActive = async (commission: any) => {
    try {
      await updateMutation.mutateAsync({
        id: commission.id,
        data: { is_active: !commission.is_active }
      });
      refetch();
    } catch (error) {
      console.error('Error toggling commission status:', error);
    }
  };

  const confirmDeleteCommission = async () => {
    if (confirmDelete.commission) {
      try {
        await deleteMutation.mutateAsync(confirmDelete.commission.id);
        setConfirmDelete({ isOpen: false, commission: null });
        refetch();
      } catch (error) {
        console.error('Error deleting commission:', error);
      }
    }
  };

  const handleModalSave = () => {
    refetch();
  };

  const clearFilters = () => {
    setFilters({});
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Carregando configurações de comissões...</div>
        </CardContent>
      </Card>
    );
  }

  const activeCommissions = commissions?.filter(c => c.is_active) || [];
  const totalCommissions = commissions?.length || 0;
  const avgCommissionRate = activeCommissions.length > 0
    ? activeCommissions.reduce((sum, c) => sum + c.commission_rate, 0) / activeCommissions.length
    : 0;
  const commissionsWithConflicts = commissions?.filter(c => c.conflicts && c.conflicts.length > 0) || [];
  const totalPotentialImpact = commissions?.reduce((sum, c) => sum + (c.potential_impact || 0), 0) || 0;

  const hasActiveFilters = Object.values(filters).some(value => 
    value !== undefined && value !== '' && value !== null
  );

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Dashboard Enhanced */}
        {dashboardMetrics && (
          <CommissionDashboardEnhanced 
            metrics={dashboardMetrics}
            onRefresh={refetch}
            onCreateNew={handleCreateCommission}
            isLoading={isLoading || metricsLoading}
          />
        )}

        {/* Cards de Resumo Aprimorados */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Total de Configurações</p>
                  <p className="text-lg font-bold">{totalCommissions}</p>
                  <p className="text-xs text-muted-foreground">
                    {activeCommissions.length} ativas
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Taxa Média</p>
                  <p className="text-lg font-bold">{avgCommissionRate.toFixed(2)}%</p>
                  <p className="text-xs text-muted-foreground">
                    configurações ativas
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-purple-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Impacto Potencial</p>
                  <p className="text-lg font-bold">{formatCurrency(totalPotentialImpact)}</p>
                  <p className="text-xs text-muted-foreground">
                    estimativa mensal
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className={`h-4 w-4 ${commissionsWithConflicts.length > 0 ? 'text-red-600' : 'text-green-600'}`} />
                <div>
                  <p className="text-sm text-muted-foreground">Conflitos</p>
                  <p className="text-lg font-bold">{commissionsWithConflicts.length}</p>
                  <p className="text-xs text-muted-foreground">
                    {commissionsWithConflicts.length > 0 ? 'requer atenção' : 'tudo ok'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros e Busca Avançados */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Comissões de Vendedores
                {hasActiveFilters && (
                  <Badge variant="secondary" className="ml-2">
                    {commissions?.length || 0} resultado(s)
                  </Badge>
                )}
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filtros
                </Button>
                <Button onClick={handleCreateCommission}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Comissão
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Busca rápida sempre visível */}
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por vendedor, produto, email..."
                  value={filters.search || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-10"
                />
              </div>
              {hasActiveFilters && (
                <Button variant="outline" onClick={clearFilters}>
                  Limpar Filtros
                </Button>
              )}
            </div>

            {/* Filtros avançados expansíveis */}
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
                <Select
                  value={filters.seller_id || ''}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, seller_id: value || undefined }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Filtrar por vendedor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos os vendedores</SelectItem>
                    {vendedores?.map((vendedor) => (
                      <SelectItem key={vendedor.id} value={vendedor.id}>
                        {vendedor.full_name || vendedor.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={filters.product_id || ''}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, product_id: value || undefined }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Filtrar por produto" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos os produtos</SelectItem>
                    {products?.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={filters.is_active !== undefined ? filters.is_active.toString() : ''}
                  onValueChange={(value) => setFilters(prev => ({ 
                    ...prev, 
                    is_active: value === '' ? undefined : value === 'true'
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Filtrar por status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos os status</SelectItem>
                    <SelectItem value="true">Apenas ativas</SelectItem>
                    <SelectItem value="false">Apenas inativas</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Taxa mín %"
                    value={filters.commission_rate_min || ''}
                    onChange={(e) => setFilters(prev => ({ 
                      ...prev, 
                      commission_rate_min: e.target.value ? parseFloat(e.target.value) : undefined
                    }))}
                  />
                  <Input
                    type="number"
                    placeholder="Taxa máx %"
                    value={filters.commission_rate_max || ''}
                    onChange={(e) => setFilters(prev => ({ 
                      ...prev, 
                      commission_rate_max: e.target.value ? parseFloat(e.target.value) : undefined
                    }))}
                  />
                </div>
              </div>
            )}

            {/* Tabela de Comissões */}
            {commissions && commissions.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vendedor</TableHead>
                      <TableHead>Produto</TableHead>
                      <TableHead>Taxa</TableHead>
                      <TableHead>Faixa de Venda</TableHead>
                      <TableHead>Impacto Est.</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Criado em</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {commissions.map((commission) => (
                      <TableRow key={commission.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{commission.seller_name}</p>
                            <p className="text-sm text-muted-foreground">
                              {commission.seller_email}
                            </p>
                            {commission.office_name && (
                              <p className="text-xs text-muted-foreground">
                                {commission.office_name}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{commission.product_name}</p>
                            <Badge variant="outline" className="text-xs mt-1">
                              {commission.product_category}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold text-green-600">
                            {commission.commission_rate.toFixed(2)}%
                          </span>
                        </TableCell>
                        <TableCell>
                          {commission.min_sale_value || commission.max_sale_value ? (
                            <div className="text-sm">
                              {commission.min_sale_value && (
                                <div>Mín: {formatCurrency(commission.min_sale_value)}</div>
                              )}
                              {commission.max_sale_value && (
                                <div>Máx: {formatCurrency(commission.max_sale_value)}</div>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">Sem limite</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Tooltip>
                            <TooltipTrigger>
                              <div className="text-sm">
                                <p className="font-medium">
                                  {formatCurrency(commission.potential_impact || 0)}
                                </p>
                                <p className="text-xs text-muted-foreground">mensal</p>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Estimativa baseada no histórico de vendas</p>
                            </TooltipContent>
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <Badge variant={commission.is_active ? 'default' : 'secondary'}>
                              {commission.is_active ? 'Ativa' : 'Inativa'}
                            </Badge>
                            {commission.conflicts && commission.conflicts.length > 0 && (
                              <Tooltip>
                                <TooltipTrigger>
                                  <Badge variant="destructive" className="text-xs">
                                    <AlertTriangle className="h-3 w-3 mr-1" />
                                    {commission.conflicts.length} conflito(s)
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <div className="space-y-1">
                                    {commission.conflicts.map((conflict: string, index: number) => (
                                      <p key={index} className="text-xs">• {conflict}</p>
                                    ))}
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {new Date(commission.created_at).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleToggleActive(commission)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                {commission.is_active ? 'Desativar' : 'Ativar'}
                              </TooltipContent>
                            </Tooltip>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditCommission(commission)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteCommission(commission)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12">
                <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {hasActiveFilters 
                    ? 'Nenhuma comissão encontrada'
                    : 'Nenhuma comissão de vendedor cadastrada'
                  }
                </h3>
                <p className="text-gray-600 mb-4">
                  {hasActiveFilters
                    ? 'Tente ajustar seus filtros ou limpar a busca.'
                    : 'Comece criando configurações de comissão personalizadas para seus vendedores.'
                  }
                </p>
                {!hasActiveFilters && (
                  <Button onClick={handleCreateCommission}>
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Primeira Comissão
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modals */}
        <SellerCommissionModalEnhanced
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          commission={selectedCommission}
          onSave={handleModalSave}
        />

        <ConfirmDialog
          isOpen={confirmDelete.isOpen}
          onClose={() => setConfirmDelete({ isOpen: false, commission: null })}
          onConfirm={confirmDeleteCommission}
          title="Excluir Comissão de Vendedor"
          description={`Tem certeza que deseja excluir a configuração de comissão para ${confirmDelete.commission?.seller_name}?`}
          confirmText="Excluir"
          isLoading={deleteMutation.isPending}
        />
      </div>
    </TooltipProvider>
  );
};