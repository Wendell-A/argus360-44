import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useVendedores } from '@/hooks/useVendedores';
import { useConsortiumProducts } from '@/hooks/useConsortiumProducts';
import { useCreateSellerCommission, useUpdateSellerCommission } from '@/hooks/useSellerCommissions';
import { useAuth } from '@/contexts/AuthContext';

interface SellerCommissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  commission?: any;
  onSave?: () => void;
}

export const SellerCommissionModal: React.FC<SellerCommissionModalProps> = ({
  isOpen,
  onClose,
  commission,
  onSave
}) => {
  const { activeTenant } = useAuth();
  const currentTenantId = activeTenant?.tenant_id;

  const [formData, setFormData] = useState({
    seller_id: '',
    product_id: '',
    commission_rate: 0,
    min_sale_value: '',
    max_sale_value: '',
    is_active: true,
  });

  const { vendedores } = useVendedores();
  const { products } = useConsortiumProducts();
  const createMutation = useCreateSellerCommission();
  const updateMutation = useUpdateSellerCommission();

  useEffect(() => {
    if (commission) {
      setFormData({
        seller_id: commission.seller_id || '',
        product_id: commission.product_id || '',
        commission_rate: commission.commission_rate || 0,
        min_sale_value: commission.min_sale_value?.toString() || '',
        max_sale_value: commission.max_sale_value?.toString() || '',
        is_active: commission.is_active ?? true,
      });
    } else {
      setFormData({
        seller_id: '',
        product_id: '',
        commission_rate: 0,
        min_sale_value: '',
        max_sale_value: '',
        is_active: true,
      });
    }
  }, [commission, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentTenantId) {
      console.error('No tenant ID available');
      return;
    }

    const submitData = {
      seller_id: formData.seller_id,
      product_id: formData.product_id,
      commission_rate: formData.commission_rate,
      min_sale_value: formData.min_sale_value ? parseFloat(formData.min_sale_value) : undefined,
      max_sale_value: formData.max_sale_value ? parseFloat(formData.max_sale_value) : undefined,
      is_active: formData.is_active,
    };

    try {
      if (commission) {
        await updateMutation.mutateAsync({ id: commission.id, data: submitData });
      } else {
        await createMutation.mutateAsync({ tenantId: currentTenantId, data: submitData });
      }
      
      onSave?.();
      onClose();
    } catch (error) {
      console.error('Error saving seller commission:', error);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {commission ? 'Editar Comissão de Vendedor' : 'Nova Comissão de Vendedor'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="seller_id">Vendedor</Label>
            <Select
              value={formData.seller_id}
              onValueChange={(value) => setFormData(prev => ({ ...prev, seller_id: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um vendedor" />
              </SelectTrigger>
              <SelectContent>
                {vendedores?.map((vendedor) => (
                  <SelectItem key={vendedor.id} value={vendedor.id}>
                    {vendedor.full_name || vendedor.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="product_id">Produto</Label>
            <Select
              value={formData.product_id}
              onValueChange={(value) => setFormData(prev => ({ ...prev, product_id: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um produto" />
              </SelectTrigger>
              <SelectContent>
                {products?.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name} - {product.category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="commission_rate">Taxa de Comissão (%)</Label>
            <Input
              id="commission_rate"
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={formData.commission_rate}
              onChange={(e) => setFormData(prev => ({ ...prev, commission_rate: parseFloat(e.target.value) || 0 }))}
              placeholder="Ex: 2.5"
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              Percentual aplicado sobre a comissão do escritório
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="min_sale_value">Valor Mín. da Venda (Opcional)</Label>
              <Input
                id="min_sale_value"
                type="number"
                step="0.01"
                min="0"
                value={formData.min_sale_value}
                onChange={(e) => setFormData(prev => ({ ...prev, min_sale_value: e.target.value }))}
                placeholder="0"
              />
            </div>

            <div>
              <Label htmlFor="max_sale_value">Valor Máx. da Venda (Opcional)</Label>
              <Input
                id="max_sale_value"
                type="number"
                step="0.01"
                min="0"
                value={formData.max_sale_value}
                onChange={(e) => setFormData(prev => ({ ...prev, max_sale_value: e.target.value }))}
                placeholder="0"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
            />
            <Label htmlFor="is_active">Comissão ativa</Label>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Salvando...' : commission ? 'Atualizar' : 'Criar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};