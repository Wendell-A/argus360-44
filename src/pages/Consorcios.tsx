
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, DollarSign, Users, TrendingUp } from "lucide-react";
import { useConsortiumProducts } from "@/hooks/useConsortiumProducts";
import ProductModal from "@/components/ProductModal";
import ConsortiumCard from "@/components/ConsortiumCard";
import { useAuth } from "@/contexts/AuthContext";

export default function Consorcios() {
  const { activeTenant } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  
  const { 
    products, 
    isLoading, 
    createProduct, 
    updateProduct, 
    deleteProduct,
    isCreating,
    isUpdating,
    isDeleting
  } = useConsortiumProducts();

  console.log("Consorcios page - activeTenant:", activeTenant);
  console.log("Consorcios page - products:", products);
  console.log("Consorcios page - isLoading:", isLoading);

  const handleCreateProduct = () => {
    setSelectedProduct(null);
    setModalOpen(true);
  };

  const handleEditProduct = (product: any) => {
    setSelectedProduct(product);
    setModalOpen(true);
  };

  const handleSaveProduct = (productData: any) => {
    if (selectedProduct) {
      updateProduct({ id: selectedProduct.id, updates: productData });
    } else {
      createProduct(productData);
    }
    setModalOpen(false);
  };

  const handleDeleteProduct = (id: string) => {
    if (confirm("Tem certeza que deseja deletar este produto?")) {
      deleteProduct(id);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div>Carregando produtos...</div>
      </div>
    );
  }

  if (!activeTenant) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div>Carregando informações do tenant...</div>
      </div>
    );
  }

  const activeProducts = products.filter(p => p.status === 'active');
  const totalValue = products.reduce((sum, p) => sum + p.asset_value, 0);
  const averageCommission = products.length > 0 
    ? products.reduce((sum, p) => sum + p.commission_rate, 0) / products.length 
    : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4 sm:p-6 lg:p-8 w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 lg:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">Consórcios</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">Gerencie os produtos de consórcio</p>
          </div>
          <Button 
            onClick={handleCreateProduct}
            className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Produto
          </Button>
        </div>

        {/* Cards resumo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 mb-6 lg:mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Produtos</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{products.length}</div>
              <p className="text-xs text-gray-600 mt-1">{activeProducts.length} ativos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalValue)}</div>
              <p className="text-xs text-green-600 mt-1">Em produtos ativos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Comissão Média</CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{averageCommission.toFixed(1)}%</div>
              <p className="text-xs text-purple-600 mt-1">Taxa média</p>
            </CardContent>
          </Card>
        </div>

        {/* Lista de produtos */}
        {products.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">Nenhum produto cadastrado</h3>
                <p className="text-sm mb-4">Comece criando seu primeiro produto de consórcio.</p>
                <Button onClick={handleCreateProduct}>
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Primeiro Produto
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <ConsortiumCard
                key={product.id}
                product={product}
                onEdit={handleEditProduct}
                onDelete={handleDeleteProduct}
              />
            ))}
          </div>
        )}

        {/* Modal */}
        <ProductModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          product={selectedProduct}
          onSave={handleSaveProduct}
          isLoading={isCreating || isUpdating}
        />
      </div>
    </div>
  );
}
