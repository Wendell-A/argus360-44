
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { usePositions, useDeletePosition } from '@/hooks/usePositions';
import { PositionModal } from '@/components/PositionModal';
import { Briefcase, Search, Trash2, Edit, Building2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const Cargos = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const { positions, isLoading } = usePositions();
  const deletePosition = useDeletePosition();

  const filteredPositions = positions.filter(position =>
    position.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    position.department?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeletePosition = async (id: string) => {
    try {
      await deletePosition.mutateAsync(id);
    } catch (error) {
      console.error('Error deleting position:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Cargos</h1>
          <p className="text-muted-foreground">
            Gerencie os cargos da sua organização
          </p>
        </div>
        <PositionModal />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Cargos</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{positions.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Com Departamento</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {positions.filter(p => p.department).length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sem Departamento</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {positions.filter(p => !p.department).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Buscar Cargos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar por nome do cargo ou departamento..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Positions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Cargos</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredPositions.length === 0 ? (
            <div className="text-center py-12">
              <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {searchTerm ? 'Nenhum cargo encontrado' : 'Nenhum cargo cadastrado'}
              </h3>
              <p className="text-gray-500 mb-4">
                {searchTerm 
                  ? 'Tente ajustar os filtros de busca.'
                  : 'Comece criando seu primeiro cargo.'
                }
              </p>
              {!searchTerm && <PositionModal />}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Departamento</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead className="w-[100px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPositions.map((position) => (
                  <TableRow key={position.id}>
                    <TableCell>
                      <div className="font-medium">{position.name}</div>
                    </TableCell>
                    <TableCell>
                      {position.department ? (
                        <Badge variant="secondary">
                          {position.department.name}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">Sem departamento</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[200px] truncate text-sm text-muted-foreground">
                        {position.description || 'Sem descrição'}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(position.created_at), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <PositionModal
                          position={position}
                          trigger={
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          }
                        />
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir o cargo "{position.name}"?
                                Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeletePosition(position.id)}
                              >
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Cargos;
