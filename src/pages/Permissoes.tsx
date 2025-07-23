
import React, { useState } from 'react';
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
  Search
} from 'lucide-react';
import { Input } from '@/components/ui/input';

// Dicionário de explicações baseado nas permissões reais do banco
const permissionExplanations = {
  system: {
    name: 'Sistema',
    description: 'Configurações e administração do sistema',
    icon: Settings,
    color: 'text-purple-600',
    permissions: {
      'permissions': {
        name: 'Gerenciar Permissões',
        description: 'Controlar quem pode fazer o que no sistema',
        example: 'Definir se um usuário pode criar vendas ou apenas visualizar',
        actions: {
          'read': 'Ver permissões existentes',
          'write': 'Alterar permissões de usuários e funções',
          'create': 'Criar novas configurações de permissão',
          'delete': 'Remover permissões desnecessárias'
        }
      },
      'settings': {
        name: 'Configurações Gerais',
        description: 'Alterar configurações do sistema',
        example: 'Configurar horários de funcionamento, dados da empresa',
        actions: {
          'read': 'Ver configurações atuais',
          'write': 'Alterar configurações do sistema'
        }
      },
      'audit': {
        name: 'Logs de Auditoria',
        description: 'Visualizar histórico de ações no sistema',
        example: 'Ver quem criou, editou ou excluiu dados',
        actions: {
          'read': 'Visualizar logs de atividades'
        }
      }
    }
  },
  users: {
    name: 'Usuários',
    description: 'Gestão de usuários e colaboradores',
    icon: Users,
    color: 'text-blue-600',
    permissions: {
      'management': {
        name: 'Gerenciar Usuários',
        description: 'Controlar usuários do sistema',
        example: 'Criar conta para novo funcionário, desativar usuário que saiu',
        actions: {
          'create': 'Criar novos usuários',
          'read': 'Ver lista de usuários',
          'update': 'Editar dados de usuários',
          'delete': 'Desativar usuários'
        }
      },
      'invitations': {
        name: 'Convites',
        description: 'Enviar convites para novos usuários',
        example: 'Convidar novo vendedor para se cadastrar no sistema',
        actions: {
          'create': 'Enviar novos convites',
          'read': 'Ver convites enviados',
          'update': 'Reenviar ou cancelar convites',
          'delete': 'Remover convites pendentes'
        }
      },
      'roles': {
        name: 'Funções e Cargos',
        description: 'Definir funções dos usuários',
        example: 'Promover vendedor para gerente, alterar permissões',
        actions: {
          'read': 'Ver funções dos usuários',
          'write': 'Alterar funções e permissões'
        }
      }
    }
  },
  sales: {
    name: 'Vendas',
    description: 'Gestão do processo de vendas',
    icon: ShoppingCart,
    color: 'text-green-600',
    permissions: {
      'management': {
        name: 'Gerenciar Vendas',
        description: 'Controlar todo o processo de vendas',
        example: 'Criar nova venda, editar dados, cancelar venda',
        actions: {
          'create': 'Criar novas vendas',
          'read': 'Ver vendas existentes',
          'update': 'Editar dados das vendas',
          'delete': 'Cancelar ou remover vendas'
        }
      },
      'approval': {
        name: 'Aprovar Vendas',
        description: 'Aprovar ou rejeitar vendas',
        example: 'Aprovar venda para liberar comissão',
        actions: {
          'write': 'Aprovar ou rejeitar vendas'
        }
      },
      'view': {
        name: 'Visualizar Vendas',
        description: 'Ver informações de vendas',
        example: 'Consultar vendas da equipe, relatórios',
        actions: {
          'read': 'Ver todas as vendas do sistema'
        }
      }
    }
  },
  clients: {
    name: 'Clientes',
    description: 'Gestão de clientes e prospects',
    icon: UserCheck,
    color: 'text-orange-600',
    permissions: {
      'management': {
        name: 'Gerenciar Clientes',
        description: 'Controlar dados dos clientes',
        example: 'Cadastrar novo cliente, atualizar contato',
        actions: {
          'create': 'Cadastrar novos clientes',
          'read': 'Ver lista de clientes',
          'update': 'Editar dados dos clientes',
          'delete': 'Remover clientes inativos'
        }
      },
      'interactions': {
        name: 'Interações com Clientes',
        description: 'Registrar contatos e interações',
        example: 'Registrar ligação, agendar reunião',
        actions: {
          'create': 'Registrar novas interações',
          'read': 'Ver histórico de contatos',
          'update': 'Editar interações existentes'
        }
      }
    }
  },
  reports: {
    name: 'Relatórios',
    description: 'Relatórios e análises',
    icon: FileText,
    color: 'text-indigo-600',
    permissions: {
      'view': {
        name: 'Visualizar Relatórios',
        description: 'Acessar relatórios do sistema',
        example: 'Ver relatório de vendas mensais, comissões',
        actions: {
          'read': 'Visualizar todos os relatórios'
        }
      },
      'export': {
        name: 'Exportar Relatórios',
        description: 'Fazer download de relatórios',
        example: 'Baixar relatório em Excel ou PDF',
        actions: {
          'create': 'Gerar e baixar relatórios'
        }
      }
    }
  },
  offices: {
    name: 'Escritórios',
    description: 'Gestão de escritórios e filiais',
    icon: Building,
    color: 'text-cyan-600',
    permissions: {
      'management': {
        name: 'Gerenciar Escritórios',
        description: 'Controlar escritórios da empresa',
        example: 'Criar nova filial, alterar responsável',
        actions: {
          'create': 'Criar novos escritórios',
          'read': 'Ver escritórios existentes',
          'update': 'Editar dados dos escritórios',
          'delete': 'Desativar escritórios'
        }
      }
    }
  },
  commissions: {
    name: 'Comissões',
    description: 'Gestão de comissões e pagamentos',
    icon: DollarSign,
    color: 'text-emerald-600',
    permissions: {
      'management': {
        name: 'Gerenciar Comissões',
        description: 'Controlar pagamento de comissões',
        example: 'Aprovar pagamento, configurar percentuais',
        actions: {
          'create': 'Criar configurações de comissão',
          'read': 'Ver comissões calculadas',
          'update': 'Editar regras de comissão',
          'write': 'Aprovar pagamentos'
        }
      }
    }
  }
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

const actionIcons = {
  create: Plus,
  read: Eye,
  update: Edit,
  delete: Trash2,
  write: Edit,
  approve: CheckCircle
};

export default function Permissoes() {
  const { activeTenant } = useAuth();
  const { 
    allPermissions, 
    isLoading, 
    updateRolePermissions 
  } = usePermissions();
  
  const [selectedRole, setSelectedRole] = useState<string>('user');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  const filteredModules = Object.entries(permissionExplanations).filter(([moduleKey, module]) =>
    module.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    Object.values(module.permissions).some(perm => 
      perm.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const handlePermissionToggle = (permissionId: string) => {
    setSelectedPermissions(prev => 
      prev.includes(permissionId) 
        ? prev.filter(id => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  const handleSaveRolePermissions = async () => {
    try {
      await updateRolePermissions.mutateAsync({
        role: selectedRole,
        permissionIds: selectedPermissions
      });
    } catch (error) {
      console.error('Erro ao salvar permissões:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando permissões...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <PermissionGuard
      permission={{ module: 'system', resource: 'permissions', action: 'read' }}
      fallback={<AccessDenied message="Você não tem permissão para gerenciar permissões do sistema." />}
    >
      <TooltipProvider>
        <div className="container mx-auto py-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Permissões do Sistema</h1>
              <p className="text-muted-foreground">
                Gerencie quem pode fazer o que no sistema de forma clara e organizada
              </p>
            </div>
            <div className="flex gap-2">
              <Button asChild variant="outline">
                <Link to="/convites" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Gerenciar Convites
                </Link>
              </Button>
            </div>
          </div>

          {/* Busca */}
          <div className="flex items-center gap-2 max-w-md">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar módulos ou permissões..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Explicação sobre Funções */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Funções Disponíveis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {Object.entries(roleDescriptions).map(([roleKey, role]) => (
                  <div key={roleKey} className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={role.color}>
                        {role.name}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {role.description}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {role.permissions}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Seletor de Função para Configurar */}
          <Card>
            <CardHeader>
              <CardTitle>Configurar Permissões por Função</CardTitle>
              <p className="text-sm text-muted-foreground">
                Selecione uma função para configurar suas permissões específicas
              </p>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-4">
                {Object.entries(roleDescriptions).map(([roleKey, role]) => (
                  <Button
                    key={roleKey}
                    variant={selectedRole === roleKey ? "default" : "outline"}
                    onClick={() => setSelectedRole(roleKey)}
                  >
                    {role.name}
                  </Button>
                ))}
              </div>
              <Button 
                onClick={handleSaveRolePermissions}
                disabled={updateRolePermissions.isPending}
              >
                {updateRolePermissions.isPending ? 'Salvando...' : 'Salvar Permissões'}
              </Button>
            </CardContent>
          </Card>

          {/* Módulos de Permissões */}
          <div className="grid gap-6">
            {filteredModules.map(([moduleKey, module]) => {
              const IconComponent = module.icon;
              return (
                <Card key={moduleKey}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg bg-muted ${module.color}`}>
                        <IconComponent className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">{module.name}</h3>
                        <p className="text-sm text-muted-foreground font-normal">
                          {module.description}
                        </p>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Object.entries(module.permissions).map(([permKey, permission]) => (
                        <div key={`${moduleKey}-${permKey}`} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h4 className="font-medium flex items-center gap-2">
                                {permission.name}
                                <Tooltip>
                                  <TooltipTrigger>
                                    <Info className="h-4 w-4 text-muted-foreground" />
                                  </TooltipTrigger>
                                  <TooltipContent className="max-w-xs">
                                    <div className="space-y-2">
                                      <p className="font-medium">{permission.description}</p>
                                      <p className="text-xs">
                                        <strong>Exemplo:</strong> {permission.example}
                                      </p>
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              </h4>
                              <p className="text-sm text-muted-foreground mb-2">
                                {permission.description}
                              </p>
                              <p className="text-xs text-muted-foreground italic">
                                💡 {permission.example}
                              </p>
                            </div>
                          </div>
                          
                          <Separator className="my-3" />
                          
                          <div className="space-y-2">
                            <p className="text-sm font-medium">Ações Disponíveis:</p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                              {Object.entries(permission.actions).map(([actionKey, actionDesc]) => {
                                const ActionIcon = actionIcons[actionKey as keyof typeof actionIcons] || Eye;
                                const permissionId = allPermissions.find(p => 
                                  p.module === moduleKey && 
                                  p.resource === permKey && 
                                  p.actions.includes(actionKey)
                                )?.id;
                                
                                return (
                                  <div key={actionKey} className="flex items-center space-x-2">
                                    <Switch
                                      id={`${moduleKey}-${permKey}-${actionKey}`}
                                      checked={permissionId ? selectedPermissions.includes(permissionId) : false}
                                      onCheckedChange={() => permissionId && handlePermissionToggle(permissionId)}
                                    />
                                    <div className="flex items-center gap-1">
                                      <ActionIcon className="h-3 w-3" />
                                      <Tooltip>
                                        <TooltipTrigger>
                                          <label 
                                            htmlFor={`${moduleKey}-${permKey}-${actionKey}`}
                                            className="text-xs cursor-pointer"
                                          >
                                            {actionKey}
                                          </label>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p className="text-xs">{actionDesc}</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Link para Convites */}
          <Card className="border-dashed">
            <CardContent className="pt-6">
              <div className="text-center">
                <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Precisa convidar novos usuários?</h3>
                <p className="text-muted-foreground mb-4">
                  Envie convites para que novos colaboradores possam se cadastrar no sistema
                </p>
                <Button asChild>
                  <Link to="/convites">
                    Gerenciar Convites
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </TooltipProvider>
    </PermissionGuard>
  );
}
