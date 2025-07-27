import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DatePickerWithRange } from "@/components/ui/date-picker";
import { 
  Shield, 
  Activity, 
  AlertTriangle, 
  Eye, 
  Filter,
  Download,
  Search,
  Users,
  Clock,
  BarChart3
} from 'lucide-react';
import { useContextualAuditLogs, useAuditStatistics, useSecurityMonitoring } from '@/hooks/useAuditSecurity';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function AuditoriaSeguranca() {
  const [filters, setFilters] = useState({
    resource_type: '',
    action_filter: '',
    date_from: '',
    date_to: '',
    limit: 50,
    offset: 0
  });

  const { data: auditLogs, isLoading: logsLoading } = useContextualAuditLogs(true, filters);
  const { data: auditStats, isLoading: statsLoading } = useAuditStatistics();
  const { data: securityData, isLoading: securityLoading } = useSecurityMonitoring();

  const getActionBadgeColor = (action: string) => {
    switch (action.toLowerCase()) {
      case 'create': return 'bg-green-100 text-green-800';
      case 'update': return 'bg-blue-100 text-blue-800';
      case 'delete': return 'bg-red-100 text-red-800';
      case 'login': return 'bg-purple-100 text-purple-800';
      case 'logout': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSecurityLevelColor = (level: string) => {
    switch (level) {
      case 'HIGH': return 'bg-red-100 text-red-800 border-red-200';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'LOW': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { 
        addSuffix: true, 
        locale: ptBR 
      });
    } catch {
      return 'Data inválida';
    }
  };

  if (statsLoading || securityLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <Shield className="h-8 w-8" />
              Auditoria e Segurança
            </h1>
            <p className="text-muted-foreground mt-2">
              Monitoramento de atividades e segurança do sistema
            </p>
          </div>
        </div>

        {/* Estatísticas Principais */}
        {auditStats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Eventos</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{auditStats.total_events}</div>
                <p className="text-xs text-muted-foreground">
                  Todos os eventos registrados
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Eventos Hoje</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{auditStats.events_today}</div>
                <p className="text-xs text-muted-foreground">
                  Atividade do dia
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Esta Semana</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{auditStats.events_this_week}</div>
                <p className="text-xs text-muted-foreground">
                  Eventos da semana
                </p>
              </CardContent>
            </Card>

            {securityData && !securityData.error && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Nível de Segurança</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <Badge className={`text-sm font-bold ${getSecurityLevelColor(securityData.security_level)}`}>
                    {securityData.security_level}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-2">
                    Sessões ativas: {securityData.active_sessions}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Monitoramento de Segurança */}
        {securityData && !securityData.error && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Monitoramento de Segurança
              </CardTitle>
              <CardDescription>
                Dados em tempo real sobre a segurança do sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{securityData.failed_logins_24h}</div>
                  <div className="text-sm text-muted-foreground">Tentativas de login falhadas (24h)</div>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">{securityData.suspicious_ips}</div>
                  <div className="text-sm text-muted-foreground">IPs suspeitos</div>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{securityData.admin_actions_24h}</div>
                  <div className="text-sm text-muted-foreground">Ações administrativas (24h)</div>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{securityData.active_sessions}</div>
                  <div className="text-sm text-muted-foreground">Sessões ativas</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs para diferentes visualizações */}
        <Tabs defaultValue="logs" className="space-y-4">
          <TabsList>
            <TabsTrigger value="logs">Logs de Auditoria</TabsTrigger>
            <TabsTrigger value="statistics">Estatísticas</TabsTrigger>
            <TabsTrigger value="security">Segurança</TabsTrigger>
          </TabsList>

          <TabsContent value="logs" className="space-y-4">
            {/* Filtros */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filtros
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Select
                    value={filters.resource_type}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, resource_type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Tipo de Recurso" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todos</SelectItem>
                      <SelectItem value="clients">Clientes</SelectItem>
                      <SelectItem value="sales">Vendas</SelectItem>
                      <SelectItem value="users">Usuários</SelectItem>
                      <SelectItem value="commissions">Comissões</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={filters.action_filter}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, action_filter: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Ação" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todas</SelectItem>
                      <SelectItem value="CREATE">Criar</SelectItem>
                      <SelectItem value="UPDATE">Atualizar</SelectItem>
                      <SelectItem value="DELETE">Excluir</SelectItem>
                      <SelectItem value="LOGIN">Login</SelectItem>
                    </SelectContent>
                  </Select>

                  <Input
                    type="date"
                    placeholder="Data início"
                    value={filters.date_from}
                    onChange={(e) => setFilters(prev => ({ ...prev, date_from: e.target.value }))}
                  />

                  <Input
                    type="date"
                    placeholder="Data fim"
                    value={filters.date_to}
                    onChange={(e) => setFilters(prev => ({ ...prev, date_to: e.target.value }))}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Tabela de Logs */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Logs de Auditoria
                  </span>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Exportar
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {logsLoading ? (
                  <div className="space-y-2">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-12 bg-gray-200 rounded animate-pulse"></div>
                    ))}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data/Hora</TableHead>
                        <TableHead>Usuário</TableHead>
                        <TableHead>Ação</TableHead>
                        <TableHead>Recurso</TableHead>
                        <TableHead>IP</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {auditLogs?.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="text-sm">
                            {formatDate(log.created_at)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm font-medium">
                                {log.user_id.substring(0, 8)}...
                              </span>
                              {log.user_role && (
                                <Badge variant="outline" className="text-xs">
                                  {log.user_role}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getActionBadgeColor(log.action)}>
                              {log.action}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            {log.table_name}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {log.ip_address || 'N/A'}
                          </TableCell>
                          <TableCell>
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="statistics" className="space-y-4">
            {auditStats?.top_actions && auditStats?.top_users && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Top Ações (7 dias)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {auditStats.top_actions.map((action, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-sm font-medium">{action.action}</span>
                          <Badge variant="outline">{action.count}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Usuários Mais Ativos (7 dias)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {auditStats.top_users.map((user, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            {user.user_id.substring(0, 8)}...
                          </span>
                          <Badge variant="outline">{user.count}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="security" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Configurações de Segurança</CardTitle>
                <CardDescription>
                  Configurações e políticas de segurança do sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center text-muted-foreground py-8">
                    <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p>Configurações de segurança avançadas</p>
                    <p className="text-sm mt-2">
                      Esta seção será expandida com configurações específicas de segurança
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}