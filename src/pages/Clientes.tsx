
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Building2, Users, HandCoins, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

const clientes = [
  {
    id: 1,
    nome: "Empresa ABC Ltda",
    cnpj: "12.345.678/0001-90",
    vendedor: "João Silva",
    ultimaCompra: "2024-01-15",
    valorTotal: "R$ 85.000",
    status: "Ativo",
    tipo: "Pessoa Jurídica"
  },
  {
    id: 2,
    nome: "Construtora XYZ",
    cnpj: "98.765.432/0001-10",
    vendedor: "Maria Santos",
    ultimaCompra: "2024-01-10",
    valorTotal: "R$ 120.000",
    status: "Ativo",
    tipo: "Pessoa Jurídica"
  },
  {
    id: 3,
    nome: "Carlos Mendes",
    cnpj: "123.456.789-00",
    vendedor: "Pedro Costa",
    ultimaCompra: "2024-01-08",
    valorTotal: "R$ 45.000",
    status: "Prospect",
    tipo: "Pessoa Física"
  },
  {
    id: 4,
    nome: "Transportes Rápidos",
    cnpj: "11.222.333/0001-44",
    vendedor: "Ana Oliveira",
    ultimaCompra: "2023-12-20",
    valorTotal: "R$ 65.000",
    status: "Inativo",
    tipo: "Pessoa Jurídica"
  },
];

export default function Clientes() {
  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Clientes</h1>
          <p className="text-gray-600 mt-1">Gerencie sua carteira de clientes</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Novo Cliente
        </Button>
      </div>

      {/* Cards resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">247</div>
            <p className="text-xs text-blue-600 mt-1">+12 este mês</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes Ativos</CardTitle>
            <Building2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">189</div>
            <p className="text-xs text-green-600 mt-1">76% do total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prospects</CardTitle>
            <HandCoins className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">35</div>
            <p className="text-xs text-yellow-600 mt-1">Em negociação</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <HandCoins className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ 2.1M</div>
            <p className="text-xs text-purple-600 mt-1">Carteira total</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros e busca */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar por nome, CNPJ/CPF..."
                  className="pl-10"
                />
              </div>
            </div>
            <Button variant="outline">Todos</Button>
            <Button variant="outline">Ativos</Button>
            <Button variant="outline">Prospects</Button>
            <Button variant="outline">Inativos</Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de clientes */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Clientes</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>CNPJ/CPF</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Vendedor</TableHead>
                <TableHead>Última Compra</TableHead>
                <TableHead>Valor Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clientes.map((cliente) => (
                <TableRow key={cliente.id} className="hover:bg-gray-50">
                  <TableCell>
                    <div>
                      <p className="font-medium">{cliente.nome}</p>
                      <p className="text-sm text-gray-600">ID: {cliente.id}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-sm">{cliente.cnpj}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={
                      cliente.tipo === "Pessoa Jurídica" 
                        ? "bg-blue-50 text-blue-700" 
                        : "bg-green-50 text-green-700"
                    }>
                      {cliente.tipo}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{cliente.vendedor}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{cliente.ultimaCompra}</span>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium text-green-600">{cliente.valorTotal}</span>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={cliente.status === "Ativo" ? "default" : cliente.status === "Prospect" ? "secondary" : "outline"}
                      className={
                        cliente.status === "Ativo" 
                          ? "bg-green-100 text-green-800" 
                          : cliente.status === "Prospect"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-gray-100 text-gray-800"
                      }
                    >
                      {cliente.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">Editar</Button>
                      <Button variant="outline" size="sm">Histórico</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
