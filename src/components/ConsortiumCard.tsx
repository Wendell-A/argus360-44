
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Car, Home, Wrench, Eye, Edit, Trash2 } from "lucide-react";
import { ConsortiumProduct, useDeleteConsortiumProduct } from "@/hooks/useConsortiumProducts";
import { toast } from "@/hooks/use-toast";

interface ConsortiumCardProps {
  product: ConsortiumProduct;
  onEdit: (product: ConsortiumProduct) => void;
  onView: (product: ConsortiumProduct) => void;
}

const categoryIcons = {
  "Veículos": Car,
  "Imóveis": Home,
  "Serviços": Wrench,
  "Máquinas": Wrench,
  "Equipamentos": Wrench,
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

const formatPercentage = (value: number) => {
  return `${value}%`;
};

export function ConsortiumCard({ product, onEdit, onView }: ConsortiumCardProps) {
  const IconComponent = categoryIcons[product.category as keyof typeof categoryIcons] || Car;
  
  // Simulando cotas para manter a UI atual - depois podemos adicionar essa funcionalidade
  const totalCotas = 100;
  const cotasVendidas = Math.floor(Math.random() * totalCotas);
  const percentualVendido = Math.floor((cotasVendidas / totalCotas) * 100);

  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
        <IconComponent className="w-4 h-4 text-blue-600" />
      </div>
      <div>
        <p className="font-medium">{product.category}</p>
        <p className="text-sm text-gray-600">{product.name}</p>
      </div>
    </div>
  );
}

export function ConsortiumTableRow({ product, onEdit, onView }: ConsortiumCardProps) {
  const IconComponent = categoryIcons[product.category as keyof typeof categoryIcons] || Car;
  const deleteMutation = useDeleteConsortiumProduct();
  
  // Simulando cotas para manter a UI atual
  const totalCotas = 100 + Math.floor(Math.random() * 100);
  const cotasVendidas = Math.floor(Math.random() * totalCotas);
  const percentualVendido = Math.floor((cotasVendidas / totalCotas) * 100);

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(product.id);
      toast({
        title: "Produto excluído",
        description: "O produto foi excluído com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao excluir o produto.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <td>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
            <IconComponent className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <p className="font-medium">{product.category}</p>
            <p className="text-sm text-gray-600">{product.name}</p>
          </div>
        </div>
      </td>
      <td>
        <span className="font-medium">{formatCurrency(product.asset_value)}</span>
      </td>
      <td>
        <Badge variant="outline" className="bg-gray-50">
          {product.installments} meses
        </Badge>
      </td>
      <td>
        <span className="text-red-600 font-medium">{formatPercentage(product.administration_fee)}</span>
      </td>
      <td>
        <span className="text-green-600 font-medium">{formatPercentage(product.commission_rate)}</span>
      </td>
      <td>
        <div>
          <p className="font-medium">{cotasVendidas}/{totalCotas}</p>
          <div className="w-20 bg-gray-200 rounded-full h-2 mt-1">
            <div 
              className="bg-blue-600 h-2 rounded-full" 
              style={{ width: `${percentualVendido}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-600 mt-1">{percentualVendido}%</p>
        </div>
      </td>
      <td>
        <Badge 
          variant={product.status === "active" ? "default" : "secondary"}
          className={product.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
        >
          {product.status === "active" ? "Ativo" : "Inativo"}
        </Badge>
      </td>
      <td>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => onView(product)}>
            <Eye className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => onEdit(product)}>
            <Edit className="w-4 h-4" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Trash2 className="w-4 h-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja excluir o produto "{product.name}"? Esta ação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>
                  Excluir
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </td>
    </>
  );
}
