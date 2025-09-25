
import React from "react";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Plus, 
  Search, 
  Filter, 
  Users, 
  UserCheck, 
  Clock,
  Eye,
  Edit,
  Trash2,
  ArrowRightLeft
} from "lucide-react";
import { useClients, useCreateClient, useDeleteClient } from "@/hooks/useClients";
import { ClientModal } from "@/components/ClientModal";
import { useToast } from "@/hooks/use-toast";
import { useUpdateClientFunnelPosition, useSalesFunnelStages, useCreateDefaultFunnelStages } from "@/hooks/useSalesFunnel";
import { BirthdayClients } from "@/components/crm/BirthdayClients";
import { Calendar } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { ClientTransferModal } from "@/components/ClientTransferModal";

export default function Clientes() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [classificationFilter, setClassificationFilter] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view">("create");
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [clientToTransfer, setClientToTransfer] = useState<any>(null);
  
  const { clients, isLoading, error: clientsError } = useClients();
  const { createClientAsync, isCreating: isCreatingClient, error: createError } = useCreateClient();
  const { deleteClientAsync, isDeleting } = useDeleteClient();
  const { toast } = useToast();
  const { updatePositionAsync, isUpdating } = useUpdateClientFunnelPosition();
  const { stages } = useSalesFunnelStages();
  const { createDefaultStagesAsync, isCreating } = useCreateDefaultFunnelStages();
  const { activeTenant } = useAuth();

  // Criar fases padrão se não existirem
  useEffect(() => {
    if (stages.length === 0) {
      createDefaultStagesAsync().catch((error) => {
        console.error('Erro ao criar fases padrão:', error);
      });
    }
  }, [stages.length, createDefaultStagesAsync]);

  const filteredClients = clients.filter((client) => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.document.includes(searchTerm);
    const matchesStatus = statusFilter === "all" || client.status === statusFilter;
    const matchesClass = classificationFilter === "all" || client.classification === classificationFilter;
    
    return matchesSearch && matchesStatus && matchesClass;
  });

  const metrics = {
    total: clients.length,
    prospects: clients.filter(c => c.status === 'prospect').length,
    active: clients.filter(c => c.status === 'active').length,
    inactive: clients.filter(c => c.status === 'inactive').length
  };

  const handleCreate = () => {
    setSelectedClient(null);
    setModalMode("create");
    setIsModalOpen(true);
  };

  // Lidar com erros de clientes
  React.useEffect(() => {
    if (clientsError) {
      console.error('❌ Erro ao carregar clientes:', clientsError);
      toast({
        title: "Erro ao carregar clientes",
        description: "Não foi possível carregar a lista de clientes. Verifique suas permissões.",
        variant: "destructive",
      });
    }
    if (createError) {
      console.error('❌ Erro ao criar cliente:', createError);
      toast({
        title: "Erro ao criar cliente",
        description: createError.message || "Não foi possível criar o cliente. Verifique os dados e tente novamente.",
        variant: "destructive",
      });
    }
  }, [clientsError, createError, toast]);

  const handleView = (client: any) => {
    setSelectedClient(client);
    setModalMode("view");
    setIsModalOpen(true);
  };

  const handleEdit = (client: any) => {
    setSelectedClient(client);
    setModalMode("edit");
    setIsModalOpen(true);
  };

  const handleDelete = async (clientId: string) => {
    if (window.confirm("Tem certeza que deseja excluir este cliente?")) {
      try {
        await deleteClientAsync(clientId);
        toast({
          title: "Cliente excluído",
          description: "O cliente foi excluído com sucesso.",
        });
      } catch (error) {
        toast({
          title: "Erro",
          description: "Não foi possível excluir o cliente.",
          variant: "destructive",
        });
      }
    }
  };

  const handleTransfer = (client: any) => {
    setClientToTransfer(client);
    setIsTransferModalOpen(true);
  };

  const handleCloseTransferModal = () => {
    setClientToTransfer(null);
    setIsTransferModalOpen(false);
  };

  const handleAddToFunnel = async (clientId: string, clientName: string) => {
    console.log('🎯 DEBUG: Iniciando handleAddToFunnel para cliente:', { clientId, clientName });
    console.log('🎯 DEBUG: Estados atuais:', { 
      stagesLength: stages.length, 
      isUpdating, 
      isCreating,
      activeTenant: activeTenant?.tenant_id
    });
    console.log('🎯 Iniciando adição do cliente ao funil:', { clientId, clientName });
    
    try {
      // Verificar se há fases disponíveis
      console.log('📊 Fases disponíveis:', stages.length);
      
      if (stages.length === 0) {
        console.log('⚠️ Nenhuma fase encontrada, criando fases padrão...');
        toast({
          title: "Criando fases do funil",
          description: "Configurando fases padrão do funil de vendas...",
        });
        await createDefaultStagesAsync();
        console.log('✅ Fases padrão criadas com sucesso');
        return;
      }

      // Pegar a primeira fase (Lead)
      const firstStage = stages.find(stage => stage.order_index === 1) || stages[0];
      console.log('🎪 Primeira fase selecionada:', firstStage);
      
      if (!firstStage) {
        throw new Error('Nenhuma fase encontrada no funil');
      }

      console.log('🚀 Adicionando cliente ao funil...');
      
      // Adicionar cliente na primeira fase do funil
      const result = await updatePositionAsync({
        clientId: clientId,
        stageId: firstStage.id,
        probability: 10,
        expectedValue: 0,
        notes: `Cliente ${clientName} adicionado automaticamente ao funil em ${new Date().toLocaleDateString('pt-BR')}`,
      });

      console.log('✅ Cliente adicionado ao funil com sucesso:', result);

      toast({
        title: "Cliente adicionado ao funil! 🎉",
        description: `${clientName} foi adicionado à fase "${firstStage.name}" do funil de vendas.`,
      });
    } catch (error: any) {
      console.error('❌ Erro ao adicionar cliente ao funil:', error);
      console.error('❌ Detalhes do erro:', {
        message: error?.message,
        code: error?.code,
        details: error?.details,
        hint: error?.hint,
        stack: error?.stack
      });
      
      toast({
        title: "Erro ao adicionar ao CRM",
        description: error?.message || "Não foi possível adicionar o cliente ao funil. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const getClassificationColor = (classification: string) => {
    switch (classification) {
      case 'hot': return 'bg-red-100 text-red-800';
      case 'warm': return 'bg-yellow-100 text-yellow-800';
      case 'cold': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'prospect': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4 sm:p-6 lg:p-8 w-full max-w-none">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 lg:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-gray-900">Clientes</h1>
            <p className="text-sm sm:text-base lg:text-lg text-gray-600 mt-1">Gerencie sua base de clientes</p>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={() => window.location.href = '/crm'}
              variant="outline"
              className="w-full sm:w-auto"
            >
              <Users className="w-4 h-4 mr-2" />
              Ver CRM
            </Button>
            <Button 
              onClick={handleCreate}
              className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Cliente
            </Button>
          </div>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-4 lg:gap-6 xl:gap-8 mb-6 lg:mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.total}</div>
              <p className="text-xs text-gray-600 mt-1">Base total</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Prospects</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.prospects}</div>
              <p className="text-xs text-yellow-600 mt-1">Em prospecção</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clientes Ativos</CardTitle>
              <UserCheck className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.active}</div>
              <p className="text-xs text-green-600 mt-1">Com contratos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
              <UserCheck className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics.total > 0 ? Math.round((metrics.active / metrics.total) * 100) : 0}%
              </div>
              <p className="text-xs text-purple-600 mt-1">Prospect → Cliente</p>
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
                  placeholder="Buscar por nome, email ou documento..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Status</SelectItem>
                    <SelectItem value="prospect">Prospect</SelectItem>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="inactive">Inativo</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={classificationFilter} onValueChange={setClassificationFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Classificação" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as Classificações</SelectItem>
                    <SelectItem value="hot">Hot</SelectItem>
                    <SelectItem value="warm">Warm</SelectItem>
                    <SelectItem value="cold">Cold</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Birthday Clients Section */}
        <div className="mb-6 lg:mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="h-5 w-5 text-purple-600" />
            <h2 className="text-lg font-semibold text-gray-900">Aniversariantes da Semana</h2>
          </div>
          <BirthdayClients />
        </div>

        {/* Clients Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg lg:text-xl">Lista de Clientes</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex justify-center items-center h-32">
                <div className="text-gray-500">Carregando clientes...</div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[200px]">Cliente</TableHead>
                      <TableHead className="min-w-[200px]">Contato</TableHead>
                      <TableHead className="min-w-[120px]">Documento</TableHead>
                      <TableHead className="min-w-[100px]">Status</TableHead>
                      <TableHead className="min-w-[120px]">Classificação</TableHead>
                      <TableHead className="min-w-[200px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredClients.map((client) => (
                      <TableRow key={client.id} className="hover:bg-gray-50">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarFallback className="bg-blue-100 text-blue-600">
                                {getInitials(client.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{client.name}</p>
                              <p className="text-sm text-gray-600">{client.type}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {client.email && (
                              <p className="text-sm">{client.email}</p>
                            )}
                            {client.phone && (
                              <p className="text-sm text-gray-600">{client.phone}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-sm">{client.document}</span>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(client.status || 'prospect')}>
                            {client.status || 'prospect'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getClassificationColor(client.classification || 'cold')}>
                            {client.classification || 'cold'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col sm:flex-row gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleView(client)}
                              className="text-xs"
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              Ver
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(client)}
                              className="text-xs"
                            >
                              <Edit className="w-3 h-3 mr-1" />
                              Editar
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleTransfer(client)}
                              className="text-xs"
                            >
                              <ArrowRightLeft className="w-3 h-3 mr-1" />
                              Repassar
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleAddToFunnel(client.id, client.name)}
                              disabled={isUpdating || isCreating}
                              className="text-xs text-green-600 hover:text-green-700"
                            >
                              <Users className="w-3 h-3 mr-1" />
                              {(isUpdating || isCreating) ? 'Adicionando...' : '+ CRM'}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(client.id)}
                              className="text-xs text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-3 h-3 mr-1" />
                              Excluir
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Client Modal */}
        <ClientModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          mode={modalMode}
          client={selectedClient}
        />

        {/* Client Transfer Modal */}
        <ClientTransferModal
          isOpen={isTransferModalOpen}
          onClose={() => setIsTransferModalOpen(false)}
          client={clientToTransfer}
        />
      </div>
    </div>
  );
}
