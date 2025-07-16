
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Users,
  Target,
  TrendingUp
} from "lucide-react";
import { useTeams, useCreateTeam, useUpdateTeam, useDeleteTeam } from "@/hooks/useTeams";
import { useOffices } from "@/hooks/useOffices";

const Equipes = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    office_id: "",
    leader_id: "",
  });

  const { teams, isLoading } = useTeams();
  const { offices } = useOffices();
  const { createTeamAsync, isCreating } = useCreateTeam();
  const { updateTeamAsync, isUpdating } = useUpdateTeam();
  const { deleteTeamAsync, isDeleting } = useDeleteTeam();

  const handleCreateTeam = () => {
    setSelectedTeam(null);
    setFormData({
      name: "",
      description: "",
      office_id: "",
      leader_id: "",
    });
    setIsModalOpen(true);
  };

  const handleEditTeam = (team) => {
    setSelectedTeam(team);
    setFormData({
      name: team.name || "",
      description: team.description || "",
      office_id: team.office_id || "",
      leader_id: team.leader_id || "",
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    try {
      if (selectedTeam) {
        await updateTeamAsync({ id: selectedTeam.id, ...formData });
      } else {
        await createTeamAsync(formData);
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error('Erro ao salvar equipe:', error);
    }
  };

  const handleDelete = async (teamId) => {
    if (window.confirm("Tem certeza que deseja desativar esta equipe?")) {
      await deleteTeamAsync(teamId);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center">Carregando equipes...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestão de Equipes</h1>
          <p className="text-muted-foreground">Organize e gerencie suas equipes de trabalho</p>
        </div>
        <Button onClick={handleCreateTeam}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Equipe
        </Button>
      </div>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Equipes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teams.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Membros</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {teams.reduce((acc, team) => acc + (team.team_members?.length || 0), 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Equipes Ativas</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {teams.filter(team => team.active).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Equipes */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Equipes</CardTitle>
        </CardHeader>
        <CardContent>
          {teams.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Nenhuma equipe encontrada</p>
              <Button onClick={handleCreateTeam} className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Criar primeira equipe
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Escritório</TableHead>
                  <TableHead>Membros</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teams.map((team) => (
                  <TableRow key={team.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{team.name}</div>
                        {team.description && (
                          <div className="text-sm text-muted-foreground">
                            {team.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {team.offices?.name || 'N/A'}
                    </TableCell>
                    <TableCell>
                      {team.team_members?.length || 0} membros
                    </TableCell>
                    <TableCell>
                      <Badge variant={team.active ? "default" : "secondary"}>
                        {team.active ? "Ativa" : "Inativa"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditTeam(team)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(team.id)}
                          disabled={isDeleting}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modal de Equipe */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedTeam ? "Editar Equipe" : "Nova Equipe"}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nome da Equipe</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="Digite o nome da equipe"
              />
            </div>

            <div>
              <Label htmlFor="office_id">Escritório</Label>
              <Select 
                value={formData.office_id} 
                onValueChange={(value) => handleChange("office_id", value)}
              >
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

            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                placeholder="Descreva o propósito da equipe"
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setIsModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleSave}
                disabled={isCreating || isUpdating || !formData.name || !formData.office_id}
              >
                {(isCreating || isUpdating) ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Equipes;
