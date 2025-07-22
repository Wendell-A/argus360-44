import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Search, Edit, Trash2, FileType } from 'lucide-react';
import { useDepartments, useDeleteDepartment } from '@/hooks/useDepartments';
import DepartmentModal from '@/components/DepartmentModal';
import DepartmentTemplateModal from '@/components/DepartmentTemplateModal';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { toast } from 'sonner';

export default function Departamentos() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [showDepartmentModal, setShowDepartmentModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: string; name: string }>({
    open: false,
    id: '',
    name: ''
  });

  const { departments, isLoading } = useDepartments();
  const deleteDepartment = useDeleteDepartment();

  const filteredDepartments = departments.filter(department =>
    department.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    department.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (department: any) => {
    setEditingDepartment(department);
    setShowDepartmentModal(true);
  };

  const handleModalClose = () => {
    setShowDepartmentModal(false);
    setEditingDepartment(null);
  };

  const handleDeleteClick = (department: any) => {
    setDeleteConfirm({
      open: true,
      id: department.id,
      name: department.name
    });
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteDepartment.deleteDepartmentAsync(deleteConfirm.id);
      setDeleteConfirm({ open: false, id: '', name: '' });
    } catch (error) {
      console.error('Error deleting department:', error);
      toast.error('Erro ao excluir departamento');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Departamentos</h1>
        </div>
        <div className="text-center py-8">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Departamentos</h1>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setShowTemplateModal(true)}
          >
            <FileType className="h-4 w-4 mr-2" />
            Usar Template
          </Button>
          <Button onClick={() => setShowDepartmentModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Departamento
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar departamentos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDepartments.map((department) => (
          <Card key={department.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{department.name}</CardTitle>
                <div className="flex gap-1">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleEdit(department)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleDeleteClick(department)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            {department.description && (
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {department.description}
                </p>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {filteredDepartments.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          {searchTerm ? 'Nenhum departamento encontrado.' : 'Nenhum departamento cadastrado ainda.'}
        </div>
      )}

      <DepartmentModal 
        open={showDepartmentModal}
        onOpenChange={handleModalClose}
        department={editingDepartment}
        onSave={(data) => {
          // Handle save logic here if needed
          handleModalClose();
        }}
        isLoading={false}
      />

      <DepartmentTemplateModal 
        open={showTemplateModal}
        onClose={() => setShowTemplateModal(false)}
      />

      <ConfirmDialog
        isOpen={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, id: '', name: '' })}
        onConfirm={handleDeleteConfirm}
        title="Excluir Departamento"
        description={`Tem certeza que deseja excluir o departamento "${deleteConfirm.name}"? Esta ação não pode ser desfeita.`}
        isLoading={deleteDepartment.isPending}
        variant="destructive"
      />
    </div>
  );
}
