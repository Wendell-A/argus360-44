
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Eye, Edit, MoreHorizontal, Percent, Calculator, AlertCircle, Copy } from "lucide-react";
import type { ExtendedConsortiumProduct } from "@/hooks/useConsortiumProducts";

interface ConsortiumCardProps {
  product: ExtendedConsortiumProduct;
  onEdit: (product: ExtendedConsortiumProduct) => void;
  onView: (product: ExtendedConsortiumProduct) => void;
  onDuplicate?: (productId: string) => void;
}

export const ConsortiumCard = ({ product, onEdit, onView, onDuplicate }: ConsortiumCardProps) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'automovel':
        return '🚗';
      case 'imovel':
        return '🏠';
      case 'moto':
        return '🏍️';
      case 'caminhao':
        return '🚛';
      case 'servicos':
        return '🛠️';
      default:
        return '📦';
    }
  };

  const contemplationModes = product.contemplation_modes as string[] || [];
  const contemplationLabels = {
    'sorteio': 'Sorteio',
    'lance_livre': 'Lance Livre',
    'lance_fixo_50': 'Lance Fixo 50%',
    'lance_fixo_25': 'Lance Fixo 25%'
  };

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200 bg-card border-border">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{getCategoryIcon(product.category)}</span>
            <div>
              <CardTitle className="text-lg text-card-foreground">{product.name}</CardTitle>
              <p className="text-sm text-muted-foreground capitalize">{product.category}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={getStatusColor(product.status || 'active')}>
              {product.status === 'active' ? 'Ativo' : 'Inativo'}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-card border-border">
                <DropdownMenuItem onClick={() => onView(product)}>
                  <Eye className="w-4 h-4 mr-2" />
                  Visualizar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit(product)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Editar
                </DropdownMenuItem>
                {onDuplicate && (
                  <DropdownMenuItem onClick={() => onDuplicate(product.id)}>
                    <Copy className="w-4 h-4 mr-2" />
                    Duplicar
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Informações principais */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Prazo</p>
            <p className="font-semibold text-card-foreground">{product.installments} meses</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Taxa ADM</p>
            <p className="font-semibold text-card-foreground">{product.administration_fee}%</p>
          </div>
        </div>

        {/* Faixa de crédito */}
        {(product.min_credit_value || product.max_credit_value) && (
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Faixa de Crédito</p>
            <p className="font-semibold text-card-foreground">
              {product.min_credit_value ? formatCurrency(product.min_credit_value) : 'N/A'} a {' '}
              {product.max_credit_value ? formatCurrency(product.max_credit_value) : 'N/A'}
            </p>
          </div>
        )}

        {/* Comissão */}
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Comissão</p>
          <p className="font-semibold flex items-center gap-1 text-card-foreground">
            <Percent className="w-3 h-3" />
            {product.commission_rate}%
          </p>
        </div>

        {/* Taxas adicionais */}
        <div className="grid grid-cols-3 gap-2">
          {product.advance_fee_rate && product.advance_fee_rate > 0 && (
            <div>
              <p className="text-xs text-muted-foreground">Taxa Antecipada</p>
              <p className="text-sm font-medium text-card-foreground">{product.advance_fee_rate}%</p>
            </div>
          )}
          {product.reserve_fund_rate && product.reserve_fund_rate > 0 && (
            <div>
              <p className="text-xs text-muted-foreground">Fundo Reserva</p>
              <p className="text-sm font-medium text-card-foreground">{product.reserve_fund_rate}%</p>
            </div>
          )}
          {product.embedded_bid_rate && product.embedded_bid_rate > 0 && (
            <div>
              <p className="text-xs text-muted-foreground">Lance Embutido</p>
              <p className="text-sm font-medium text-card-foreground">{product.embedded_bid_rate}%</p>
            </div>
          )}
        </div>

        {/* Modalidades de contemplação */}
        {contemplationModes.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Modalidades</p>
            <div className="flex flex-wrap gap-1">
              {contemplationModes.map((mode) => (
                <Badge key={mode} variant="outline" className="text-xs bg-secondary text-secondary-foreground border-border">
                  {contemplationLabels[mode as keyof typeof contemplationLabels] || mode}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Informações adicionais */}
        <div className="flex justify-between items-center pt-2 border-t border-border">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Reajuste: {product.adjustment_index || 'INCC'}</span>
          </div>
        </div>

        {product.description && (
          <div className="pt-2 border-t border-border">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Descrição</p>
            <p className="text-sm text-card-foreground line-clamp-2">{product.description}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
