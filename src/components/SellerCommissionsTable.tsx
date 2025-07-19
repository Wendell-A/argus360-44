import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Trash2, Users, TrendingUp } from 'lucide-react';
import { useSellerCommissions, useDeleteSellerCommission } from '@/hooks/useSellerCommissions';
import { useAuth } from '@/contexts/AuthContext';
import { SellerCommissionModal } from './SellerCommissionModal';
import { ConfirmDialog } from './ConfirmDialog';
import { formatCurrency } from '@/lib/utils';

export const SellerCommissionsTable: React.FC = () => {
  const { activeTenant } = useAuth();
  const currentTenantId = activeTenant?.tenant_id;
  
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCommission, setSelectedCommission] = useState<any>(null);
  const [confirmDelete, setConfirmDelete] = useState<{
    isOpen: boolean;
    commission: any;
  }>({ isOpen: false, commission: null });

  const { data: sellerCommissions, isLoading, refetch } = useSellerCommissions(currentTenantId);
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

  const confirmDeleteCommission = async () => {
    if (confirmDelete.commission) {
      try {
        await deleteMutation.mutateAsync(confirmDelete.commission.id);
        setConfirmDelete({ isOpen: false, commission: null });
      } catch (error) {
        console.error('Error deleting commission:', error);
      }
    }
  };

  const handleModalSave = () => {
    refetch();
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Carregando comissões de vendedores...</div>
        </CardContent>
      </Card>
    );
  }

  const activeCommissions = sellerCommissions?.filter(c => c.is_active) || [];
  const totalCommissions = sellerCommissions?.length || 0;

  return (
    <div className="space-y-6">
      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total de Configurações</p>
                <p className="text-lg font-bold">{totalCommissions}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Configurações Ativas</p>
                <p className="text-lg font-bold">{activeCommissions.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Taxa Média</p>
                <p className="text-lg font-bold">
                  {activeCommissions.length > 0
                    ? (activeCommissions.reduce((sum, c) => sum + c.commission_rate, 0) / activeCommissions.length).toFixed(2)
                    : '0.00'}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Comissões */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Comissões de Vendedores
            </CardTitle>
            <Button onClick={handleCreateCommission}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Comissão
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {sellerCommissions && sellerCommissions.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vendedor</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead>Taxa (%)</TableHead>
                  <TableHead>Faixa de Venda</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data Criação</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sellerCommissions.map((commission) => (
                  <TableRow key={commission.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">Vendedor</p>
                        <p className="text-sm text-muted-foreground">
                          ID: {commission.seller_id}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">Produto</p>
                        <Badge variant="outline" className="text-xs">
                          ID: {commission.product_id}
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
                      <Badge variant={commission.is_active ? 'default' : 'secondary'}>
                        {commission.is_active ? 'Ativa' : 'Inativa'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(commission.created_at).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditCommission(commission)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
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
          ) : (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhuma comissão de vendedor cadastrada
              </h3>
              <p className="text-gray-600 mb-4">
                Comece criando configurações de comissão para seus vendedores.
              </p>
              <Button onClick={handleCreateCommission}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeira Comissão
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <SellerCommissionModal
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
        description={`Tem certeza que deseja excluir a configuração de comissão para este vendedor?`}
        confirmText="Excluir"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};