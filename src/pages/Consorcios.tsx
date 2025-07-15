
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConsortiumCard } from "@/components/ConsortiumCard";
import { ProductModal } from "@/components/ProductModal";
import { 
  Plus, 
  Search, 
  Building2, 
  Car, 
  Bike, 
  DollarSign,
  TrendingUp,
  Package
} from "lucide-react";
import { useConsortiumProducts } from "@/hooks/useConsortiumProducts";

export default function Consorcios() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view">("create");
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  const { data: products = [], isLoading } = useConsortiumProducts();

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || product.category === categoryFilter;
    const matchesStatus = statusFilter === "all" || product.status === statusFilter;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const metrics = {
    total: products.length,
    active: products.filter(p => p.status === 'active').length,
    totalValue: products.reduce((sum, p) => sum + p.asset_value, 0),
    avgCommission: products.length > 0 
      ? products.reduce((sum, p) => sum + p.commission_rate, 0) / products.length 
      : 0
  };

  const handleCreate = () => {
    setSelectedProduct(null);
    setModalMode("create");
    setIsModalOpen(true);
  };

  const handleView = (product: any) => {
    setSelectedProduct(product);
    setModalMode("view");
    setIsModalOpen(true);
  };

  const handleEdit = (product: any) => {
    setSelectedProduct(product);
    setModalMode("edit");
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4 sm:p-6 lg:p-8 w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 lg:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">Consórcios</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">Gerencie seus produtos de consórcio</p>
          </div>
          <Button 
            onClick={handleCreate}
            className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Produto
          </Button>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6 lg:mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Produtos</CardTitle>
              <Package className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.total}</div>
              <p className="text-xs text-gray-600 mt-1">Produtos cadastrados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Produtos Ativos</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.active}</div>
              <p className="text-xs text-green-600 mt-1">Disponíveis para venda</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
              <DollarSign className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R$ {(metrics.totalValue / 1000000).toFixed(1)}M
              </div>
              <p className="text-xs text-purple-600 mt-1">Em créditos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Comissão Média</CardTitle>
              <TrendingUp className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.avgCommission.toFixed(1)}%</div>
              <p className="text-xs text-orange-600 mt-1">Taxa média</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6 lg:mb-8">
          <CardContent className="pt-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar produtos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as Categorias</SelectItem>
                    <SelectItem value="vehicles">Veículos</SelectItem>
                    <SelectItem value="real_estate">Imóveis</SelectItem>
                    <SelectItem value="services">Serviços</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Status</SelectItem>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="inactive">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
          {isLoading ? (
            <div className="col-span-full flex justify-center items-center h-32">
              <div className="text-gray-500">Carregando produtos...</div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum produto encontrado</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || categoryFilter !== "all" || statusFilter !== "all"
                  ? "Tente ajustar os filtros de busca"
                  : "Comece criando seu primeiro produto de consórcio"
                }
              </p>
              {!searchTerm && categoryFilter === "all" && statusFilter === "all" && (
                <Button onClick={handleCreate}>
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Primeiro Produto
                </Button>
              )}
            </div>
          ) : (
            filteredProducts.map((product) => (
              <ConsortiumCard
                key={product.id}
                product={product}
                onView={() => handleView(product)}
                onEdit={() => handleEdit(product)}
              />
            ))
          )}
        </div>

        {/* Product Modal */}
        <ProductModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          mode={modalMode}
          product={selectedProduct}
        />
      </div>
    </div>
  );
}
