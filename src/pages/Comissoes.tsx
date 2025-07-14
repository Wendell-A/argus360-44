
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
import { DollarSign, TrendingUp, Calendar, Download } from "lucide-react";

const comissoes = [
  {
    id: 1,
    vendedor: "João Silva",
    cliente: "Empresa ABC Ltda",
    valorVenda: "R$ 85.000",
    taxaComissao: "5%",
    valorComissao: "R$ 4.250",
    dataVenda: "2024-01-15",
    dataPagamento: "2024-01-30",
    status: "Pago",
    consorcio: "Veículos - Carros"
  },
  {
    id: 2,
    vendedor: "Maria Santos",
    cliente: "Construtora XYZ",
    valorVenda: "R$ 120.000",
    taxaComissao: "3%",
    valorComissao: "R$ 3.600",
    dataVenda: "2024-01-14",
    dataPagamento: "2024-02-15",
    status: "Pendente",
    consorcio: "Imóveis - Casa"
  },
  {
    id: 3,
    vendedor: "Pedro Costa",
    cliente: "Carlos Mendes",
    valorVenda: "R$ 15.000",
    taxaComissao: "6%",
    valorComissao: "R$ 900",
    dataVenda: "2024-01-13",
    dataPagamento: "2024-01-28",
    status: "Pago",
    consorcio: "Veículos - Motos"
  },
  {
    id: 4,
    vendedor: "Ana Oliveira",
    cliente: "Transportes Rápidos",
    valorVenda: "R$ 65.000",
    taxaComissao: "5%",
    valorComissao: "R$ 3.250",
    dataVenda: "2024-01-12",
    dataPagamento: "2024-02-10",
    status: "Pendente",
    consorcio: "Veículos - Carros"
  },
];

export default function Comissoes() {
  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Comissões</h1>
          <p className="text-gray-600 mt-1">Controle de comissões dos vendedores</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <DollarSign className="w-4 h-4 mr-2" />
            Processar Pagamentos
          </Button>
        </div>
      </div>

      {/* Cards resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total do Mês</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">R$ 12.000</div>
            <p className="text-xs text-green-600 mt-1">+8% vs mês anterior</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Comissões Pagas</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ 5.150</div>
            <p className="text-xs text-blue-600 mt-1">2 pagamentos realizados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Calendar className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">R$ 6.850</div>
            <p className="text-xs text-yellow-600 mt-1">2 pagamentos aguardando</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa Média</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4.75%</div>
            <p className="text-xs text-purple-600 mt-1">Comissão média</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <Button variant="outline">Todas</Button>
            <Button variant="outline">Pagas</Button>
            <Button variant="outline">Pendentes</Button>
            <Button variant="outline">Este Mês</Button>
            <Button variant="outline">Último Mês</Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de comissões */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Comissões</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vendedor</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Consórcio</TableHead>
                <TableHead>Valor da Venda</TableHead>
                <TableHead>Taxa</TableHead>
                <TableHead>Comissão</TableHead>
                <TableHead>Data Venda</TableHead>
                <TableHead>Pagamento</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {comissoes.map((comissao) => (
                <TableRow key={comissao.id} className="hover:bg-gray-50">
                  <TableCell>
                    <div>
                      <p className="font-medium">{comissao.vendedor}</p>
                      <p className="text-sm text-gray-600">ID: {comissao.id}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{comissao.cliente}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700">
                      {comissao.consorcio}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">{comissao.valorVenda}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-purple-600 font-medium">{comissao.taxaComissao}</span>
                  </TableCell>
                  <TableCell>
                    <span className="font-bold text-green-600">{comissao.valorComissao}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{comissao.dataVenda}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{comissao.dataPagamento}</span>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={comissao.status === "Pago" ? "default" : "secondary"}
                      className={
                        comissao.status === "Pago" 
                          ? "bg-green-100 text-green-800" 
                          : "bg-yellow-100 text-yellow-800"
                      }
                    >
                      {comissao.status}
                    </Badge>
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
