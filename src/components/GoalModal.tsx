
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useOffices } from "@/hooks/useOffices";
import { useVendedores } from "@/hooks/useVendedores";
import { Goal, GoalInsert } from "@/hooks/useGoals";

interface GoalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal?: Goal | null;
  onSave: (data: GoalInsert) => void;
  isLoading: boolean;
}

export default function GoalModal({ open, onOpenChange, goal, onSave, isLoading }: GoalModalProps) {
  const [formData, setFormData] = useState<GoalInsert>({
    goal_type: 'office',
    target_amount: 0,
    period_start: '',
    period_end: '',
    status: 'active',
    description: '',
  });

  const { offices } = useOffices();
  const { vendedores } = useVendedores();

  useEffect(() => {
    if (goal) {
      setFormData({
        office_id: goal.office_id,
        user_id: goal.user_id,
        goal_type: goal.goal_type,
        target_amount: goal.target_amount,
        period_start: goal.period_start,
        period_end: goal.period_end,
        status: goal.status,
        description: goal.description || '',
      });
    } else {
      // Definir período padrão para o mês atual
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      setFormData({
        goal_type: 'office',
        target_amount: 0,
        period_start: firstDay.toISOString().split('T')[0],
        period_end: lastDay.toISOString().split('T')[0],
        status: 'active',
        description: '',
      });
    }
  }, [goal, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const data: GoalInsert = {
      ...formData,
      target_amount: Number(formData.target_amount),
      office_id: formData.goal_type === 'office' ? formData.office_id : undefined,
      user_id: formData.goal_type === 'individual' ? formData.user_id : undefined,
    };

    onSave(data);
  };

  const handleChange = (field: keyof GoalInsert, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{goal ? "Editar Meta" : "Nova Meta"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="goal_type">Tipo de Meta *</Label>
              <Select 
                value={formData.goal_type} 
                onValueChange={(value: 'office' | 'individual') => handleChange("goal_type", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="office">Meta do Escritório</SelectItem>
                  <SelectItem value="individual">Meta Individual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.goal_type === 'office' && (
              <div className="space-y-2">
                <Label htmlFor="office_id">Escritório *</Label>
                <Select value={formData.office_id || ''} onValueChange={(value) => handleChange("office_id", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um escritório" />
                  </SelectTrigger>
                  <SelectContent>
                    {offices.map((office) => (
                      <SelectItem key={office.id} value={office.id}>
                        {office.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {formData.goal_type === 'individual' && (
              <div className="space-y-2">
                <Label htmlFor="user_id">Vendedor *</Label>
                <Select value={formData.user_id || ''} onValueChange={(value) => handleChange("user_id", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um vendedor" />
                  </SelectTrigger>
                  <SelectContent>
                    {vendedores.map((vendedor) => (
                      <SelectItem key={vendedor.id} value={vendedor.id}>
                        {vendedor.full_name || vendedor.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="target_amount">Valor da Meta *</Label>
              <Input
                id="target_amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.target_amount}
                onChange={(e) => handleChange("target_amount", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="period_start">Data de Início *</Label>
              <Input
                id="period_start"
                type="date"
                value={formData.period_start}
                onChange={(e) => handleChange("period_start", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="period_end">Data de Fim *</Label>
              <Input
                id="period_end"
                type="date"
                value={formData.period_end}
                onChange={(e) => handleChange("period_end", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value: 'active' | 'completed' | 'cancelled') => handleChange("status", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativa</SelectItem>
                  <SelectItem value="completed">Concluída</SelectItem>
                  <SelectItem value="cancelled">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              placeholder="Digite uma descrição para a meta..."
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
