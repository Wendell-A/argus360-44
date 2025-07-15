
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Settings, Users, Bell, Shield, Plus, Edit, Trash2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const taxasComissao = [
  { id: 1, categoria: "Veículos - Carros", taxaMinima: "4%", taxaMaxima: "6%", taxaPadrao: "5%" },
  { id: 2, categoria: "Veículos - Motos", taxaMinima: "5%", taxaMaxima: "7%", taxaPadrao: "6%" },
  { id: 3, categoria: "Imóveis - Casa", taxaMinima: "2%", taxaMaxima: "4%", taxaPadrao: "3%" },
  { id: 4, categoria: "Imóveis - Apartamento", taxaMinima: "2.5%", taxaMaxima: "4.5%", taxaPadrao: "3.5%" },
  { id: 5, categoria: "Serviços", taxaMinima: "3%", taxaMaxima: "5%", taxaPadrao: "4%" },
];

export default function Configuracoes() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4 sm:p-6 lg:p-8 w-full">
        {/* Header */}
        <div className="mb-6 lg:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">Configurações</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Configure as preferências do sistema</p>
        </div>

        <Tabs defaultValue="comissoes" className="w-full">
          <div className="mb-6 lg:mb-8">
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 h-auto">
              <TabsTrigger value="comissoes" className="text-xs sm:text-sm">Comissões</TabsTrigger>
              <TabsTrigger value="empresa" className="text-xs sm:text-sm">Empresa</TabsTrigger>
              <TabsTrigger value="usuarios" className="text-xs sm:text-sm">Usuários</TabsTrigger>
              <TabsTrigger value="notificacoes" className="text-xs sm:text-sm">Notificações</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="comissoes" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
                  Configurações de Comissões
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="comissao-padrao">Taxa de Comissão Padrão (%)</Label>
                    <Input id="comissao-padrao" type="number" placeholder="5" step="0.1" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="prazo-pagamento">Prazo para Pagamento (dias)</Label>
                    <Input id="prazo-pagamento" type="number" placeholder="30" />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch id="auto-calculo" />
                    <Label htmlFor="auto-calculo">Cálculo automático de comissões</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch id="aprovacao-manual" />
                    <Label htmlFor="aprovacao-manual">Aprovação manual de pagamentos</Label>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <CardTitle className="text-base sm:text-lg">Tabela de Taxas por Categoria</CardTitle>
                  <Button className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
                    <Plus className="w-4 h-4 mr-2" />
                    Nova Taxa
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[200px]">Categoria</TableHead>
                        <TableHead className="min-w-[100px]">Taxa Mínima</TableHead>
                        <TableHead className="min-w-[100px]">Taxa Máxima</TableHead>
                        <TableHead className="min-w-[100px]">Taxa Padrão</TableHead>
                        <TableHead className="min-w-[120px]">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {taxasComissao.map((taxa) => (
                        <TableRow key={taxa.id}>
                          <TableCell className="font-medium">{taxa.categoria}</TableCell>
                          <TableCell>{taxa.taxaMinima}</TableCell>
                          <TableCell>{taxa.taxaMaxima}</TableCell>
                          <TableCell>{taxa.taxaPadrao}</TableCell>
                          <TableCell>
                            <div className="flex flex-col sm:flex-row gap-2">
                              <Button variant="outline" size="sm">
                                <Edit className="w-3 h-3" />
                              </Button>
                              <Button variant="outline" size="sm">
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="empresa" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">Informações da Empresa</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="razao-social">Razão Social</Label>
                    <Input id="razao-social" placeholder="ConsórcioPro Ltda" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cnpj">CNPJ</Label>
                    <Input id="cnpj" placeholder="12.345.678/0001-90" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="telefone">Telefone</Label>
                    <Input id="telefone" placeholder="(11) 99999-9999" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail</Label>
                    <Input id="email" type="email" placeholder="contato@consorciopro.com" />
                  </div>
                </div>
                <Button className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
                  Salvar Alterações
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="usuarios" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                    Gestão de Usuários
                  </CardTitle>
                  <Button className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Usuário
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch id="registro-auto" />
                    <Label htmlFor="registro-auto">Permitir auto-registro de vendedores</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="aprovacao-usuario" />
                    <Label htmlFor="aprovacao-usuario">Aprovação manual de novos usuários</Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notificacoes" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                  Configurações de Notificações
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch id="notif-vendas" defaultChecked />
                    <Label htmlFor="notif-vendas">Notificar novas vendas</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="notif-comissoes" defaultChecked />
                    <Label htmlFor="notif-comissoes">Notificar pagamentos de comissões</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="notif-metas" />
                    <Label htmlFor="notif-metas">Notificar metas atingidas</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="notif-email" defaultChecked />
                    <Label htmlFor="notif-email">Enviar notificações por e-mail</Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
