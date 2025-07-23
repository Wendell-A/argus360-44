
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useVendedores } from '@/hooks/useVendedores';
import { VendedorModal } from '@/components/VendedorModal';
import { UserPlus, Search, Filter, Users, AlertCircle } from 'lucide-react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function Vendedores() {
  const { vendedores, isLoading, deleteVendedor } = useVendedores();
  const { currentUser } = useCurrentUser();
  const { activeTenant } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [selectedVendedor, setSelectedVendedor] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Buscar usuários disponíveis para serem vendedores (apenas usuários do tenant)
  const { data: availableUsers = [] } = useQuery({
    queryKey: ['available-users', activeTenant?.tenant_id],
    queryFn: async () => {
      if (!activeTenant?.tenant_id) return [];

      const { data, error } = await supabase
        .from('tenant_users')
        .select(`
          user_id,
          role,
          profiles!inner (
            id,
            full_name,
            email
          )
        `)
        .eq('tenant_id', activeTenant.tenant_id)
        .eq('active', true);

      if (error) throw error;
      return data || [];
    },
    enabled: !!activeTenant?.tenant_id,
  });

  const filteredVendedores = vendedores?.filter(vendedor => {
    const matchesSearch = vendedor.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vendedor.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || vendedor.active.toString() === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  const handleEdit = (vendedor: any) => {
    setSelectedVendedor(vendedor);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja remover este vendedor?')) {
      await deleteVendedor.mutateAsync(id);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedVendedor(null);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando vendedores...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Vendedores</h1>
          <p className="text-muted-foreground">
            Gerencie os vendedores da sua organização
          </p>
        </div>
        <Button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2"
          disabled={availableUsers.length === 0}
        >
          <UserPlus className="h-4 w-4" />
          Novo Vendedor
        </Button>
      </div>

      {availableUsers.length === 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Não há usuários disponíveis para serem cadastrados como vendedores. 
            Para adicionar novos vendedores, primeiro você precisa{' '}
            <Button
              variant="link"
              className="p-0 h-auto font-normal text-blue-600"
              onClick={() => window.open('/convites', '_blank')}
            >
              enviar convites
            </Button>
            {' '}para novos usuários.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Lista de Vendedores
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar vendedores..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="true">Ativos</SelectItem>
                <SelectItem value="false">Inativos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Escritório</TableHead>
                  <TableHead>Equipe</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVendedores.length > 0 ? (
                  filteredVendedores.map((vendedor) => (
                    <TableRow key={vendedor.id}>
                      <TableCell className="font-medium">
                        {vendedor.profiles?.full_name || 'N/A'}
                      </TableCell>
                      <TableCell>{vendedor.profiles?.email || 'N/A'}</TableCell>
                      <TableCell>
                        {vendedor.offices?.name || 'N/A'}
                      </TableCell>
                      <TableCell>
                        {vendedor.teams?.name || 'Sem equipe'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={vendedor.active ? 'default' : 'secondary'}>
                          {vendedor.active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(vendedor)}
                          >
                            Editar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(vendedor.id)}
                            disabled={deleteVendedor.isPending}
                          >
                            {deleteVendedor.isPending ? 'Removendo...' : 'Remover'}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      {searchTerm ? 'Nenhum vendedor encontrado com os critérios de busca.' : 'Nenhum vendedor cadastrado.'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <VendedorModal
        open={showModal}
        onOpenChange={handleCloseModal}
        vendedor={selectedVendedor}
        availableUsers={availableUsers}
      />
    </div>
  );
}
