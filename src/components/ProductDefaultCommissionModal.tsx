import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Package, Percent, Info, CheckCircle } from 'lucide-react';
import { useConsortiumProducts } from '@/hooks/useConsortiumProducts';
import { useCreateSellerCommissionEnhanced, useUpdateSellerCommissionEnhanced } from '@/hooks/useSellerCommissionsEnhanced';
import { formatCurrency } from '@/lib/utils';

interface ProductDefaultCommissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: () => void;
  selectedProducts?: string[];
}

export const ProductDefaultCommissionModal: React.FC<ProductDefaultCommissionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  selectedProducts = []
}) => {
  const [formData, setFormData] = useState({
    products: selectedProducts,
    commission_rate: 0,
    min_sale_value: '',
    max_sale_value: '',
    is_active: true,
  });
  const [isLoading, setIsLoading] = useState(false);
  
  const { products } = useConsortiumProducts();
  const createMutation = useCreateSellerCommissionEnhanced();

  useEffect(() => {
    if (selectedProducts.length > 0) {
      setFormData(prev => ({ ...prev, products: selectedProducts }));
    }
  }, [selectedProducts]);

  const selectedProductsData = products?.filter(p => formData.products.includes(p.id)) || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Criar comissão padrão para cada produto selecionado
      await Promise.all(
        formData.products.map(productId =>
          createMutation.mutateAsync({
            seller_id: null, // null indica comissão padrão
            product_id: productId,
            commission_rate: formData.commission_rate,
            min_sale_value: formData.min_sale_value ? parseFloat(formData.min_sale_value) : undefined,
            max_sale_value: formData.max_sale_value ? parseFloat(formData.max_sale_value) : undefined,
            is_active: formData.is_active,
            is_default_rate: true,
          })
        )
      );
      
      onSave?.();
      onClose();
      
      // Reset form
      setFormData({
        products: [],
        commission_rate: 0,
        min_sale_value: '',
        max_sale_value: '',
        is_active: true,
      });
    } catch (error) {
      console.error('Error creating default commissions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Configurar Comissões Padrão por Produto
          </DialogTitle>
          <DialogDescription>
            Configure taxas de comissão padrão que serão aplicadas a todos os vendedores para os produtos selecionados
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Seleção de produtos */}
          <div>
            <Label>Produtos Selecionados</Label>
            {formData.products.length === 0 ? (
              <Select
                onValueChange={(value) => setFormData(prev => ({ 
                  ...prev, 
                  products: [...prev.products, value] 
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione produtos" />
                </SelectTrigger>
                <SelectContent>
                  {products?.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{product.name}</span>
                        <span className="text-xs text-muted-foreground">{product.category}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="space-y-2">
                <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto">
                  {selectedProductsData.map((product) => (
                    <div key={product.id} className="flex items-center justify-between p-2 bg-muted rounded-md">
                      <div>
                        <p className="font-medium text-sm">{product.name}</p>
                        <p className="text-xs text-muted-foreground">{product.category}</p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setFormData(prev => ({
                          ...prev,
                          products: prev.products.filter(id => id !== product.id)
                        }))}
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const availableProducts = products?.filter(p => !formData.products.includes(p.id)) || [];
                    if (availableProducts.length > 0) {
                      setFormData(prev => ({ 
                        ...prev, 
                        products: [...prev.products, availableProducts[0].id] 
                      }));
                    }
                  }}
                >
                  + Adicionar Produto
                </Button>
              </div>
            )}
          </div>

          {/* Taxa de comissão */}
          <div>
            <Label htmlFor="commission_rate">Taxa de Comissão Padrão (%) *</Label>
            <Input
              id="commission_rate"
              type="number"
              step="0.01"
              min="0.01"
              max="100"
              value={formData.commission_rate}
              onChange={(e) => setFormData(prev => ({ ...prev, commission_rate: parseFloat(e.target.value) || 0 }))}
              placeholder="Ex: 2.5"
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              Esta taxa será aplicada a todos os vendedores que não possuem configuração específica
            </p>
          </div>

          {/* Limites opcionais */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="min_sale_value">Valor Mín. da Venda</Label>
              <Input
                id="min_sale_value"
                type="number"
                step="0.01"
                min="0"
                value={formData.min_sale_value}
                onChange={(e) => setFormData(prev => ({ ...prev, min_sale_value: e.target.value }))}
                placeholder="Opcional"
              />
            </div>
            <div>
              <Label htmlFor="max_sale_value">Valor Máx. da Venda</Label>
              <Input
                id="max_sale_value"
                type="number"
                step="0.01"
                min="0"
                value={formData.max_sale_value}
                onChange={(e) => setFormData(prev => ({ ...prev, max_sale_value: e.target.value }))}
                placeholder="Opcional"
              />
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
            />
            <Label htmlFor="is_active">Ativar comissões padrão imediatamente</Label>
          </div>

          {/* Resumo */}
          {formData.products.length > 0 && formData.commission_rate > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Info className="h-4 w-4" />
                  Resumo da Configuração
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium">Produtos:</p>
                    <p className="text-muted-foreground">{formData.products.length} produto(s)</p>
                  </div>
                  <div>
                    <p className="font-medium">Taxa Padrão:</p>
                    <p className="text-muted-foreground">{formData.commission_rate}%</p>
                  </div>
                </div>
                
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-blue-800">Como funciona</p>
                      <p className="text-sm text-blue-700 mt-1">
                        Estas comissões padrão serão aplicadas automaticamente para todos os vendedores.
                        Quando uma comissão específica for configurada para um vendedor, a padrão será desativada.
                      </p>
                    </div>
                  </div>
                </div>
                
                {(formData.min_sale_value || formData.max_sale_value) && (
                  <div className="pt-2 border-t">
                    <p className="font-medium text-sm">Faixa de Valores:</p>
                    <p className="text-sm text-muted-foreground">
                      {formData.min_sale_value && `Mín: ${formatCurrency(parseFloat(formData.min_sale_value))}`}
                      {formData.min_sale_value && formData.max_sale_value && ' • '}
                      {formData.max_sale_value && `Máx: ${formatCurrency(parseFloat(formData.max_sale_value))}`}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Separator />

          {/* Botões */}
          <div className="flex justify-between">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={formData.products.length === 0 || formData.commission_rate <= 0 || isLoading}
            >
              {isLoading ? 'Criando...' : `Criar Comissões (${formData.products.length})`}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};