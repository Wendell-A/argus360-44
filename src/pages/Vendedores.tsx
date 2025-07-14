
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Plus, Mail, Phone, TrendingUp, DollarSign } from "lucide-react";

const vendedores = [
  {
    id: 1,
    nome: "João Silva",
    email: "joao@empresa.com",
    telefone: "(11) 99999-9999",
    vendasMes: 15,
    comissaoMes: "R$ 7.500",
    taxaComissao: "5%",
    status: "Ativo",
    iniciais: "JS"
  },
  {
    id: 2,
    nome: "Maria Santos",
    email: "maria@empresa.com",
    telefone: "(11) 88888-8888",
    vendasMes: 12,
    comissaoMes: "R$ 6.200",
    taxaComissao: "5.2%",
    status: "Ativo",
    iniciais: "MS"
  },
  {
    id: 3,
    nome: "Pedro Costa",
    email: "pedro@empresa.com",
    telefone: "(11) 77777-7777",
    vendasMes: 8,
    comissaoMes: "R$ 4.100",
    taxaComissao: "5%",
    status: "Ativo",
    iniciais: "PC"
  },
  {
    id: 4,
    nome: "Ana Oliveira",
    email: "ana@empresa.com",
    telefone: "(11) 66666-6666",
    vendasMes: 5,
    comissaoMes: "R$ 2.800",
    taxaComissao: "5.5%",
    status: "Inativo",
    iniciais: "AO"
  },
];

export default function Vendedores() {
  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Vendedores</h1>
          <p className="text-gray-600 mt-1">Gerencie sua equipe de vendas</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Novo Vendedor
        </Button>
      </div>

      {/* Cards resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Vendedores</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-gray-600 mt-1">3 ativos este mês</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Comissões Totais</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ 20.600</div>
            <p className="text-xs text-green-600 mt-1">+15% vs mês anterior</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vendas do Mês</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">40</div>
            <p className="text-xs text-purple-600 mt-1">Meta: 50 vendas</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de vendedores */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Vendedores</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vendedor</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Vendas/Mês</TableHead>
                <TableHead>Comissão/Mês</TableHead>
                <TableHead>Taxa</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vendedores.map((vendedor) => (
                <TableRow key={vendedor.id} className="hover:bg-gray-50">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback className="bg-blue-100 text-blue-600">
                          {vendedor.iniciais}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{vendedor.nome}</p>
                        <p className="text-sm text-gray-600">ID: {vendedor.id}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-sm">
                        <Mail className="w-3 h-3" />
                        {vendedor.email}
                      </div>
                      <div className="flex items-center gap-1 text-sm">
                        <Phone className="w-3 h-3" />
                        {vendedor.telefone}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">{vendedor.vendasMes}</span>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium text-green-600">{vendedor.comissaoMes}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700">
                      {vendedor.taxaComissao}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={vendedor.status === "Ativo" ? "default" : "secondary"}
                      className={vendedor.status === "Ativo" ? "bg-green-100 text-green-800" : ""}
                    >
                      {vendedor.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">Editar</Button>
                      <Button variant="outline" size="sm">Ver Vendas</Button>
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
