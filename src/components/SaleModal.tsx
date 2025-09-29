
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useClients } from "@/hooks/useClients";
import { useVendedores } from "@/hooks/useVendedores";
import { useConsortiumProducts } from "@/hooks/useConsortiumProducts";
import { useOffices } from "@/hooks/useOffices";
import { Database } from "@/integrations/supabase/types";

type Sale = Database["public"]["Tables"]["sales"]["Row"];

interface SaleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sale?: Sale | null;
  onSave: (data: any) => void;
  isLoading: boolean;
}

export default function SaleModal({ open, onOpenChange, sale, onSave, isLoading }: SaleModalProps) {
  const [formData, setFormData] = useState({
    client_id: "",
    seller_id: "",
    product_id: "",
    office_id: "",
    sale_value: "",
    installments: "",
    monthly_payment: "",
    commission_rate: "",
    sale_date: "",
    status: "pending",
    notes: "",
    ata: "",
    proposta: "",
    cod_grupo: "",
    cota: "",
  });

  const { clients } = useClients();
  const { vendedores } = useVendedores();
  const { products } = useConsortiumProducts();
  const { offices } = useOffices();

  useEffect(() => {
    if (sale) {
      setFormData({
        client_id: sale.client_id || "",
        seller_id: sale.seller_id || "",
        product_id: sale.product_id || "",
        office_id: sale.office_id || "",
        sale_value: sale.sale_value?.toString() || "",
        installments: sale.installments?.toString() || "",
        monthly_payment: sale.monthly_payment?.toString() || "",
        commission_rate: sale.commission_rate?.toString() || "",
        sale_date: sale.sale_date || "",
        status: sale.status || "pending",
        notes: sale.notes || "",
        ata: sale.ata || "",
        proposta: sale.proposta || "",
        cod_grupo: sale.cod_grupo?.toString() || "",
        cota: sale.cota?.toString() || "",
      });
    } else {
      setFormData({
        client_id: "",
        seller_id: "",
        product_id: "",
        office_id: "",
        sale_value: "",
        installments: "",
        monthly_payment: "",
        commission_rate: "",
        sale_date: new Date().toISOString().split('T')[0],
        status: "pending",
        notes: "",
        ata: "",
        proposta: "",
        cod_grupo: "",
        cota: "",
      });
    }
  }, [sale, open]);

  // Calcular comissão automaticamente quando valor da venda ou taxa mudar
  useEffect(() => {
    if (formData.sale_value && formData.commission_rate) {
      const saleValue = parseFloat(formData.sale_value);
      const rate = parseFloat(formData.commission_rate);
      const commissionAmount = (saleValue * rate) / 100;
      // Atualizar o valor da comissão no formData
    }
  }, [formData.sale_value, formData.commission_rate]);

  // Preencher automaticamente dados do produto selecionado
  useEffect(() => {
    if (formData.product_id) {
      const selectedProduct = products.find(p => p.id === formData.product_id);
      if (selectedProduct) {
        setFormData(prev => ({
          ...prev,
          commission_rate: selectedProduct.commission_rate?.toString() || "",
          installments: selectedProduct.installments?.toString() || "",
        }));
      }
    }
  }, [formData.product_id, products]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const saleValue = parseFloat(formData.sale_value);
    const commissionRate = parseFloat(formData.commission_rate);
    const commissionAmount = (saleValue * commissionRate) / 100;

    const data = {
      client_id: formData.client_id,
      seller_id: formData.seller_id,
      product_id: formData.product_id,
      office_id: formData.office_id,
      sale_value: saleValue,
      down_payment: 0, // Sempre 0 conforme Tarefa 3
      installments: parseInt(formData.installments),
      monthly_payment: parseFloat(formData.monthly_payment),
      commission_rate: commissionRate,
      commission_amount: commissionAmount,
      sale_date: formData.sale_date,
      status: formData.status,
      notes: formData.notes || null,
      ata: formData.ata || null,
      proposta: formData.proposta || null,
      cod_grupo: formData.cod_grupo ? parseInt(formData.cod_grupo) : null,
      cota: formData.cota ? parseInt(formData.cota) : null,
    };

    onSave(data);
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{sale ? "Editar Venda" : "Nova Venda"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="client_id">Cliente *</Label>
              <Select value={formData.client_id} onValueChange={(value) => handleChange("client_id", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name} - {client.document}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="seller_id">Vendedor *</Label>
              <Select value={formData.seller_id} onValueChange={(value) => handleChange("seller_id", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um vendedor" />
                </SelectTrigger>
                <SelectContent>
                  {vendedores.map((vendedor) => (
                    <SelectItem key={vendedor.id} value={vendedor.id}>
                      {vendedor.full_name || vendedor.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="product_id">Produto *</Label>
              <Select value={formData.product_id} onValueChange={(value) => handleChange("product_id", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um produto" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name} - {product.category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="office_id">Escritório *</Label>
              <Select value={formData.office_id} onValueChange={(value) => handleChange("office_id", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um escritório" />
                </SelectTrigger>
                <SelectContent>
                  {offices.map((office) => (
                    <SelectItem key={office.id} value={office.id}>
                      {office.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sale_value">Valor da Venda *</Label>
              <Input
                id="sale_value"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.sale_value}
                onChange={(e) => handleChange("sale_value", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ata">Ata</Label>
              <Input
                id="ata"
                type="text"
                placeholder="Número da ata"
                value={formData.ata}
                onChange={(e) => handleChange("ata", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="proposta">Proposta</Label>
              <Input
                id="proposta"
                type="text"
                placeholder="Número da proposta"
                value={formData.proposta}
                onChange={(e) => handleChange("proposta", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cod_grupo">Cód. Grupo</Label>
              <Input
                id="cod_grupo"
                type="number"
                placeholder="Código do grupo"
                value={formData.cod_grupo}
                onChange={(e) => handleChange("cod_grupo", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cota">Cota</Label>
              <Input
                id="cota"
                type="number"
                placeholder="Número da cota"
                value={formData.cota}
                onChange={(e) => handleChange("cota", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="installments">Parcelas *</Label>
              <Input
                id="installments"
                type="number"
                placeholder="12"
                value={formData.installments}
                onChange={(e) => handleChange("installments", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="monthly_payment">Valor Mensal *</Label>
              <Input
                id="monthly_payment"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.monthly_payment}
                onChange={(e) => handleChange("monthly_payment", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="commission_rate">Taxa de Comissão (%) *</Label>
              <Input
                id="commission_rate"
                type="number"
                step="0.01"
                placeholder="5.00"
                value={formData.commission_rate}
                onChange={(e) => handleChange("commission_rate", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sale_date">Data da Venda *</Label>
              <Input
                id="sale_date"
                type="date"
                value={formData.sale_date}
                onChange={(e) => handleChange("sale_date", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => handleChange("status", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="approved">Aprovada</SelectItem>
                  <SelectItem value="cancelled">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              placeholder="Digite observações sobre a venda..."
              value={formData.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
