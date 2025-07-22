import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Edit, Trash2, FileType } from 'lucide-react';
import { usePositions, useDeletePosition } from '@/hooks/usePositions';
import { useDepartments } from '@/hooks/useDepartments';
import { PositionModal } from '@/components/PositionModal';
import { PositionTemplateModal } from '@/components/PositionTemplateModal';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { toast } from 'sonner';

export default function Cargos() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: string; name: string }>({
    open: false,
    id: '',
    name: ''
  });

  const { positions, isLoading } = usePositions();
  const { departments } = useDepartments();
  const deletePosition = useDeletePosition();

  const filteredPositions = positions.filter(position => {
    const matchesSearch = position.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         position.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = !selectedDepartment || position.department_id === selectedDepartment;
    return matchesSearch && matchesDepartment;
  });

  const handleDeleteClick = (position: any) => {
    setDeleteConfirm({
      open: true,
      id: position.id,
      name: position.name
    });
  };

  const handleDeleteConfirm = async () => {
    try {
      await deletePosition.mutateAsync(deleteConfirm.id);
      setDeleteConfirm({ open: false, id: '', name: '' });
    } catch (error) {
      console.error('Error deleting position:', error);
      toast.error('Erro ao excluir cargo');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Cargos</h1>
        </div>
        <div className="text-center py-8">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Cargos</h1>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setShowTemplateModal(true)}
          >
            <FileType className="h-4 w-4 mr-2" />
            Usar Template
          </Button>
          <PositionModal />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar cargos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={selectedDepartment}
          onChange={(e) => setSelectedDepartment(e.target.value)}
          className="px-3 py-2 border rounded-md bg-background"
        >
          <option value="">Todos os departamentos</option>
          {departments.map((dept) => (
            <option key={dept.id} value={dept.id}>{dept.name}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPositions.map((position) => (
          <Card key={position.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{position.name}</CardTitle>
                <div className="flex gap-1">
                  <PositionModal 
                    position={position} 
                    trigger={
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    }
                  />
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleDeleteClick(position)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {position.department && (
                <Badge variant="secondary" className="w-fit">
                  {position.department.name}
                </Badge>
              )}
            </CardHeader>
            {position.description && (
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {position.description}
                </p>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {filteredPositions.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          {searchTerm || selectedDepartment ? 'Nenhum cargo encontrado com os filtros aplicados.' : 'Nenhum cargo cadastrado ainda.'}
        </div>
      )}

      <PositionTemplateModal 
        open={showTemplateModal}
        onClose={() => setShowTemplateModal(false)}
      />

      <ConfirmDialog
        open={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, id: '', name: '' })}
        onConfirm={handleDeleteConfirm}
        title="Excluir Cargo"
        description={`Tem certeza que deseja excluir o cargo "${deleteConfirm.name}"? Esta ação não pode ser desfeita.`}
        isLoading={deletePosition.isPending}
      />
    </div>
  );
}
