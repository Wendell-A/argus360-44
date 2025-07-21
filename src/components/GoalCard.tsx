
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Edit, Trash2, Target, Calendar, TrendingUp } from "lucide-react";
import { Goal } from "@/hooks/useGoals";

interface GoalCardProps {
  goal: Goal;
  onEdit: (goal: Goal) => void;
  onDelete: (id: string) => void;
}

export default function GoalCard({ goal, onEdit, onDelete }: GoalCardProps) {
  const progress = goal.target_amount > 0 ? (goal.current_amount / goal.target_amount) * 100 : 0;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      active: { label: 'Ativa', variant: 'default' as const },
      completed: { label: 'Concluída', variant: 'outline' as const },
      cancelled: { label: 'Cancelada', variant: 'destructive' as const },
    };
    
    return statusMap[status as keyof typeof statusMap] || statusMap.active;
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center space-x-2">
          <Target className="h-5 w-5 text-blue-600" />
          <CardTitle className="text-lg">
            {goal.goal_type === 'office' ? 'Meta do Escritório' : 'Meta Individual'}
          </CardTitle>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant={getStatusBadge(goal.status).variant}>
            {getStatusBadge(goal.status).label}
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(goal)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(goal.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {goal.description && (
          <p className="text-sm text-muted-foreground">{goal.description}</p>
        )}
        
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Progresso</span>
            <span className="text-sm font-bold">{progress.toFixed(1)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-1">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Atual</span>
            </div>
            <p className="text-lg font-bold text-green-600">
              {formatCurrency(goal.current_amount)}
            </p>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center space-x-1">
              <Target className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">Meta</span>
            </div>
            <p className="text-lg font-bold text-blue-600">
              {formatCurrency(goal.target_amount)}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>
            {formatDate(goal.period_start)} - {formatDate(goal.period_end)}
          </span>
        </div>

        {goal.goal_type === 'office' && goal.offices && (
          <div className="text-sm">
            <span className="font-medium">Escritório: </span>
            {goal.offices.name}
          </div>
        )}

        {goal.goal_type === 'individual' && goal.profiles && (
          <div className="text-sm">
            <span className="font-medium">Vendedor: </span>
            {goal.profiles.full_name || goal.profiles.email}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
