import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Search, AlertTriangle, CheckCircle2, Calendar } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface ClientDebugData {
  id: string;
  name: string;
  birth_date: string | null;
  created_at: string;
  updated_at: string;
  status: string;
}

interface BirthdayAnalysis {
  id: string;
  name: string;
  birth_date: string;
  days_until_birthday: number;
  age: number;
  next_birthday: string;
  is_in_current_week: boolean;
  has_birthday_message: boolean;
}

export function ClientDebug() {
  const { activeTenant, user } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [forceRefresh, setForceRefresh] = useState(0);

  // Query para buscar todos os clientes com debug info
  const { data: clientsDebug, isLoading } = useQuery({
    queryKey: ['clients_debug', activeTenant?.tenant_id, forceRefresh],
    queryFn: async () => {
      if (!activeTenant?.tenant_id) return [];

      const { data, error } = await supabase
        .from('clients')
        .select('id, name, birth_date, created_at, updated_at, status')
        .eq('tenant_id', activeTenant.tenant_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ClientDebugData[];
    },
    enabled: !!activeTenant?.tenant_id,
  });

  // Query para análise detalhada de aniversários
  const { data: birthdayAnalysis, isLoading: isAnalyzing } = useQuery({
    queryKey: ['birthday_analysis', activeTenant?.tenant_id, forceRefresh],
    queryFn: async () => {
      if (!activeTenant?.tenant_id || !clientsDebug) return [];

      const today = new Date();
      const analysis: BirthdayAnalysis[] = [];

      for (const client of clientsDebug) {
        if (!client.birth_date) continue;

        const birthDate = new Date(client.birth_date);
        const thisYearBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
        
        if (thisYearBirthday < today) {
          thisYearBirthday.setFullYear(today.getFullYear() + 1);
        }

        const daysDiff = Math.ceil((thisYearBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        const age = Math.floor((today.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24 * 365));

        // Verificar se tem mensagem de aniversário recente
        const { data: interactions } = await supabase
          .from('client_interactions')
          .select('id')
          .eq('client_id', client.id)
          .eq('tenant_id', activeTenant.tenant_id)
          .eq('interaction_type', 'whatsapp')
          .ilike('title', '%aniversário%')
          .gte('created_at', new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString())
          .limit(1);

        analysis.push({
          id: client.id,
          name: client.name,
          birth_date: client.birth_date,
          days_until_birthday: daysDiff,
          age,
          next_birthday: thisYearBirthday.toISOString().split('T')[0],
          is_in_current_week: daysDiff >= 0 && daysDiff <= 7,
          has_birthday_message: (interactions && interactions.length > 0)
        });
      }

      return analysis.sort((a, b) => a.days_until_birthday - b.days_until_birthday);
    },
    enabled: !!activeTenant?.tenant_id && !!clientsDebug,
  });

  const handleForceRefresh = async () => {
    console.log('🔄 [DEBUG] Forçando atualização de todos os caches...');
    
    await queryClient.invalidateQueries({ queryKey: ['clients'] });
    await queryClient.invalidateQueries({ queryKey: ['birthday_clients'] });
    await queryClient.invalidateQueries({ queryKey: ['client_interactions'] });
    
    setForceRefresh(prev => prev + 1);
    
    toast({
      title: "Cache Atualizado",
      description: "Todos os dados foram atualizados com sucesso.",
    });
  };

  const filteredClients = clientsDebug?.filter(client => 
    client.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const filteredBirthdays = birthdayAnalysis?.filter(analysis => 
    analysis.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const stats = {
    total: clientsDebug?.length || 0,
    withBirthday: clientsDebug?.filter(c => c.birth_date).length || 0,
    withoutBirthday: clientsDebug?.filter(c => !c.birth_date).length || 0,
    upcomingBirthdays: birthdayAnalysis?.filter(a => a.is_in_current_week).length || 0,
    withMessages: birthdayAnalysis?.filter(a => a.has_birthday_message).length || 0,
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Debug - Sistema de Aniversários</h1>
          <p className="text-muted-foreground">
            Análise detalhada dos dados de clientes e aniversários
          </p>
        </div>
        <Button onClick={handleForceRefresh} disabled={isLoading || isAnalyzing}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Forçar Atualização
        </Button>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total de Clientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Com Aniversário</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.withBirthday}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Sem Aniversário</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.withoutBirthday}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Próximos 7 Dias</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.upcomingBirthdays}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Com Mensagens</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.withMessages}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Buscar Cliente</Label>
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Digite o nome do cliente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Análise de Aniversários */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Análise Detalhada de Aniversários
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isAnalyzing ? (
            <div className="text-center py-4">Analisando dados de aniversários...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Data Nascimento</TableHead>
                  <TableHead>Idade</TableHead>
                  <TableHead>Próximo Aniversário</TableHead>
                  <TableHead>Dias Restantes</TableHead>
                  <TableHead>Semana Atual</TableHead>
                  <TableHead>Mensagem Enviada</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBirthdays.map((analysis) => (
                  <TableRow key={analysis.id}>
                    <TableCell className="font-medium">{analysis.name}</TableCell>
                    <TableCell>{new Date(analysis.birth_date).toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell>{analysis.age} anos</TableCell>
                    <TableCell>{new Date(analysis.next_birthday).toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell>
                      <Badge variant={analysis.days_until_birthday === 0 ? "default" : analysis.days_until_birthday <= 7 ? "secondary" : "outline"}>
                        {analysis.days_until_birthday === 0 ? "Hoje!" : `${analysis.days_until_birthday} dias`}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {analysis.is_in_current_week ? (
                        <Badge className="bg-blue-100 text-blue-800">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Sim
                        </Badge>
                      ) : (
                        <Badge variant="outline">Não</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {analysis.has_birthday_message ? (
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Enviada
                        </Badge>
                      ) : analysis.is_in_current_week ? (
                        <Badge className="bg-orange-100 text-orange-800">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Pendente
                        </Badge>
                      ) : (
                        <Badge variant="outline">N/A</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Tabela de Clientes com Debug Info */}
      <Card>
        <CardHeader>
          <CardTitle>Dados Brutos dos Clientes</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">Carregando dados...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Data Nascimento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead>Atualizado em</TableHead>
                  <TableHead>Tem Aniversário</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">{client.name}</TableCell>
                    <TableCell>
                      {client.birth_date ? (
                        <span className="text-green-600">
                          {new Date(client.birth_date).toLocaleDateString('pt-BR')}
                        </span>
                      ) : (
                        <span className="text-orange-600">Não informado</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={client.status === 'active' ? 'default' : 'secondary'}>
                        {client.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(client.created_at).toLocaleString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(client.updated_at).toLocaleString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      {client.birth_date ? (
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Sim
                        </Badge>
                      ) : (
                        <Badge className="bg-orange-100 text-orange-800">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Não
                        </Badge>
                      )}
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
}