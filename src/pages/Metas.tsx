
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Search, Target, TrendingUp, Award, Calendar } from "lucide-react";
import GoalModal from "@/components/GoalModal";
import GoalCard from "@/components/GoalCard";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useGoals, useCreateGoal, useUpdateGoal, useDeleteGoal, useGoalStats, Goal } from "@/hooks/useGoals";

export default function Metas() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [deleteGoalId, setDeleteGoalId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const { goals, isLoading, refetch } = useGoals();
  const { data: stats } = useGoalStats();
  const createGoal = useCreateGoal();
  const updateGoal = useUpdateGoal();
  const deleteGoal = useDeleteGoal();

  const filteredGoals = goals.filter(goal => 
    goal.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (goal.goal_type === 'office' ? 'escritório' : 'individual').includes(searchTerm.toLowerCase())
  );

  const handleCreateGoal = (data: any) => {
    createGoal.mutate(data, {
      onSuccess: () => {
        setIsModalOpen(false);
        refetch();
      }
    });
  };

  const handleUpdateGoal = (data: any) => {
    if (editingGoal) {
      updateGoal.mutate({ id: editingGoal.id, ...data }, {
        onSuccess: () => {
          setEditingGoal(null);
          setIsModalOpen(false);
          refetch();
        }
      });
    }
  };

  const handleDeleteGoal = () => {
    if (deleteGoalId) {
      deleteGoal.mutate(deleteGoalId, {
        onSuccess: () => {
          setDeleteGoalId(null);
          refetch();
        }
      });
    }
  };

  const handleEditGoal = (goal: Goal) => {
    setEditingGoal(goal);
    setIsModalOpen(true);
  };

  const handleNewGoal = () => {
    setEditingGoal(null);
    setIsModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-sm text-muted-foreground">Carregando metas...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Metas</h1>
          <p className="text-gray-500 mt-1">Gerencie as metas do escritório e individuais</p>
        </div>
        <Button onClick={handleNewGoal} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Nova Meta
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Target className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total de Metas</p>
                  <p className="text-2xl font-bold">{stats.totalGoals}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Progresso Médio</p>
                  <p className="text-2xl font-bold">{stats.averageProgress.toFixed(1)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Award className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Metas Concluídas</p>
                  <p className="text-2xl font-bold">{stats.completedGoals}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Metas Ativas</p>
                  <p className="text-2xl font-bold">{stats.totalGoals - stats.completedGoals}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar metas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Goals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredGoals.map((goal) => (
          <GoalCard
            key={goal.id}
            goal={goal}
            onEdit={handleEditGoal}
            onDelete={setDeleteGoalId}
          />
        ))}
      </div>

      {filteredGoals.length === 0 && (
        <div className="text-center py-12">
          <Target className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-muted-foreground">
            {searchTerm ? "Nenhuma meta encontrada" : "Nenhuma meta cadastrada"}
          </h3>
          <p className="text-sm text-muted-foreground mt-2">
            {searchTerm ? "Tente buscar por outros termos" : "Comece criando sua primeira meta"}
          </p>
          {!searchTerm && (
            <Button onClick={handleNewGoal} className="mt-4">
              <Plus className="h-4 w-4 mr-2" />
              Nova Meta
            </Button>
          )}
        </div>
      )}

      {/* Modal */}
      <GoalModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        goal={editingGoal}
        onSave={editingGoal ? handleUpdateGoal : handleCreateGoal}
        isLoading={createGoal.isPending || updateGoal.isPending}
      />

      {/* Confirm Delete */}
      <ConfirmDialog
        isOpen={!!deleteGoalId}
        onClose={() => setDeleteGoalId(null)}
        title="Excluir Meta"
        description="Tem certeza que deseja excluir esta meta? Esta ação não pode ser desfeita."
        onConfirm={handleDeleteGoal}
        isLoading={deleteGoal.isPending}
        variant="destructive"
      />
    </div>
  );
}
