
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Edit3, Save, X } from "lucide-react";
import { useChargebackSchedules } from "@/hooks/useChargebackSchedules";
import type { ChargebackSchedule } from "@/hooks/useChargebackSchedules";

interface ChargebackScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  productName: string;
}

export const ChargebackScheduleModal = ({ 
  isOpen, 
  onClose, 
  productId, 
  productName 
}: ChargebackScheduleModalProps) => {
  const { schedules, createSchedule, updateSchedule, deleteSchedule, isCreating, isUpdating, isDeleting } = useChargebackSchedules(productId);
  const [editingSchedule, setEditingSchedule] = useState<ChargebackSchedule | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [formData, setFormData] = useState({
    percentage: '',
    max_payment_number: '',
    description: ''
  });

  useEffect(() => {
    if (editingSchedule) {
      setFormData({
        percentage: editingSchedule.percentage.toString(),
        max_payment_number: editingSchedule.max_payment_number.toString(),
        description: editingSchedule.description || ''
      });
    } else {
      setFormData({
        percentage: '',
        max_payment_number: '',
        description: ''
      });
    }
  }, [editingSchedule]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const data = {
      product_id: productId,
      percentage: parseFloat(formData.percentage),
      max_payment_number: parseInt(formData.max_payment_number),
      description: formData.description || null
    };

    if (editingSchedule) {
      updateSchedule({ id: editingSchedule.id, updates: data });
    } else {
      createSchedule(data);
    }

    setEditingSchedule(null);
    setIsAddingNew(false);
    setFormData({ percentage: '', max_payment_number: '', description: '' });
  };

  const handleCancel = () => {
    setEditingSchedule(null);
    setIsAddingNew(false);
    setFormData({ percentage: '', max_payment_number: '', description: '' });
  };

  const handleEdit = (schedule: ChargebackSchedule) => {
    setEditingSchedule(schedule);
    setIsAddingNew(false);
  };

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja excluir este cronograma?")) {
      deleteSchedule(id);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cronograma de Estornos - {productName}</DialogTitle>
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
                  <p className="text-sm text-gray-600">Total de Regras</p>
                  <p className="text-lg font-semibold">{schedules.length}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Maior Prazo</p>
                  <p className="text-lg font-semibold">
                    {schedules.length > 0 ? Math.max(...schedules.map(s => s.max_payment_number)) : 0} pagamentos
                  </p>
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
                      <Label htmlFor="percentage">Percentual de Estorno (%)</Label>
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
                    <div>
                      <Label htmlFor="max_payment_number">Até o Pagamento Nº</Label>
                      <Input
                        id="max_payment_number"
                        type="number"
                        min="1"
                        value={formData.max_payment_number}
                        onChange={(e) => setFormData(prev => ({ ...prev, max_payment_number: e.target.value }))}
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
                      placeholder="Descrição adicional sobre esta regra de estorno..."
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
                            <p className="font-medium">{schedule.percentage}% de estorno</p>
                            <p className="text-sm text-gray-600">Até o {schedule.max_payment_number}º pagamento</p>
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
