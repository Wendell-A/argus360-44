
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Edit3, Save, X } from "lucide-react";
import { useCommissionSchedules } from "@/hooks/useCommissionSchedules";
import type { CommissionSchedule } from "@/hooks/useCommissionSchedules";

interface CommissionScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  productName: string;
}

export const CommissionScheduleModal = ({ 
  isOpen, 
  onClose, 
  productId, 
  productName 
}: CommissionScheduleModalProps) => {
  const { schedules, createSchedule, updateSchedule, deleteSchedule, isCreating, isUpdating, isDeleting } = useCommissionSchedules(productId);
  const [editingSchedule, setEditingSchedule] = useState<CommissionSchedule | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [formData, setFormData] = useState({
    installment_number: '',
    percentage: '',
    description: ''
  });

  useEffect(() => {
    if (editingSchedule) {
      setFormData({
        installment_number: editingSchedule.installment_number.toString(),
        percentage: editingSchedule.percentage.toString(),
        description: editingSchedule.description || ''
      });
    } else {
      setFormData({
        installment_number: '',
        percentage: '',
        description: ''
      });
    }
  }, [editingSchedule]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const data = {
      product_id: productId,
      installment_number: parseInt(formData.installment_number),
      percentage: parseFloat(formData.percentage),
      description: formData.description || null
    };

    if (editingSchedule) {
      updateSchedule({ id: editingSchedule.id, updates: data });
    } else {
      createSchedule(data);
    }

    setEditingSchedule(null);
    setIsAddingNew(false);
    setFormData({ installment_number: '', percentage: '', description: '' });
  };

  const handleCancel = () => {
    setEditingSchedule(null);
    setIsAddingNew(false);
    setFormData({ installment_number: '', percentage: '', description: '' });
  };

  const handleEdit = (schedule: CommissionSchedule) => {
    setEditingSchedule(schedule);
    setIsAddingNew(false);
  };

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja excluir este cronograma?")) {
      deleteSchedule(id);
    }
  };

  const totalPercentage = schedules.reduce((sum, schedule) => sum + schedule.percentage, 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cronograma de Comissões - {productName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Resumo */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Resumo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Total de Parcelas</p>
                  <p className="text-lg font-semibold">{schedules.length}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Percentual Total</p>
                  <p className="text-lg font-semibold">{totalPercentage.toFixed(2)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Formulário */}
          {(isAddingNew || editingSchedule) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {editingSchedule ? 'Editar Cronograma' : 'Novo Cronograma'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="installment_number">Número da Parcela</Label>
                      <Input
                        id="installment_number"
                        type="number"
                        min="1"
                        value={formData.installment_number}
                        onChange={(e) => setFormData(prev => ({ ...prev, installment_number: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="percentage">Percentual (%)</Label>
                      <Input
                        id="percentage"
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={formData.percentage}
                        onChange={(e) => setFormData(prev => ({ ...prev, percentage: e.target.value }))}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="description">Descrição (opcional)</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Descrição adicional sobre esta parcela..."
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" disabled={isCreating || isUpdating}>
                      <Save className="w-4 h-4 mr-2" />
                      {editingSchedule ? 'Atualizar' : 'Criar'}
                    </Button>
                    <Button type="button" variant="outline" onClick={handleCancel}>
                      <X className="w-4 h-4 mr-2" />
                      Cancelar
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Lista de Cronogramas */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Cronogramas Configurados</CardTitle>
              {!isAddingNew && !editingSchedule && (
                <Button onClick={() => setIsAddingNew(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {schedules.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  Nenhum cronograma configurado ainda.
                </p>
              ) : (
                <div className="space-y-2">
                  {schedules.map((schedule) => (
                    <div key={schedule.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-4">
                          <div>
                            <p className="font-medium">{schedule.installment_number}ª Parcela</p>
                            <p className="text-sm text-gray-600">{schedule.percentage}%</p>
                          </div>
                          {schedule.description && (
                            <div className="flex-1">
                              <p className="text-sm text-gray-600">{schedule.description}</p>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(schedule)}
                          disabled={isAddingNew || editingSchedule !== null}
                        >
                          <Edit3 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(schedule.id)}
                          disabled={isDeleting}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};
