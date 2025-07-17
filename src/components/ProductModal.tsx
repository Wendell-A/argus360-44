
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Settings, Calculator, Percent, AlertCircle } from "lucide-react";
import { CommissionScheduleModal } from "./CommissionScheduleModal";
import { ChargebackScheduleModal } from "./ChargebackScheduleModal";
import { CommissionBreakdown } from "./CommissionBreakdown";
import { ChargebackInfo } from "./ChargebackInfo";
import type { ExtendedConsortiumProduct } from "@/hooks/useConsortiumProducts";

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: ExtendedConsortiumProduct | null;
  mode: "create" | "edit";
  onSave?: (data: any) => void;
}

const contemplationModeOptions = [
  { id: "sorteio", label: "Sorteio" },
  { id: "lance_livre", label: "Lance Livre" },
  { id: "lance_fixo_50", label: "Lance Fixo 50%" },
  { id: "lance_fixo_25", label: "Lance Fixo 25%" },
];

export const ProductModal = ({ isOpen, onClose, product, mode, onSave }: ProductModalProps) => {
  const [commissionModalOpen, setCommissionModalOpen] = useState(false);
  const [chargebackModalOpen, setChargebackModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    min_credit_value: "",
    max_credit_value: "",
    installments: "",
    administration_fee: "",
    min_admin_fee: "",
    max_admin_fee: "",
    advance_fee_rate: "",
    reserve_fund_rate: "",
    embedded_bid_rate: "",
    commission_rate: "",
    adjustment_index: "INCC",
    contemplation_modes: [] as string[],
    status: "active",
  });

  useEffect(() => {
    if (product && mode === "edit") {
      setFormData({
        name: product.name || "",
        description: product.description || "",
        category: product.category || "",
        min_credit_value: product.min_credit_value?.toString() || "",
        max_credit_value: product.max_credit_value?.toString() || "",
        installments: product.installments?.toString() || "",
        administration_fee: product.administration_fee?.toString() || "",
        min_admin_fee: product.min_admin_fee?.toString() || "",
        max_admin_fee: product.max_admin_fee?.toString() || "",
        advance_fee_rate: product.advance_fee_rate?.toString() || "",
        reserve_fund_rate: product.reserve_fund_rate?.toString() || "",
        embedded_bid_rate: product.embedded_bid_rate?.toString() || "",
        commission_rate: product.commission_rate?.toString() || "",
        adjustment_index: product.adjustment_index || "INCC",
        contemplation_modes: (product.contemplation_modes as string[]) || [],
        status: product.status || "active",
      });
    } else {
      setFormData({
        name: "",
        description: "",
        category: "",
        min_credit_value: "",
        max_credit_value: "",
        installments: "",
        administration_fee: "",
        min_admin_fee: "",
        max_admin_fee: "",
        advance_fee_rate: "",
        reserve_fund_rate: "",
        embedded_bid_rate: "",
        commission_rate: "",
        adjustment_index: "INCC",
        contemplation_modes: [],
        status: "active",
      });
    }
  }, [product, mode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const data = {
      name: formData.name,
      description: formData.description || null,
      category: formData.category,
      min_credit_value: formData.min_credit_value ? parseFloat(formData.min_credit_value) : null,
      max_credit_value: formData.max_credit_value ? parseFloat(formData.max_credit_value) : null,
      installments: parseInt(formData.installments),
      administration_fee: parseFloat(formData.administration_fee),
      min_admin_fee: formData.min_admin_fee ? parseFloat(formData.min_admin_fee) : null,
      max_admin_fee: formData.max_admin_fee ? parseFloat(formData.max_admin_fee) : null,
      advance_fee_rate: formData.advance_fee_rate ? parseFloat(formData.advance_fee_rate) : 0,
      reserve_fund_rate: formData.reserve_fund_rate ? parseFloat(formData.reserve_fund_rate) : 0,
      embedded_bid_rate: formData.embedded_bid_rate ? parseFloat(formData.embedded_bid_rate) : 0,
      commission_rate: parseFloat(formData.commission_rate),
      adjustment_index: formData.adjustment_index,
      contemplation_modes: formData.contemplation_modes,
      status: formData.status,
    };

    if (onSave) {
      onSave(data);
    }
  };

  const handleContemplationModeChange = (modeId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      contemplation_modes: checked 
        ? [...prev.contemplation_modes, modeId]
        : prev.contemplation_modes.filter(id => id !== modeId)
    }));
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {mode === "create" ? "Criar Produto" : "Editar Produto"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic">Básico</TabsTrigger>
                <TabsTrigger value="financial">Financeiro</TabsTrigger>
                <TabsTrigger value="commission">Comissões</TabsTrigger>
                <TabsTrigger value="advanced">Avançado</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="w-5 h-5" />
                      Informações Básicas
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">Nome do Produto *</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="category">Categoria *</Label>
                        <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione uma categoria" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="automovel">Automóvel</SelectItem>
                            <SelectItem value="imovel">Imóvel</SelectItem>
                            <SelectItem value="moto">Moto</SelectItem>
                            <SelectItem value="caminhao">Caminhão</SelectItem>
                            <SelectItem value="servicos">Serviços</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="description">Descrição</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Descrição detalhada do produto..."
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="installments">Prazo (meses) *</Label>
                        <Input
                          id="installments"
                          type="number"
                          value={formData.installments}
                          onChange={(e) => setFormData(prev => ({ ...prev, installments: e.target.value }))}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="status">Status</Label>
                        <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Ativo</SelectItem>
                            <SelectItem value="inactive">Inativo</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="financial" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calculator className="w-5 h-5" />
                      Configurações Financeiras
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="min_credit_value">Faixa de Crédito - Mínimo</Label>
                        <Input
                          id="min_credit_value"
                          type="number"
                          step="0.01"
                          value={formData.min_credit_value}
                          onChange={(e) => setFormData(prev => ({ ...prev, min_credit_value: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="max_credit_value">Faixa de Crédito - Máximo</Label>
                        <Input
                          id="max_credit_value"
                          type="number"
                          step="0.01"
                          value={formData.max_credit_value}
                          onChange={(e) => setFormData(prev => ({ ...prev, max_credit_value: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="advance_fee_rate">Taxa Antecipada (%)</Label>
                        <Input
                          id="advance_fee_rate"
                          type="number"
                          step="0.01"
                          value={formData.advance_fee_rate}
                          onChange={(e) => setFormData(prev => ({ ...prev, advance_fee_rate: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="commission_rate">Taxa de Comissão (%)</Label>
                        <Input
                          id="commission_rate"
                          type="number"
                          step="0.01"
                          value={formData.commission_rate}
                          onChange={(e) => setFormData(prev => ({ ...prev, commission_rate: e.target.value }))}
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="administration_fee">Taxa ADM Base (%)</Label>
                        <Input
                          id="administration_fee"
                          type="number"
                          step="0.01"
                          value={formData.administration_fee}
                          onChange={(e) => setFormData(prev => ({ ...prev, administration_fee: e.target.value }))}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="min_admin_fee">Taxa ADM Mínima (%)</Label>
                        <Input
                          id="min_admin_fee"
                          type="number"
                          step="0.01"
                          value={formData.min_admin_fee}
                          onChange={(e) => setFormData(prev => ({ ...prev, min_admin_fee: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="max_admin_fee">Taxa ADM Máxima (%)</Label>
                        <Input
                          id="max_admin_fee"
                          type="number"
                          step="0.01"
                          value={formData.max_admin_fee}
                          onChange={(e) => setFormData(prev => ({ ...prev, max_admin_fee: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="reserve_fund_rate">Fundo de Reserva (%)</Label>
                        <Input
                          id="reserve_fund_rate"
                          type="number"
                          step="0.01"
                          value={formData.reserve_fund_rate}
                          onChange={(e) => setFormData(prev => ({ ...prev, reserve_fund_rate: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="embedded_bid_rate">Lance Embutido (%)</Label>
                        <Input
                          id="embedded_bid_rate"
                          type="number"
                          step="0.01"
                          value={formData.embedded_bid_rate}
                          onChange={(e) => setFormData(prev => ({ ...prev, embedded_bid_rate: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="adjustment_index">Índice de Reajuste</Label>
                      <Select value={formData.adjustment_index} onValueChange={(value) => setFormData(prev => ({ ...prev, adjustment_index: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="INCC">INCC</SelectItem>
                          <SelectItem value="IPCA">IPCA</SelectItem>
                          <SelectItem value="IGP-M">IGP-M</SelectItem>
                          <SelectItem value="TR">TR</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="commission" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Percent className="w-5 h-5" />
                      Configurações de Comissão
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {mode === "edit" && product && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setCommissionModalOpen(true)}
                            className="w-full"
                          >
                            <Settings className="w-4 h-4 mr-2" />
                            Gerenciar Cronograma de Comissões
                          </Button>
                        </div>
                        <div>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setChargebackModalOpen(true)}
                            className="w-full"
                          >
                            <AlertCircle className="w-4 h-4 mr-2" />
                            Gerenciar Cronograma de Estornos
                          </Button>
                        </div>
                      </div>
                    )}

                    {mode === "edit" && product && formData.max_credit_value && (
                      <div className="grid grid-cols-2 gap-4">
                        <CommissionBreakdown 
                          productId={product.id} 
                          saleValue={parseFloat(formData.max_credit_value)} 
                        />
                        <ChargebackInfo 
                          productId={product.id} 
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="advanced" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Modalidades de Contemplação</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      {contemplationModeOptions.map((mode) => (
                        <div key={mode.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={mode.id}
                            checked={formData.contemplation_modes.includes(mode.id)}
                            onCheckedChange={(checked) => handleContemplationModeChange(mode.id, checked as boolean)}
                          />
                          <Label htmlFor={mode.id}>{mode.label}</Label>
                        </div>
                      ))}
                    </div>

                    {formData.contemplation_modes.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {formData.contemplation_modes.map((modeId) => {
                          const mode = contemplationModeOptions.find(m => m.id === modeId);
                          return mode ? (
                            <Badge key={modeId} variant="secondary">
                              {mode.label}
                            </Badge>
                          ) : null;
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-2 mt-6">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit">
                {mode === "create" ? "Criar Produto" : "Salvar Alterações"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modais auxiliares */}
      {mode === "edit" && product && (
        <>
          <CommissionScheduleModal
            isOpen={commissionModalOpen}
            onClose={() => setCommissionModalOpen(false)}
            productId={product.id}
            productName={product.name}
          />
          
          <ChargebackScheduleModal
            isOpen={chargebackModalOpen}
            onClose={() => setChargebackModalOpen(false)}
            productId={product.id}
            productName={product.name}
          />
        </>
      )}
    </>
  );
};
