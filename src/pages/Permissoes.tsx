import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { PermissionGuard, AccessDenied } from '@/components/PermissionGuard';
import { PermissionCrudGroup } from '@/components/PermissionCrudGroup';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Shield, 
  Users, 
  ShoppingCart, 
  UserCheck, 
  FileText, 
  Building, 
  DollarSign,
  Settings,
  Mail,
  Search,
  Sparkles
} from 'lucide-react';
import { Input } from '@/components/ui/input';

// Módulos e recursos do sistema (formato granular)
const moduleDefinitions = {
  system: {
    name: 'Sistema',
    description: 'Configurações e administração do sistema',
    icon: Settings,
    color: 'text-purple-600',
    resources: {
      permissions: 'Gerenciar Permissões',
      settings: 'Configurações Gerais',
      audit: 'Logs de Auditoria',
    }
  },
  users: {
    name: 'Usuários',
    description: 'Gestão de usuários e colaboradores',
    icon: Users,
    color: 'text-blue-600',
    resources: {
      management: 'Gerenciar Usuários',
      invitations: 'Convites',
      roles: 'Funções e Cargos',
    }
  },
  sales: {
    name: 'Vendas',
    description: 'Gestão do processo de vendas',
    icon: ShoppingCart,
    color: 'text-green-600',
    resources: {
      management: 'Gerenciar Vendas',
      approval: 'Aprovar Vendas',
    }
  },
  clients: {
    name: 'Clientes',
    description: 'Gestão de clientes e prospects',
    icon: UserCheck,
    color: 'text-orange-600',
    resources: {
      management: 'Gerenciar Clientes',
      interactions: 'Interações com Clientes',
    }
  },
  reports: {
    name: 'Relatórios',
    description: 'Relatórios e análises',
    icon: FileText,
    color: 'text-indigo-600',
    resources: {
      view: 'Visualizar Relatórios',
      export: 'Exportar Relatórios',
    }
  },
  offices: {
    name: 'Escritórios',
    description: 'Gestão de escritórios e filiais',
    icon: Building,
    color: 'text-cyan-600',
    resources: {
      management: 'Gerenciar Escritórios',
    }
  },
  commissions: {
    name: 'Comissões',
    description: 'Gestão de comissões e pagamentos',
    icon: DollarSign,
    color: 'text-emerald-600',
    resources: {
      management: 'Gerenciar Comissões',
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

// Interface para permissões granulares
interface GranularPermissions {
  [key: string]: {
    create: boolean;
    read: boolean;
    update: boolean;
    delete: boolean;
  };
}

type RoleType = 'owner' | 'admin' | 'manager' | 'user' | 'viewer';

export default function Permissoes() {
  const { activeTenant } = useAuth();
  const [selectedRole, setSelectedRole] = useState<RoleType>('user');
  const [searchTerm, setSearchTerm] = useState('');
  const [granularPermissions, setGranularPermissions] = useState<GranularPermissions>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  // Carregar permissões granulares da role selecionada
  useEffect(() => {
    const loadRolePermissions = async () => {
      if (!activeTenant?.tenant_id) return;
      
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('tenant_users')
          .select('granular_permissions')
          .eq('tenant_id', activeTenant.tenant_id)
          .eq('role', selectedRole)
          .limit(1)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Erro ao carregar permissões:', error);
          return;
        }

        if (data?.granular_permissions) {
          setGranularPermissions(data.granular_permissions as GranularPermissions);
        } else {
          // Inicializar vazio se não houver permissões
          setGranularPermissions({});
        }
      } catch (error) {
        console.error('Erro ao buscar permissões:', error);
        setGranularPermissions({});
      } finally {
        setIsLoading(false);
      }
    };

    loadRolePermissions();
  }, [selectedRole, activeTenant?.tenant_id]);

  const filteredModules = Object.entries(moduleDefinitions).filter(([moduleKey, module]) =>
    module.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePermissionChange = (moduleKey: string, resource: string, action: 'create' | 'read' | 'update' | 'delete', value: boolean) => {
    const key = `${moduleKey}:${resource}`;
    setGranularPermissions(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        create: prev[key]?.create || false,
        read: prev[key]?.read || false,
        update: prev[key]?.update || false,
        delete: prev[key]?.delete || false,
        [action]: value,
      }
    }));
  };

  const handleRoleChange = (role: RoleType) => {
    setSelectedRole(role);
  };

  const handleSaveRolePermissions = async () => {
    if (!activeTenant?.tenant_id) return;
    
    setIsSaving(true);
    try {
      // Atualizar todas as entradas de tenant_users com essa role
      const { error } = await supabase
        .from('tenant_users')
        .update({ 
          granular_permissions: granularPermissions,
          updated_at: new Date().toISOString()
        })
        .eq('tenant_id', activeTenant.tenant_id)
        .eq('role', selectedRole);

      if (error) throw error;

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
    } finally {
      setIsSaving(false);
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
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-500" />
                Configurar Permissões por Função
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Selecione uma função para configurar suas permissões granulares (CRUD)
              </p>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 mb-4">
                {Object.entries(roleDescriptions).map(([roleKey, role]) => (
                  <Button
                    key={roleKey}
                    variant={selectedRole === roleKey ? "default" : "outline"}
                    onClick={() => handleRoleChange(roleKey as RoleType)}
                    disabled={isLoading}
                  >
                    {role.name}
                  </Button>
                ))}
              </div>
              <Button 
                onClick={handleSaveRolePermissions}
                disabled={isSaving || isLoading}
                className="w-full sm:w-auto"
              >
                {isSaving ? 'Salvando...' : 'Salvar Permissões'}
              </Button>
            </CardContent>
          </Card>

          {/* Módulos de Permissões com CRUD */}
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
                      {Object.entries(module.resources).map(([resourceKey, resourceName]) => {
                        const moduleResourceKey = `${moduleKey}:${resourceKey}`;
                        const permissions = granularPermissions[moduleResourceKey] || {
                          create: false,
                          read: false,
                          update: false,
                          delete: false,
                        };

                        return (
                          <PermissionCrudGroup
                            key={moduleResourceKey}
                            moduleKey={moduleResourceKey}
                            moduleName={resourceName}
                            permissions={permissions}
                            onChange={(action, value) => 
                              handlePermissionChange(moduleKey, resourceKey, action, value)
                            }
                            disabled={isSaving}
                          />
                        );
                      })}
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
