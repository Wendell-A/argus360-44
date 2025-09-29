
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, DollarSign, Users, TrendingUp, Search, Filter, Calculator, Percent } from "lucide-react";
import { useConsortiumProducts } from "@/hooks/useConsortiumProducts";
import { ProductModal } from "@/components/ProductModal";
import { ConsortiumCard } from "@/components/ConsortiumCard";
import { useAuth } from "@/contexts/AuthContext";

export default function Consorcios() {
  const { activeTenant } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  
  const { 
    products, 
    isLoading, 
    createProduct, 
    updateProduct, 
    deleteProduct,
    duplicateProduct,
    isCreating,
    isUpdating,
    isDeleting,
    isDuplicating
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

  const handleDuplicateProduct = (id: string) => {
    if (confirm("Deseja duplicar este produto?")) {
      duplicateProduct(id);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Filtros
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || product.category === categoryFilter;
    const matchesStatus = statusFilter === "all" || product.status === statusFilter;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando produtos...</p>
        </div>
      </div>
    );
  }

  if (!activeTenant) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando informações do tenant...</p>
        </div>
      </div>
    );
  }

  const activeProducts = products.filter(p => p.status === 'active');
  const averageCommission = products.length > 0 
    ? products.reduce((sum, p) => sum + p.commission_rate, 0) / products.length 
    : 0;

  // Métricas adicionais
  const totalCreditRange = products.reduce((sum, p) => {
    const max = p.max_credit_value || 0;
    return sum + max;
  }, 0);

  const averageInstallments = products.length > 0
    ? products.reduce((sum, p) => sum + p.installments, 0) / products.length
    : 0;

  const categoryCounts = products.reduce((acc, p) => {
    acc[p.category] = (acc[p.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="min-h-screen bg-background">
      <div className="p-3 sm:p-4 md:p-6 lg:p-8 w-full">
        {/* Header - Mobile Optimized */}
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 mb-6 lg:mb-8">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-foreground">Consórcios</h1>
            <p className="text-xs sm:text-sm md:text-base text-muted-foreground mt-1">Gerencie os produtos de consórcio</p>
          </div>
          <Button 
            onClick={handleCreateProduct}
            className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto min-h-[44px] touch-manipulation"
            size="lg"
          >
            <Plus className="w-4 h-4 mr-2" />
            <span className="text-sm sm:text-base">Novo Produto</span>
          </Button>
        </div>

        {/* Cards resumo - Mobile Responsive */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 lg:mb-8">
          <Card className="min-h-[100px] bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
              <CardTitle className="text-xs sm:text-sm font-medium text-card-foreground">Total de Produtos</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="text-xl sm:text-2xl font-bold text-card-foreground">{products.length}</div>
              <p className="text-xs text-muted-foreground mt-1">{activeProducts.length} ativos</p>
            </CardContent>
          </Card>

          <Card className="min-h-[100px] bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
              <CardTitle className="text-xs sm:text-sm font-medium text-card-foreground">Valor Total Crédito</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="text-lg sm:text-2xl font-bold break-all text-card-foreground">{formatCurrency(totalCreditRange)}</div>
              <p className="text-xs text-green-600 mt-1">Em produtos ativos</p>
            </CardContent>
          </Card>

          <Card className="min-h-[100px] bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
              <CardTitle className="text-xs sm:text-sm font-medium text-card-foreground">Comissão Média</CardTitle>
              <Percent className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="text-xl sm:text-2xl font-bold text-card-foreground">{averageCommission.toFixed(1)}%</div>
              <p className="text-xs text-purple-600 mt-1">Taxa média</p>
            </CardContent>
          </Card>

          <Card className="min-h-[100px] bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
              <CardTitle className="text-xs sm:text-sm font-medium text-card-foreground">Prazo Médio</CardTitle>
              <Calculator className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="text-xl sm:text-2xl font-bold text-card-foreground">{Math.round(averageInstallments)}</div>
              <p className="text-xs text-orange-600 mt-1">Meses</p>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card className="mb-6 bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg text-card-foreground">Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar produtos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-background border-border text-foreground"
                  />
                </div>
              </div>
              <div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="bg-background border-border text-foreground">
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="all">Todas as categorias</SelectItem>
                    <SelectItem value="automovel">Automóvel</SelectItem>
                    <SelectItem value="imovel">Imóvel</SelectItem>
                    <SelectItem value="moto">Moto</SelectItem>
                    <SelectItem value="caminhao">Caminhão</SelectItem>
                    <SelectItem value="servicos">Serviços</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="bg-background border-border text-foreground">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="all">Todos os status</SelectItem>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="inactive">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resumo por categoria */}
        {Object.keys(categoryCounts).length > 0 && (
          <Card className="mb-6 bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg text-card-foreground">Distribuição por Categoria</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {Object.entries(categoryCounts).map(([category, count]) => (
                  <Badge key={category} variant="secondary" className="text-sm bg-secondary text-secondary-foreground">
                    {category}: {count}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Lista de produtos - Mobile Optimized */}
        {filteredProducts.length === 0 ? (
          <Card className="bg-card border-border">
            <CardContent className="p-6 sm:p-8 text-center">
              <div className="text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-base sm:text-lg font-medium mb-2 text-card-foreground">
                  {products.length === 0 ? "Nenhum produto cadastrado" : "Nenhum produto encontrado"}
                </h3>
                <p className="text-sm mb-4 px-4">
                  {products.length === 0 
                    ? "Comece criando seu primeiro produto de consórcio."
                    : "Tente ajustar os filtros ou criar um novo produto."
                  }
                </p>
                <Button onClick={handleCreateProduct} className="min-h-[44px] touch-manipulation">
                  <Plus className="w-4 h-4 mr-2" />
                  {products.length === 0 ? "Criar Primeiro Produto" : "Criar Novo Produto"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            {filteredProducts.map((product) => (
              <ConsortiumCard
                key={product.id}
                product={product}
                onEdit={handleEditProduct}
                onView={handleEditProduct}
                onDuplicate={handleDuplicateProduct}
              />
            ))}
          </div>
        )}

        {/* Modal */}
        <ProductModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          product={selectedProduct}
          mode={selectedProduct ? "edit" : "create"}
          onSave={handleSaveProduct}
        />
      </div>
    </div>
  );
}
