
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreatePosition, useUpdatePosition, type Position } from '@/hooks/usePositions';
import { useDepartments } from '@/hooks/useDepartments';
import { Plus, Edit } from 'lucide-react';

interface PositionModalProps {
  position?: Position;
  trigger?: React.ReactNode;
  onClose?: () => void;
}

export function PositionModal({ position, trigger, onClose }: PositionModalProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    department_id: '',
    description: '',
  });

  const { departments } = useDepartments();
  const createPosition = useCreatePosition();
  const updatePosition = useUpdatePosition();

  useEffect(() => {
    if (position) {
      setFormData({
        name: position.name || '',
        department_id: position.department_id || 'none',
        description: position.description || '',
      });
    } else {
      setFormData({
        name: '',
        department_id: 'none',
        description: '',
      });
    }
  }, [position, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name) {
      return;
    }

    try {
      if (position) {
        await updatePosition.mutateAsync({
          id: position.id,
          ...formData,
          department_id: formData.department_id === 'none' ? undefined : formData.department_id || undefined,
        });
      } else {
        await createPosition.mutateAsync({
          ...formData,
          department_id: formData.department_id === 'none' ? undefined : formData.department_id || undefined,
        });
      }

      setOpen(false);
      onClose?.();
    } catch (error) {
      console.error('Error saving position:', error);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const isLoading = createPosition.isPending || updatePosition.isPending;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant={position ? "ghost" : "default"} size={position ? "sm" : "default"}>
            {position ? (
              <Edit className="h-4 w-4" />
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Novo Cargo
              </>
            )}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {position ? 'Editar Cargo' : 'Novo Cargo'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Cargo*</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Digite o nome do cargo"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="department_id">Departamento</Label>
            <Select value={formData.department_id} onValueChange={(value) => handleChange('department_id', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um departamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum departamento</SelectItem>
                {departments.map((department) => (
                  <SelectItem key={department.id} value={department.id}>
                    {department.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Descreva as responsabilidades do cargo"
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Salvando...' : position ? 'Atualizar' : 'Criar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
