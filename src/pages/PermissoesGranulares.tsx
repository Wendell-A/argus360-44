import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { usePermissions } from '@/hooks/usePermissions';
import { PermissionGuard, AccessDenied } from '@/components/PermissionGuard';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { 
  Shield, 
  Users, 
  ShoppingCart, 
  UserCheck, 
  FileText, 
  Building, 
  DollarSign,
  Settings,
  Info,
  Mail,
  Eye,
  Edit,
  Plus,
  Trash2,
  CheckCircle,
  Search,
  Sparkles
} from 'lucide-react';
import { Input } from '@/components/ui/input';

// Sistema granular de permissões por tela/módulo
const screenPermissions = {
  dashboard: {
    name: 'Dashboard',
    icon: Settings,
    color: 'text-blue-600',
    permissions: ['view_dashboard', 'export_dashboard']
  },
  clients: {
    name: 'Clientes',
    icon: UserCheck,
    color: 'text-orange-600',
    permissions: ['view_clients', 'create_clients', 'edit_clients', 'delete_clients', 'export_clients']
  },
  sales: {
    name: 'Vendas',
    icon: ShoppingCart,
    color: 'text-green-600',
    permissions: ['view_sales', 'create_sales', 'edit_sales', 'delete_sales', 'approve_sales', 'export_sales']
  },
  crm: {
    name: 'CRM / Funil',
    icon: Users,
    color: 'text-purple-600',
    permissions: ['view_crm', 'manage_funnel', 'create_interactions', 'edit_interactions']
  },
  commissions: {
    name: 'Comissões',
    icon: DollarSign,
    color: 'text-emerald-600',
    permissions: ['view_commissions', 'edit_commissions', 'approve_commissions', 'export_commissions']
  },
  reports: {
    name: 'Relatórios',
    icon: FileText,
    color: 'text-indigo-600',
    permissions: ['view_reports', 'export_reports', 'advanced_reports']
  },
  users: {
    name: 'Usuários',
    icon: Users,
    color: 'text-blue-600',
    permissions: ['view_users', 'create_users', 'edit_users', 'delete_users', 'manage_invitations']
  },
  offices: {
    name: 'Escritórios',
    icon: Building,
    color: 'text-cyan-600',
    permissions: ['view_offices', 'create_offices', 'edit_offices', 'delete_offices']
  },
  system: {
    name: 'Sistema',
    icon: Shield,
    color: 'text-red-600',
    permissions: ['manage_permissions', 'view_audit', 'system_settings']
  }
};

const permissionLabels: Record<string, string> = {
  view_dashboard: 'Visualizar Dashboard',
  export_dashboard: 'Exportar Dashboard',
  view_clients: 'Ver Clientes',
  create_clients: 'Criar Clientes',
  edit_clients: 'Editar Clientes',
  delete_clients: 'Excluir Clientes',
  export_clients: 'Exportar Clientes',
  view_sales: 'Ver Vendas',
  create_sales: 'Criar Vendas',
  edit_sales: 'Editar Vendas',
  delete_sales: 'Excluir Vendas',
  approve_sales: 'Aprovar Vendas',
  export_sales: 'Exportar Vendas',
  view_crm: 'Ver CRM',
  manage_funnel: 'Gerenciar Funil',
  create_interactions: 'Criar Interações',
  edit_interactions: 'Editar Interações',
  view_commissions: 'Ver Comissões',
  edit_commissions: 'Editar Comissões',
  approve_commissions: 'Aprovar Comissões',
  export_commissions: 'Exportar Comissões',
  view_reports: 'Ver Relatórios',
  export_reports: 'Exportar Relatórios',
  advanced_reports: 'Relatórios Avançados',
  view_users: 'Ver Usuários',
  create_users: 'Criar Usuários',
  edit_users: 'Editar Usuários',
  delete_users: 'Excluir Usuários',
  manage_invitations: 'Gerenciar Convites',
  view_offices: 'Ver Escritórios',
  create_offices: 'Criar Escritórios',
  edit_offices: 'Editar Escritórios',
  delete_offices: 'Excluir Escritórios',
  manage_permissions: 'Gerenciar Permissões',
  view_audit: 'Ver Auditoria',
  system_settings: 'Configurações do Sistema'
};

const roleDescriptions = {
  owner: {
    name: 'Proprietário',
    description: 'Controle total do sistema',
    color: 'bg-red-100 text-red-800',
    permissions: 'Todas as permissões automaticamente'
  },
  admin: {
    name: 'Administrador',
    description: 'Gestão completa exceto configurações críticas',
    color: 'bg-purple-100 text-purple-800',
    permissions: 'Quase todas as permissões'
  },
  manager: {
    name: 'Gerente',
    description: 'Gestão de vendas e equipes',
    color: 'bg-blue-100 text-blue-800',
    permissions: 'Permissões de gestão e aprovação'
  },
  user: {
    name: 'Usuário',
    description: 'Operações básicas do dia a dia',
    color: 'bg-green-100 text-green-800',
    permissions: 'Permissões básicas de criação e visualização'
  },
  viewer: {
    name: 'Visualizador',
    description: 'Apenas visualização',
    color: 'bg-gray-100 text-gray-800',
    permissions: 'Apenas permissões de leitura'
  }
};

export default function PermissoesGranulares() {
  const { activeTenant } = useAuth();
  const [selectedRole, setSelectedRole] = useState<string>('user');
  const [searchTerm, setSearchTerm] = useState('');
  const [rolePermissions, setRolePermissions] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  // Filtrar módulos baseado na busca
  const filteredScreens = Object.entries(screenPermissions).filter(([screenKey, screen]) =>
    screen.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    screen.permissions.some(perm => 
      permissionLabels[perm]?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  // Carregar permissões da role selecionada
  useEffect(() => {
    // Simular carregamento de permissões da role
    const defaultPermissions: Record<string, boolean> = {};
    
    Object.values(screenPermissions).forEach(screen => {
      screen.permissions.forEach(permission => {
        // Definir permissões padrão baseado na role
        switch (selectedRole) {
          case 'owner':
          case 'admin':
            defaultPermissions[permission] = true;
            break;
          case 'manager':
            defaultPermissions[permission] = !permission.includes('delete') && !permission.includes('system');
            break;
          case 'user':
            defaultPermissions[permission] = permission.includes('view') || permission.includes('create') || permission.includes('edit');
            break;
          case 'viewer':
            defaultPermissions[permission] = permission.includes('view');
            break;
          default:
            defaultPermissions[permission] = false;
        }
      });
    });
    
    setRolePermissions(defaultPermissions);
  }, [selectedRole]);

  const handlePermissionToggle = (permission: string) => {
    setRolePermissions(prev => ({
      ...prev,
      [permission]: !prev[permission]
    }));
  };

  const handleRoleChange = (role: string) => {
    setSelectedRole(role);
  };

  const handleSaveRolePermissions = async () => {
    try {
      // Simular salvamento
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Permissões salvas com sucesso",
        description: `As permissões da função ${roleDescriptions[selectedRole as keyof typeof roleDescriptions]?.name} foram atualizadas.`,
      });
    } catch (error) {
      console.error('Erro ao salvar permissões:', error);
      toast({
        title: "Erro ao salvar permissões",
        description: "Não foi possível salvar as permissões. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const hasConflicts = (permission: string) => {
    // Verificar dependências
    if (permission.includes('edit') && !rolePermissions[permission.replace('edit', 'view')]) {
      return true;
    }
    if (permission.includes('delete') && !rolePermissions[permission.replace('delete', 'view')]) {
      return true;
    }
    if (permission.includes('create') && !rolePermissions[permission.replace('create', 'view')]) {
      return true;
    }
    return false;
  };

  return (
    <PermissionGuard
      permission={{ module: 'system', resource: 'permissions', action: 'read' }}
      fallback={<AccessDenied message="Você não tem permissão para gerenciar permissões do sistema." />}
    >
      <TooltipProvider>
        <div className="container mx-auto py-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Permissões Granulares</h1>
              <p className="text-muted-foreground">
                Configure permissões específicas por tela e funcionalidade
              </p>
            </div>
            <div className="flex gap-2">
              <Button asChild variant="outline">
                <Link to="/permissoes" className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Permissões Clássicas
                </Link>
              </Button>
            </div>
          </div>

          {/* Busca */}
          <div className="flex items-center gap-2 max-w-md">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar telas ou permissões..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Seletor de Função */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-500" />
                Configurar Permissões por Função
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Selecione uma função para configurar suas permissões específicas por tela
              </p>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-4 flex-wrap">
                {Object.entries(roleDescriptions).map(([roleKey, role]) => (
                  <Button
                    key={roleKey}
                    variant={selectedRole === roleKey ? "default" : "outline"}
                    onClick={() => handleRoleChange(roleKey)}
                    className="mb-2"
                  >
                    {role.name}
                  </Button>
                ))}
              </div>
              <Button 
                onClick={handleSaveRolePermissions}
                className="w-full sm:w-auto"
              >
                Salvar Permissões
              </Button>
            </CardContent>
          </Card>

          {/* Permissões por Tela */}
          <div className="grid gap-6">
            {filteredScreens.map(([screenKey, screen]) => {
              const IconComponent = screen.icon;
              return (
                <Card key={screenKey}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg bg-muted ${screen.color}`}>
                        <IconComponent className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">{screen.name}</h3>
                        <p className="text-sm text-muted-foreground font-normal">
                          Controle de acesso e ações disponíveis
                        </p>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {screen.permissions.map((permission) => (
                        <div
                          key={permission}
                          className={`flex items-center justify-between p-3 border rounded-lg ${
                            hasConflicts(permission) ? 'border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-900/30' : ''
                          }`}
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <label
                                htmlFor={`${screenKey}-${permission}`}
                                className="text-sm font-medium cursor-pointer"
                              >
                                {permissionLabels[permission] || permission}
                              </label>
                              {hasConflicts(permission) && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Info className="h-4 w-4 text-orange-500" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Esta permissão requer acesso de visualização</p>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                            </div>
                          </div>
                          <Switch
                            id={`${screenKey}-${permission}`}
                            checked={rolePermissions[permission] || false}
                            onCheckedChange={() => handlePermissionToggle(permission)}
                          />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </TooltipProvider>
    </PermissionGuard>
  );
}