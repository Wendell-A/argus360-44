
import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useConsortiumProducts } from "@/hooks/useConsortiumProducts";
import type { ExtendedConsortiumProduct } from "@/hooks/useConsortiumProducts";

interface ProductSelectorProps {
  category: string;
  onProductSelect: (product: ExtendedConsortiumProduct | null) => void;
  selectedProduct?: ExtendedConsortiumProduct | null;
}

export const ProductSelector = ({ category, onProductSelect, selectedProduct }: ProductSelectorProps) => {
  const { products, isLoading } = useConsortiumProducts();
  const [filteredProducts, setFilteredProducts] = useState<ExtendedConsortiumProduct[]>([]);

  useEffect(() => {
    if (category && category !== 'all') {
      const filtered = products.filter(product => 
        product.category === category && product.status === 'active'
      );
      setFilteredProducts(filtered);
    } else {
      setFilteredProducts(products.filter(product => product.status === 'active'));
    }
  }, [category, products]);

  const handleProductChange = (productId: string) => {
    if (productId === 'custom') {
      onProductSelect(null);
      return;
    }
    
    const product = filteredProducts.find(p => p.id === productId);
    onProductSelect(product || null);
  };

  if (isLoading) {
    return (
      <div>
        <Label>Produto</Label>
        <div className="h-10 bg-gray-100 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div>
      <Label htmlFor="product">Produto</Label>
      <Select 
        value={selectedProduct?.id || 'custom'} 
        onValueChange={handleProductChange}
      >
        <SelectTrigger>
          <SelectValue placeholder="Selecione um produto ou configure manualmente" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="custom">Configuração Manual</SelectItem>
          {filteredProducts.map((product) => (
            <SelectItem key={product.id} value={product.id}>
              {product.name} - {product.installments} meses - {product.administration_fee}%
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
