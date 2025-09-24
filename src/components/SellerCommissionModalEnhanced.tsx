import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle, TrendingUp, DollarSign, Info, CheckCircle, XCircle } from 'lucide-react';
import { useVendedores } from '@/hooks/useVendedores';
import { useConsortiumProducts } from '@/hooks/useConsortiumProducts';
import { useCreateSellerCommissionEnhanced, useUpdateSellerCommissionEnhanced, useCommissionValidation, useCommissionImpactSimulator } from '@/hooks/useSellerCommissionsEnhanced';
import { formatCurrency } from '@/lib/utils';

interface SellerCommissionModalEnhancedProps {
  isOpen: boolean;
  onClose: () => void;
  commission?: any;
  onSave?: () => void;
}

export const SellerCommissionModalEnhanced: React.FC<SellerCommissionModalEnhancedProps> = ({
  isOpen,
  onClose,
  commission,
  onSave
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    seller_id: '',
    product_id: '',
    commission_rate: 0,
    min_sale_value: '',
    max_sale_value: '',
    is_active: true,
  });
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [impactData, setImpactData] = useState<any>(null);
  const [isValidating, setIsValidating] = useState(false);

  const { vendedores } = useVendedores();
  const { products } = useConsortiumProducts();
  const createMutation = useCreateSellerCommissionEnhanced();
  const updateMutation = useUpdateSellerCommissionEnhanced();
  const { validateCommission } = useCommissionValidation();
  const { simulateImpact } = useCommissionImpactSimulator();

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
      setCurrentStep(1);
    } else {
      setFormData({
        seller_id: '',
        product_id: '',
        commission_rate: 0,
        min_sale_value: '',
        max_sale_value: '',
        is_active: true,
      });
      setCurrentStep(1);
    }
    setValidationErrors([]);
    setImpactData(null);
  }, [commission, isOpen]);

  // Validação em tempo real
  useEffect(() => {
    const performValidation = async () => {
      if (formData.seller_id && formData.product_id && formData.commission_rate > 0) {
        setIsValidating(true);
        try {
          const errors = await validateCommission(
            {
              seller_id: formData.seller_id,
              product_id: formData.product_id,
              commission_rate: formData.commission_rate,
              min_sale_value: formData.min_sale_value ? parseFloat(formData.min_sale_value) : undefined,
              max_sale_value: formData.max_sale_value ? parseFloat(formData.max_sale_value) : undefined,
              is_active: formData.is_active,
            },
            commission?.id
          );
          setValidationErrors(errors);

          // Simular impacto se não há erros
          if (errors.length === 0) {
            const impact = await simulateImpact(formData.seller_id, formData.product_id, formData.commission_rate);
            setImpactData(impact);
          }
        } catch (error) {
          console.error('Validation error:', error);
        } finally {
          setIsValidating(false);
        }
      } else {
        setValidationErrors([]);
        setImpactData(null);
      }
    };

    const debounceTimer = setTimeout(performValidation, 500);
    return () => clearTimeout(debounceTimer);
  }, [formData, commission?.id, validateCommission, simulateImpact]);

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceedToNext = () => {
    switch (currentStep) {
      case 1:
        return formData.seller_id && formData.product_id;
      case 2:
        return formData.commission_rate > 0 && validationErrors.length === 0;
      default:
        return true;
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    if (validationErrors.length > 0) {
      return;
    }

    const submitData = {
      seller_id: formData.seller_id,
      product_id: formData.product_id,
      commission_rate: formData.commission_rate,
      min_sale_value: formData.min_sale_value ? parseFloat(formData.min_sale_value) : undefined,
      max_sale_value: formData.max_sale_value ? parseFloat(formData.max_sale_value) : undefined,
      is_active: formData.is_active,
      is_default_rate: false, // Sempre false para comissões específicas de vendedor
    };

    try {
      if (commission) {
        await updateMutation.mutateAsync({ id: commission.id, data: submitData });
      } else {
        await createMutation.mutateAsync(submitData);
      }
      
      onSave?.();
      onClose();
    } catch (error) {
      console.error('Error saving seller commission:', error);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;
  const selectedSeller = vendedores?.find(v => v.id === formData.seller_id);
  const selectedProduct = products?.find(p => p.id === formData.product_id);

  const renderStep1 = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="seller_id">Vendedor *</Label>
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
                <div className="flex flex-col">
                  <span className="font-medium">{vendedor.full_name || vendedor.email}</span>
                  <span className="text-xs text-muted-foreground">{vendedor.office?.name || 'Sem escritório'}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedSeller && (
          <div className="mt-2 p-2 bg-muted rounded-md text-sm">
            <p><strong>Email:</strong> {selectedSeller.email}</p>
            <p><strong>Escritório:</strong> {selectedSeller.office?.name || 'Não definido'}</p>
            <p><strong>Vendas:</strong> {selectedSeller.sales_count || 0}</p>
            <p><strong>Comissão Total:</strong> {formatCurrency(selectedSeller.commission_total || 0)}</p>
          </div>
        )}
      </div>

      <div>
        <Label htmlFor="product_id">Produto *</Label>
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
                <div className="flex flex-col">
                  <span className="font-medium">{product.name}</span>
                  <span className="text-xs text-muted-foreground">{product.category}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedProduct && (
          <div className="mt-2 p-2 bg-muted rounded-md text-sm">
            <p><strong>Categoria:</strong> {selectedProduct.category}</p>
            <p><strong>Nome:</strong> {selectedProduct.name}</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="commission_rate">Taxa de Comissão (%) *</Label>
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
          Percentual aplicado sobre a comissão do escritório
        </p>
      </div>

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

      {/* Validação em tempo real */}
      {isValidating && (
        <div className="flex items-center gap-2 text-blue-600">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span className="text-sm">Validando configuração...</span>
        </div>
      )}

      {validationErrors.length > 0 && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
          <div className="flex items-start gap-2">
            <XCircle className="h-4 w-4 text-destructive mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-destructive">Problemas encontrados:</p>
              <ul className="text-sm text-destructive mt-1 space-y-1">
                {validationErrors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {validationErrors.length === 0 && formData.commission_rate > 0 && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-md">
          <div className="flex items-start gap-2">
            <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-green-800">Configuração válida</p>
              <p className="text-sm text-green-700 mt-1">
                Todos os critérios foram atendidos
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Switch
          id="is_active"
          checked={formData.is_active}
          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
        />
        <Label htmlFor="is_active">Ativar comissão imediatamente</Label>
      </div>

      {impactData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Simulação de Impacto
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Impacto Mensal Estimado</p>
                <p className="text-lg font-semibold text-green-600">
                  {formatCurrency(impactData.estimatedMonthlyImpact)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Baseado em</p>
                <p className="text-lg font-semibold">
                  {impactData.basedOnSales} vendas
                </p>
              </div>
            </div>
            
            {impactData.difference !== 0 && (
              <div className="p-2 bg-muted rounded-md">
                <p className="text-sm">
                  <strong>Diferença da configuração atual:</strong> {' '}
                  <span className={impactData.difference > 0 ? 'text-green-600' : 'text-red-600'}>
                    {impactData.difference > 0 ? '+' : ''}{formatCurrency(impactData.difference)}
                  </span>
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Resumo final */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-4 w-4" />
            Resumo da Configuração
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-medium">Vendedor:</p>
              <p className="text-muted-foreground">{selectedSeller?.full_name}</p>
            </div>
            <div>
              <p className="font-medium">Produto:</p>
              <p className="text-muted-foreground">{selectedProduct?.name}</p>
            </div>
            <div>
              <p className="font-medium">Taxa:</p>
              <p className="text-muted-foreground">{formData.commission_rate}%</p>
            </div>
            <div>
              <p className="font-medium">Status:</p>
              <Badge variant={formData.is_active ? 'default' : 'secondary'}>
                {formData.is_active ? 'Ativa' : 'Inativa'}
              </Badge>
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
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {commission ? 'Editar Comissão de Vendedor' : 'Nova Comissão de Vendedor'}
          </DialogTitle>
          <DialogDescription>
            Configure comissões personalizadas para vendedores específicos em produtos selecionados
          </DialogDescription>
        </DialogHeader>

        {/* Progress Indicator */}
        <div className="flex items-center justify-center mb-6">
          <div className="flex items-center space-x-2">
            {[1, 2, 3].map((step) => (
              <React.Fragment key={step}>
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                    step === currentStep
                      ? 'bg-primary text-primary-foreground'
                      : step < currentStep
                      ? 'bg-green-500 text-white'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {step < currentStep ? '✓' : step}
                </div>
                {step < 3 && (
                  <div
                    className={`h-0.5 w-12 ${
                      step < currentStep ? 'bg-green-500' : 'bg-muted'
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Step Titles */}
        <div className="text-center mb-4">
          <h3 className="text-lg font-medium">
            {currentStep === 1 && 'Seleção de Vendedor e Produto'}
            {currentStep === 2 && 'Configuração de Taxa e Validação'}
            {currentStep === 3 && 'Revisão e Confirmação'}
          </h3>
        </div>

        <form onSubmit={handleSubmit}>
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}

          <Separator className="my-4" />

          <div className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={currentStep === 1 ? onClose : handlePrevious}
            >
              {currentStep === 1 ? 'Cancelar' : 'Anterior'}
            </Button>

            <div className="flex gap-2">
              {currentStep < 3 ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  disabled={!canProceedToNext()}
                >
                  Próximo
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={isLoading || validationErrors.length > 0}
                >
                  {isLoading ? 'Salvando...' : commission ? 'Atualizar' : 'Criar Comissão'}
                </Button>
              )}
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};