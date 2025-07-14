
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
import { Plus, Car, Home, Wrench, Calculator } from "lucide-react";

const consorcios = [
  {
    id: 1,
    tipo: "Veículos",
    categoria: "Carros",
    valor: "R$ 50.000",
    prazo: "60 meses",
    taxaAdmin: "15%",
    taxaComissao: "5%",
    status: "Ativo",
    icon: Car,
    cotas: 150,
    cotasVendidas: 89
  },
  {
    id: 2,
    tipo: "Imóveis",
    categoria: "Casa",
    valor: "R$ 200.000",
    prazo: "120 meses",
    taxaAdmin: "12%",
    taxaComissao: "3%",
    status: "Ativo",
    icon: Home,
    cotas: 200,
    cotasVendidas: 145
  },
  {
    id: 3,
    tipo: "Veículos",
    categoria: "Motos",
    valor: "R$ 15.000",
    prazo: "36 meses",
    taxaAdmin: "18%",
    taxaComissao: "6%",
    status: "Ativo",
    icon: Car,
    cotas: 100,
    cotasVendidas: 67
  },
  {
    id: 4,
    tipo: "Serviços",
    categoria: "Reforma",
    valor: "R$ 80.000",
    prazo: "84 meses",
    taxaAdmin: "14%",
    taxaComissao: "4%",
    status: "Encerrado",
    icon: Wrench,
    cotas: 120,
    cotasVendidas: 120
  },
];

export default function Consorcios() {
  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Consórcios</h1>
          <p className="text-gray-600 mt-1">Configure as tabelas de consórcios e comissões</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Nova Tabela
        </Button>
      </div>

      {/* Cards resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tabelas Ativas</CardTitle>
            <Calculator className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-blue-600 mt-1">3 categorias</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cotas Vendidas</CardTitle>
            <Car className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">421</div>
            <p className="text-xs text-green-600 mt-1">de 570 cotas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa Média</CardTitle>
            <Calculator className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4.5%</div>
            <p className="text-xs text-purple-600 mt-1">Comissão média</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <Home className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ 14.5M</div>
            <p className="text-xs text-orange-600 mt-1">Em consórcios ativos</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de consórcios */}
      <Card>
        <CardHeader>
          <CardTitle>Tabelas de Consórcios</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo/Categoria</TableHead>
                <TableHead>Valor do Bem</TableHead>
                <TableHead>Prazo</TableHead>
                <TableHead>Taxa Admin</TableHead>
                <TableHead>Taxa Comissão</TableHead>
                <TableHead>Cotas</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {consorcios.map((consorcio) => {
                const IconComponent = consorcio.icon;
                const porcentagemVendida = (consorcio.cotasVendidas / consorcio.cotas * 100).toFixed(0);
                
                return (
                  <TableRow key={consorcio.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <IconComponent className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">{consorcio.tipo}</p>
                          <p className="text-sm text-gray-600">{consorcio.categoria}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{consorcio.valor}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-gray-50">
                        {consorcio.prazo}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-red-600 font-medium">{consorcio.taxaAdmin}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-green-600 font-medium">{consorcio.taxaComissao}</span>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{consorcio.cotasVendidas}/{consorcio.cotas}</p>
                        <div className="w-20 bg-gray-200 rounded-full h-2 mt-1">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${porcentagemVendida}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">{porcentagemVendida}%</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={consorcio.status === "Ativo" ? "default" : "secondary"}
                        className={consorcio.status === "Ativo" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
                      >
                        {consorcio.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">Editar</Button>
                        <Button variant="outline" size="sm">Vendas</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
