
DOCUMENTAÇÃO COMPLETA - SISTEMA DE CONTROLE DE ACESSO BASEADO EM ROLES (RBAC)
ÍNDICE
Visão Geral do Sistema
Análise do Estado Atual
Arquitetura Proposta
Fases de Implementação
Testes e Validação
Monitoramento e Manutenção
1. VISÃO GERAL DO SISTEMA {#visão-geral}
1.1 Objetivo
Implementar um sistema de controle de acesso baseado em roles (RBAC) que permita diferentes níveis de acesso às funcionalidades do sistema Argus360, garantindo que usuários vejam apenas dados relevantes ao seu nível hierárquico e área de atuação.

1.2 Escopo
13 módulos principais mapeados
5 níveis de acesso definidos (Owner, Admin, Manager, User, Viewer)
Sistema multi-tenant com isolamento de dados
Filtros contextuais baseados em hierarquia organizacional
Interface adaptativa baseada em permissões
1.3 Benefícios Esperados
Segurança: Dados protegidos por nível de acesso
Escalabilidade: Sistema preparado para grandes volumes
Flexibilidade: Permissões customizáveis por tenant
Auditoria: Rastreamento completo de acesso
Performance: Otimização de consultas por contexto
2. ANÁLISE DO ESTADO ATUAL {#análise-atual}
2.1 Estrutura de Roles Existente

// Enums atuais no sistema
type UserRole = 'owner' | 'admin' | 'manager' | 'user' | 'viewer'
2.2 Tabelas de Permissões Atuais
| Tabela | Função | Status | |--------|--------|--------| | permissions | Definições de permissões | ✅ Implementada | | role_permissions | Permissões por role | ✅ Implementada | | user_permissions | Permissões específicas por usuário | ✅ Implementada | | tenant_users | Associação usuário-tenant | ✅ Implementada |

2.3 Telas/Módulos Mapeados
Módulos Principais (Menu Principal)
Dashboard (/dashboard)

Estado atual: Dados globais para todos
Necessidade: Filtrar por contexto do usuário
Vendas (/vendas)

Estado atual: CRUD completo para todos
Necessidade: Filtrar por vendedor/escritório
Clientes (/clientes)

Estado atual: Acesso global
Necessidade: Filtrar por responsável/região
Vendedores (/vendedores)

Estado atual: Listagem completa
Necessidade: Hierarquia organizacional
Comissões (/comissoes)

Estado atual: Todas as comissões visíveis
Necessidade: Filtrar por contexto
Consórcios (/consorcios)

Estado atual: Produtos globais
Necessidade: Configuração por escritório
Simulação (/simulacao-consorcio)

Estado atual: Acesso universal
Necessidade: Logs e auditoria
Relatórios (/relatorios)

Estado atual: Dados globais
Necessidade: Filtros contextuais
Módulos de Gerenciamento (Administrativos)
Escritórios (/escritorios)

Estado atual: Gestão completa
Role necessário: Admin+
Equipes (/equipes)

Estado atual: Gestão completa
Role necessário: Manager+
Departamentos (/departamentos)

Estado atual: Gestão completa
Role necessário: Admin+
Permissões (/permissoes)

Estado atual: Gestão completa
Role necessário: Owner/Admin
Configurações (/configuracoes)

Estado atual: Acesso global
Necessidade: Níveis de configuração
Auditoria (/auditoria)

Estado atual: Logs globais
Role necessário: Admin+
2.4 Hooks e Componentes Atuais
usePermissions: ✅ Implementado
PermissionGuard: ✅ Implementado
AppSidebar: ⚠️ Sem filtros de permissão
Hooks de dados: ⚠️ Sem filtros contextuais
3. ARQUITETURA PROPOSTA {#arquitetura-proposta}
3.1 Hierarquia de Acesso Definida

graph TD
    A[OWNER/CEO] --> B[ADMIN]
    A --> C[MANAGER]
    A --> D[USER/Vendedor]
    A --> E[VIEWER]
    
    B --> C
    B --> D
    B --> E
    
    C --> D
    C --> E
    
    subgraph "Contexto de Dados"
        F[Tenant Completo] --> G[Escritório/Região]
        G --> H[Equipe]
        H --> I[Usuário Individual]
    end
    
    A -.-> F
    B -.-> F
    C -.-> G
    D -.-> I
    E -.-> I
3.2 Matriz de Permissões Detalhada
| Funcionalidade | OWNER | ADMIN | MANAGER | USER | VIEWER | Contexto | |---------------|-------|-------|---------|------|---------|----------| | Dashboard | | | | | | | | - Métricas Globais | ✅ | ✅ | ❌ | ❌ | ❌ | Tenant | | - Métricas Regionais | ✅ | ✅ | ✅ | ❌ | ❌ | Escritório | | - Métricas Pessoais | ✅ | ✅ | ✅ | ✅ | 👁️ | Usuário | | Vendas | | | | | | | | - Criar Vendas | ✅ | ✅ | ✅ | ✅ | ❌ | Contexto | | - Editar Próprias | ✅ | ✅ | ✅ | ✅ | ❌ | Usuário | | - Editar Outras | ✅ | ✅ | ✅ | ❌ | ❌ | Contexto | | - Aprovar Vendas | ✅ | ✅ | ✅ | ❌ | ❌ | Contexto | | - Ver Todas | ✅ | ✅ | ❌ | ❌ | ❌ | Tenant | | - Ver Regionais | ✅ | ✅ | ✅ | ❌ | ❌ | Escritório | | - Ver Próprias | ✅ | ✅ | ✅ | ✅ | 👁️ | Usuário | | Clientes | | | | | | | | - CRUD Global | ✅ | ✅ | ❌ | ❌ | ❌ | Tenant | | - CRUD Regional | ✅ | ✅ | ✅ | ❌ | ❌ | Escritório | | - CRUD Próprios | ✅ | ✅ | ✅ | ✅ | ❌ | Usuário | | - Ver Regionais | ✅ | ✅ | ✅ | 👁️ | 👁️ | Escritório | | Vendedores | | | | | | | | - CRUD Global | ✅ | ✅ | ❌ | ❌ | ❌ | Tenant | | - CRUD Equipe | ✅ | ✅ | ✅ | ❌ | ❌ | Equipe | | - Ver Equipe | ✅ | ✅ | ✅ | 👁️ | 👁️ | Equipe | | Comissões | | | | | | | | - Gerenciar Todas | ✅ | ✅ | ❌ | ❌ | ❌ | Tenant | | - Gerenciar Regionais | ✅ | ✅ | ✅ | ❌ | ❌ | Escritório | | - Ver Próprias | ✅ | ✅ | ✅ | 👁️ | 👁️ | Usuário | | - Aprovar Comissões | ✅ | ✅ | ✅ | ❌ | ❌ | Contexto |

Legenda:

✅ = Acesso completo (CRUD)
👁️ = Apenas visualização
❌ = Sem acesso
Contexto = Baseado na hierarquia do usuário
3.3 Estrutura de Dados Contextuais
3.3.1 Nova Tabela: permission_contexts

CREATE TABLE permission_contexts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  user_id uuid NOT NULL,
  context_type varchar(20) NOT NULL, -- 'office', 'department', 'team'
  context_id uuid NOT NULL, -- ID do escritório, departamento ou equipe
  granted_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  is_active boolean DEFAULT true
);
3.3.2 Atualização da Tabela tenant_users

ALTER TABLE tenant_users 
ADD COLUMN office_id uuid REFERENCES offices(id),
ADD COLUMN department_id uuid REFERENCES departments(id),
ADD COLUMN team_id uuid REFERENCES teams(id),
ADD COLUMN context_level integer DEFAULT 1, -- 1=Global, 2=Office, 3=Team, 4=Individual
ADD COLUMN direct_reports jsonb DEFAULT '[]'::jsonb; -- IDs dos subordinados diretos
4. FASES DE IMPLEMENTAÇÃO {#fases-implementação}
FASE 1: FUNDAÇÃO E ESTRUTURA DE DADOS
Duração estimada: 2-3 semanas

4.1.1 Objetivos da Fase 1
Estabelecer a base de dados para controle contextual
Implementar filtros RLS (Row Level Security) contextuais
Criar funções de apoio para verificação de contexto
4.1.2 Tarefas Detalhadas
4.1.2.1 Criação de Estruturas de Banco

-- 1. Tabela de contextos hierárquicos
CREATE TABLE permission_contexts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  context_type varchar(20) NOT NULL CHECK (context_type IN ('office', 'department', 'team', 'global')),
  context_id uuid, -- Pode ser NULL para contexto global
  granted_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  is_active boolean DEFAULT true,
  CONSTRAINT uk_user_context UNIQUE(tenant_id, user_id, context_type, context_id)
);

-- 2. Funções de verificação de contexto
CREATE OR REPLACE FUNCTION get_user_context_offices(user_uuid uuid, tenant_uuid uuid)
RETURNS uuid[] 
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $$
DECLARE
  user_role user_role;
  office_ids uuid[];
BEGIN
  -- Buscar role do usuário
  SELECT role INTO user_role 
  FROM tenant_users 
  WHERE user_id = user_uuid AND tenant_id = tenant_uuid AND active = true;
  
  -- Owner e Admin veem todos os escritórios
  IF user_role IN ('owner', 'admin') THEN
    SELECT ARRAY(SELECT id FROM offices WHERE tenant_id = tenant_uuid AND active = true)
    INTO office_ids;
    RETURN office_ids;
  END IF;
  
  -- Manager vê apenas escritórios do seu contexto
  IF user_role = 'manager' THEN
    SELECT ARRAY(
      SELECT DISTINCT context_id 
      FROM permission_contexts 
      WHERE user_id = user_uuid 
        AND tenant_id = tenant_uuid 
        AND context_type = 'office' 
        AND is_active = true
    ) INTO office_ids;
    RETURN COALESCE(office_ids, ARRAY[]::uuid[]);
  END IF;
  
  -- User vê apenas seu próprio escritório
  SELECT ARRAY(
    SELECT DISTINCT o.id 
    FROM offices o
    JOIN office_users ou ON ou.office_id = o.id
    WHERE ou.user_id = user_uuid AND o.tenant_id = tenant_uuid
  ) INTO office_ids;
  
  RETURN COALESCE(office_ids, ARRAY[]::uuid[]);
END;
$$;

-- 3. Função para verificar se usuário pode acessar dados de outro usuário
CREATE OR REPLACE FUNCTION can_access_user_data(accessing_user_id uuid, target_user_id uuid, tenant_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $$
DECLARE
  accessing_role user_role;
  target_role user_role;
  accessing_offices uuid[];
  target_offices uuid[];
BEGIN
  -- Se é o mesmo usuário, sempre pode acessar
  IF accessing_user_id = target_user_id THEN
    RETURN true;
  END IF;
  
  -- Buscar roles
  SELECT role INTO accessing_role FROM tenant_users WHERE user_id = accessing_user_id AND tenant_id = tenant_uuid;
  SELECT role INTO target_role FROM tenant_users WHERE user_id = target_user_id AND tenant_id = tenant_uuid;
  
  -- Owner e Admin podem acessar qualquer usuário
  IF accessing_role IN ('owner', 'admin') THEN
    RETURN true;
  END IF;
  
  -- Manager pode acessar usuários do mesmo contexto
  IF accessing_role = 'manager' THEN
    accessing_offices := get_user_context_offices(accessing_user_id, tenant_uuid);
    target_offices := get_user_context_offices(target_user_id, tenant_uuid);
    
    -- Verificar se há interseção nos escritórios
    RETURN accessing_offices && target_offices;
  END IF;
  
  -- User/Viewer não podem acessar dados de outros usuários
  RETURN false;
END;
$$;
4.1.2.2 Atualização das Políticas RLS

-- Atualizar RLS para tabela sales
DROP POLICY IF EXISTS "Users can view sales in their tenants" ON sales;
CREATE POLICY "Users can view sales in their context" 
ON sales FOR SELECT 
USING (
  tenant_id = ANY (get_user_tenant_ids(auth.uid())) AND (
    -- Owner/Admin veem todas
    get_user_role_in_tenant(auth.uid(), tenant_id) IN ('owner', 'admin') OR
    -- Manager vê de seus escritórios
    (get_user_role_in_tenant(auth.uid(), tenant_id) = 'manager' AND 
     office_id = ANY (get_user_context_offices(auth.uid(), tenant_id))) OR
    -- User vê apenas as próprias
    (get_user_role_in_tenant(auth.uid(), tenant_id) IN ('user', 'viewer') AND 
     seller_id = auth.uid())
  )
);

-- Atualizar RLS para tabela clients
DROP POLICY IF EXISTS "Users can view clients in their tenants" ON clients;
CREATE POLICY "Users can view clients in their context" 
ON clients FOR SELECT 
USING (
  tenant_id = ANY (get_user_tenant_ids(auth.uid())) AND (
    -- Owner/Admin veem todos
    get_user_role_in_tenant(auth.uid(), tenant_id) IN ('owner', 'admin') OR
    -- Manager vê de seus escritórios
    (get_user_role_in_tenant(auth.uid(), tenant_id) = 'manager' AND 
     office_id = ANY (get_user_context_offices(auth.uid(), tenant_id))) OR
    -- User vê apenas os próprios
    (get_user_role_in_tenant(auth.uid(), tenant_id) IN ('user', 'viewer') AND 
     responsible_user_id = auth.uid())
  )
);

-- Atualizar RLS para tabela commissions
DROP POLICY IF EXISTS "Users can view commissions in their tenants" ON commissions;
CREATE POLICY "Users can view commissions in their context" 
ON commissions FOR SELECT 
USING (
  tenant_id = ANY (get_user_tenant_ids(auth.uid())) AND (
    -- Owner/Admin veem todas
    get_user_role_in_tenant(auth.uid(), tenant_id) IN ('owner', 'admin') OR
    -- Manager vê de suas vendas/escritórios
    (get_user_role_in_tenant(auth.uid(), tenant_id) = 'manager' AND 
     EXISTS (
       SELECT 1 FROM sales s 
       WHERE s.id = commissions.sale_id 
         AND s.office_id = ANY (get_user_context_offices(auth.uid(), tenant_id))
     )) OR
    -- User vê apenas as próprias
    (get_user_role_in_tenant(auth.uid(), tenant_id) IN ('user', 'viewer') AND 
     (recipient_id = auth.uid() OR 
      EXISTS (
        SELECT 1 FROM sales s 
        WHERE s.id = commissions.sale_id AND s.seller_id = auth.uid()
      )))
  )
);
4.1.2.3 Hooks de Contexto

// src/hooks/useUserContext.ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useUserContext = () => {
  const { user, activeTenant } = useAuth();

  const { data: userContext, isLoading } = useQuery({
    queryKey: ['user-context', user?.id, activeTenant?.tenant_id],
    queryFn: async () => {
      if (!user?.id || !activeTenant?.tenant_id) return null;

      // Buscar contextos do usuário
      const { data: contexts } = await supabase
        .from('permission_contexts')
        .select(`
          *,
          offices:context_id (id, name),
          departments:context_id (id, name),
          teams:context_id (id, name)
        `)
        .eq('user_id', user.id)
        .eq('tenant_id', activeTenant.tenant_id)
        .eq('is_active', true);

      // Buscar informações do usuário no tenant
      const { data: tenantUser } = await supabase
        .from('tenant_users')
        .select('role, office_id, department_id, team_id')
        .eq('user_id', user.id)
        .eq('tenant_id', activeTenant.tenant_id)
        .single();

      return {
        role: tenantUser?.role,
        contexts: contexts || [],
        primaryOffice: tenantUser?.office_id,
        primaryDepartment: tenantUser?.department_id,
        primaryTeam: tenantUser?.team_id,
      };
    },
    enabled: !!user?.id && !!activeTenant?.tenant_id,
  });

  return {
    userContext,
    isLoading,
    isOwner: userContext?.role === 'owner',
    isAdmin: userContext?.role === 'admin',
    isManager: userContext?.role === 'manager',
    isUser: userContext?.role === 'user',
    isViewer: userContext?.role === 'viewer',
  };
};
4.1.3 Critérios de Conclusão da Fase 1
[ ] Tabelas de contexto criadas e populadas
[ ] Funções RLS implementadas e testadas
[ ] Políticas de segurança aplicadas
[ ] Hook de contexto funcionando
[ ] Testes unitários das funções de contexto
FASE 2: MIDDLEWARE E FILTROS DE DADOS
Duração estimada: 2-3 semanas

4.2.1 Objetivos da Fase 2
Implementar middleware de autorização
Atualizar hooks de dados com filtros contextuais
Criar sistema de cache para permissões
4.2.2 Tarefas Detalhadas
4.2.2.1 Middleware de Autorização

// src/lib/authorization/AuthorizationMiddleware.ts
import { useAuth } from '@/contexts/AuthContext';
import { useUserContext } from '@/hooks/useUserContext';

export interface AuthorizationRule {
  module: string;
  resource: string;
  action: string;
  context?: 'global' | 'office' | 'team' | 'self';
  minRole?: UserRole;
}

export class AuthorizationMiddleware {
  private static instance: AuthorizationMiddleware;
  private permissionCache = new Map<string, boolean>();

  static getInstance(): AuthorizationMiddleware {
    if (!AuthorizationMiddleware.instance) {
      AuthorizationMiddleware.instance = new AuthorizationMiddleware();
    }
    return AuthorizationMiddleware.instance;
  }

  async checkPermission(
    userId: string,
    tenantId: string,
    rule: AuthorizationRule,
    resourceId?: string
  ): Promise<boolean> {
    const cacheKey = `${userId}:${tenantId}:${rule.module}:${rule.resource}:${rule.action}:${resourceId || ''}`;
    
    // Verificar cache primeiro
    if (this.permissionCache.has(cacheKey)) {
      return this.permissionCache.get(cacheKey)!;
    }

    try {
      const hasPermission = await this.evaluatePermission(userId, tenantId, rule, resourceId);
      
      // Cache por 5 minutos
      this.permissionCache.set(cacheKey, hasPermission);
      setTimeout(() => this.permissionCache.delete(cacheKey), 5 * 60 * 1000);
      
      return hasPermission;
    } catch (error) {
      console.error('Authorization error:', error);
      return false; // Fail-safe: negar acesso em caso de erro
    }
  }

  private async evaluatePermission(
    userId: string,
    tenantId: string,
    rule: AuthorizationRule,
    resourceId?: string
  ): Promise<boolean> {
    // Buscar role do usuário
    const { data: tenantUser } = await supabase
      .from('tenant_users')
      .select('role')
      .eq('user_id', userId)
      .eq('tenant_id', tenantId)
      .single();

    if (!tenantUser) return false;

    // Owner sempre tem acesso
    if (tenantUser.role === 'owner') return true;

    // Verificar role mínimo
    if (rule.minRole && !this.hasMinimumRole(tenantUser.role, rule.minRole)) {
      return false;
    }

    // Verificar contexto específico
    switch (rule.context) {
      case 'global':
        return tenantUser.role === 'admin';
      
      case 'office':
        return await this.checkOfficeContext(userId, tenantId, resourceId);
      
      case 'team':
        return await this.checkTeamContext(userId, tenantId, resourceId);
      
      case 'self':
        return await this.checkSelfContext(userId, resourceId);
      
      default:
        // Verificar permissões específicas na tabela de permissões
        return await this.checkSpecificPermission(userId, tenantId, rule);
    }
  }

  private hasMinimumRole(userRole: UserRole, minRole: UserRole): boolean {
    const roleHierarchy = {
      owner: 5,
      admin: 4,
      manager: 3,
      user: 2,
      viewer: 1
    };

    return roleHierarchy[userRole] >= roleHierarchy[minRole];
  }

  private async checkOfficeContext(userId: string, tenantId: string, resourceId?: string): Promise<boolean> {
    // Implementar lógica de verificação de contexto de escritório
    if (!resourceId) return false;

    const { data } = await supabase.rpc('get_user_context_offices', {
      user_uuid: userId,
      tenant_uuid: tenantId
    });

    return data?.includes(resourceId) || false;
  }

  private async checkTeamContext(userId: string, tenantId: string, resourceId?: string): Promise<boolean> {
    // Implementar lógica de verificação de contexto de equipe
    // Similar ao checkOfficeContext mas para equipes
    return false; // Placeholder
  }

  private async checkSelfContext(userId: string, resourceId?: string): Promise<boolean> {
    return userId === resourceId;
  }

  private async checkSpecificPermission(userId: string, tenantId: string, rule: AuthorizationRule): Promise<boolean> {
    // Verificar na tabela de permissões específicas
    const { data } = await supabase
      .from('user_permissions')
      .select(`
        permissions (module, resource, actions)
      `)
      .eq('user_id', userId)
      .eq('tenant_id', tenantId);

    return data?.some(up => {
      const perm = up.permissions as any;
      return perm.module === rule.module &&
             perm.resource === rule.resource &&
             perm.actions.includes(rule.action);
    }) || false;
  }

  clearCache(userId?: string): void {
    if (userId) {
      // Limpar apenas cache do usuário específico
      for (const [key] of this.permissionCache) {
        if (key.startsWith(userId)) {
          this.permissionCache.delete(key);
        }
      }
    } else {
      // Limpar todo o cache
      this.permissionCache.clear();
    }
  }
}

// Hook para usar o middleware
export const useAuthorization = () => {
  const { user, activeTenant } = useAuth();
  const middleware = AuthorizationMiddleware.getInstance();

  const checkPermission = async (rule: AuthorizationRule, resourceId?: string): Promise<boolean> => {
    if (!user?.id || !activeTenant?.tenant_id) return false;
    
    return await middleware.checkPermission(
      user.id,
      activeTenant.tenant_id,
      rule,
      resourceId
    );
  };

  return {
    checkPermission,
    clearCache: () => middleware.clearCache(user?.id)
  };
};
4.2.2.2 Atualização dos Hooks de Dados

// src/hooks/useSales.ts - Versão atualizada com filtros contextuais
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUserContext } from '@/hooks/useUserContext';

export const useSales = (filters?: SalesFilters) => {
  const { user, activeTenant } = useAuth();
  const { userContext } = useUserContext();
  const queryClient = useQueryClient();

  const { data: sales, isLoading, error } = useQuery({
    queryKey: ['sales', activeTenant?.tenant_id, userContext?.role, filters],
    queryFn: async () => {
      if (!activeTenant?.tenant_id) return [];

      let query = supabase
        .from('sales')
        .select(`
          *,
          client:clients!inner(*),
          product:consortium_products!inner(*),
          seller:profiles!inner(*),
          office:offices!inner(*)
        `)
        .eq('tenant_id', activeTenant.tenant_id);

      // Aplicar filtros contextuais baseados no role
      if (userContext?.role === 'user' || userContext?.role === 'viewer') {
        // Usuários veem apenas suas próprias vendas
        query = query.eq('seller_id', user?.id);
      } else if (userContext?.role === 'manager') {
        // Managers veem vendas dos escritórios sob sua responsabilidade
        const userOffices = await getUserContextOffices(user?.id!, activeTenant.tenant_id);
        if (userOffices.length > 0) {
          query = query.in('office_id', userOffices);
        } else {
          // Se não tem contexto de escritório, vê apenas suas próprias
          query = query.eq('seller_id', user?.id);
        }
      }
      // Owner e Admin veem todas as vendas (sem filtro adicional)

      // Aplicar filtros adicionais se fornecidos
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.seller_id) {
        query = query.eq('seller_id', filters.seller_id);
      }
      if (filters?.date_from) {
        query = query.gte('sale_date', filters.date_from);
      }
      if (filters?.date_to) {
        query = query.lte('sale_date', filters.date_to);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!activeTenant?.tenant_id && !!userContext?.role,
  });

  // Mutation para criar venda - com validação de contexto
  const createSale = useMutation({
    mutationFn: async (saleData: CreateSaleData) => {
      // Verificar se o usuário pode criar venda para este cliente/escritório
      const canCreate = await checkSaleCreationPermission(saleData);
      if (!canCreate) {
        throw new Error('Você não tem permissão para criar vendas neste contexto');
      }

      const { data, error } = await supabase
        .from('sales')
        .insert({
          ...saleData,
          tenant_id: activeTenant?.tenant_id,
          seller_id: user?.id, // Sempre o usuário logado como vendedor
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
    },
  });

  const updateSale = useMutation({
    mutationFn: async ({ id, ...updateData }: UpdateSaleData) => {
      // Verificar se o usuário pode editar esta venda
      const canEdit = await checkSaleEditPermission(id);
      if (!canEdit) {
        throw new Error('Você não tem permissão para editar esta venda');
      }

      const { data, error } = await supabase
        .from('sales')
        .update(updateData)
        .eq('id', id)
        .eq('tenant_id', activeTenant?.tenant_id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
    },
  });

  // Função auxiliar para verificar permissão de criação
  const checkSaleCreationPermission = async (saleData: CreateSaleData): Promise<boolean> => {
    // User pode criar vendas apenas para seus próprios clientes
    if (userContext?.role === 'user') {
      const { data: client } = await supabase
        .from('clients')
        .select('responsible_user_id')
        .eq('id', saleData.client_id)
        .single();
      
      return client?.responsible_user_id === user?.id;
    }

    // Manager pode criar vendas no contexto de seus escritórios
    if (userContext?.role === 'manager') {
      const userOffices = await getUserContextOffices(user?.id!, activeTenant?.tenant_id!);
      return userOffices.includes(saleData.office_id);
    }

    // Admin e Owner podem criar vendas em qualquer contexto
    return userContext?.role === 'admin' || userContext?.role === 'owner';
  };

  const checkSaleEditPermission = async (saleId: string): Promise<boolean> => {
    const { data: sale } = await supabase
      .from('sales')
      .select('seller_id, office_id, status')
      .eq('id', saleId)
      .single();

    if (!sale) return false;

    // User pode editar apenas suas próprias vendas (se não aprovadas)
    if (userContext?.role === 'user') {
      return sale.seller_id === user?.id && sale.status !== 'approved';
    }

    // Manager pode editar vendas do seu contexto
    if (userContext?.role === 'manager') {
      const userOffices = await getUserContextOffices(user?.id!, activeTenant?.tenant_id!);
      return userOffices.includes(sale.office_id);
    }

    return userContext?.role === 'admin' || userContext?.role === 'owner';
  };

  return {
    sales: sales || [],
    isLoading,
    error,
    createSale,
    updateSale,
    canCreateSale: userContext?.role !== 'viewer',
    canEditSales: userContext?.role !== 'viewer',
  };
};

// Função auxiliar para buscar escritórios do contexto do usuário
const getUserContextOffices = async (userId: string, tenantId: string): Promise<string[]> => {
  const { data } = await supabase.rpc('get_user_context_offices', {
    user_uuid: userId,
    tenant_uuid: tenantId
  });

  return data || [];
};
4.2.3 Critérios de Conclusão da Fase 2
[ ] Middleware de autorização implementado
[ ] Hooks de dados atualizados com filtros contextuais
[ ] Sistema de cache funcionando
[ ] Testes de performance realizados
FASE 3: INTERFACE E NAVEGAÇÃO ADAPTATIVA
Duração estimada: 3-4 semanas

4.3.1 Objetivos da Fase 3
Atualizar AppSidebar com controle de visibilidade
Implementar componentes de proteção em todas as telas
Criar dashboard contextual por role
4.3.2 Tarefas Detalhadas
4.3.2.1 AppSidebar Contextual

// src/components/AppSidebar.tsx - Versão atualizada
import { usePermissions } from '@/hooks/usePermissions';
import { useUserContext } from '@/hooks/useUserContext';
import { PermissionGuard } from '@/components/PermissionGuard';

export function AppSidebar() {
  const { user, activeTenant, signOut } = useAuth();
  const { userContext } = useUserContext();
  const navigate = useNavigate();
  const location = useLocation();

  // Menu principal com permissões
  const menuItems = [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: Home,
      permission: { module: 'dashboard', resource: 'view', action: 'read' },
      minRole: 'viewer'
    },
    {
      title: "Vendas",
      url: "/vendas",
      icon: ShoppingCart,
      permission: { module: 'sales', resource: 'management', action: 'read' },
      minRole: 'user'
    },
    {
      title: "Clientes",
      url: "/clientes",
      icon: Users,
      permission: { module: 'clients', resource: 'management', action: 'read' },
      minRole: 'user'
    },
    {
      title: "Vendedores",
      url: "/vendedores",
      icon: UserCheck,
      permission: { module: 'sellers', resource: 'management', action: 'read' },
      minRole: 'manager'
    },
    {
      title: "Comissões",
      url: "/comissoes",
      icon: DollarSign,
      permission: { module: 'commissions', resource: 'view', action: 'read' },
      minRole: 'user'
    },
    {
      title: "Consórcios",
      url: "/consorcios",
      icon: Target,
      permission: { module: 'products', resource: 'management', action: 'read' },
      minRole: 'user'
    },
    {
      title: "Simulação",
      url: "/simulacao-consorcio",
      icon: Calculator,
      permission: { module: 'simulation', resource: 'use', action: 'read' },
      minRole: 'user'
    },
    {
      title: "Relatórios",
      url: "/relatorios",
      icon: BarChart3,
      permission: { module: 'reports', resource: 'view', action: 'read' },
      minRole: 'user'
    },
  ];

  // Menu de gerenciamento com permissões mais restritivas
  const managementItems = [
    {
      title: "Escritórios",
      url: "/escritorios",
      icon: Building2,
      permission: { module: 'offices', resource: 'management', action: 'read' },
      minRole: 'admin'
    },
    {
      title: "Equipes",
      url: "/equipes",
      icon: Users2,
      permission: { module: 'teams', resource: 'management', action: 'read' },
      minRole: 'manager'
    },
    {
      title: "Departamentos",
      url: "/departamentos",
      icon: Briefcase,
      permission: { module: 'departments', resource: 'management', action: 'read' },
      minRole: 'admin'
    },
    {
      title: "Permissões",
      url: "/permissoes",
      icon: Shield,
      permission: { module: 'permissions', resource: 'management', action: 'read' },
      minRole: 'admin'
    },
    {
      title: "Configurações",
      url: "/configuracoes",
      icon: Settings,
      permission: { module: 'settings', resource: 'management', action: 'read' },
      minRole: 'user'
    },
    {
      title: "Auditoria",
      url: "/auditoria",
      icon: History,
      permission: { module: 'audit', resource: 'view', action: 'read' },
      minRole: 'admin'
    },
  ];

  const hasMinimumRole = (minRole: string): boolean => {
    const roleHierarchy = {
      owner: 5,
      admin: 4,
      manager: 3,
      user: 2,
      viewer: 1
    };

    return roleHierarchy[userContext?.role || 'viewer'] >= roleHierarchy[minRole];
  };

  const isActive = (path: string) => location.pathname === path;

  // Filter menu items based on permissions
  const visibleMenuItems = menuItems.filter(item => hasMinimumRole(item.minRole));
  const visibleManagementItems = managementItems.filter(item => hasMinimumRole(item.minRole));

  return (
    <Sidebar variant="inset">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-4 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Calendar className="h-4 w-4" />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold">Argus360</span>
            <span className="truncate text-xs text-muted-foreground">
              {activeTenant?.tenant_name}
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <PermissionGuard
                    permission={item.permission}
                    fallback={null}
                  >
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(item.url)}
                    >
                      <button
                        onClick={() => navigate(item.url)}
                        className="w-full justify-start"
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </button>
                    </SidebarMenuButton>
                  </PermissionGuard>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {visibleManagementItems.length > 0 && (
          <SidebarGroup>
            <Collapsible defaultOpen className="group/collapsible">
              <SidebarGroupLabel asChild>
                <CollapsibleTrigger className="flex w-full items-center justify-between text-left [&[data-state=open]>svg]:rotate-90">
                  Gerenciamento
                  <ChevronRight className="ml-auto transition-transform duration-200" />
                </CollapsibleTrigger>
              </SidebarGroupLabel>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {visibleManagementItems.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <PermissionGuard
                          permission={item.permission}
                          fallback={null}
                        >
                          <SidebarMenuButton
                            asChild
                            isActive={isActive(item.url)}
                          >
                            <button
                              onClick={() => navigate(item.url)}
                              className="w-full justify-start"
                            >
                              <item.icon className="h-4 w-4" />
                              <span>{item.title}</span>
                            </button>
                          </SidebarMenuButton>
                        </PermissionGuard>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </Collapsible>
          </SidebarGroup>
        )}
      </SidebarContent>

      {/* Footer com indicador de role */}
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="px-2 py-1">
              <div className="text-xs text-muted-foreground mb-1">
                Nível de acesso: 
                <span className="font-medium ml-1 capitalize">
                  {userContext?.role === 'owner' ? 'Proprietário' :
                   userContext?.role === 'admin' ? 'Administrador' :
                   userContext?.role === 'manager' ? 'Gerente' :
                   userContext?.role === 'user' ? 'Usuário' : 'Visualizador'}
                </span>
              </div>
            </div>
            
            <DropdownMenu>
              {/* ... resto do código do dropdown ... */}
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
4.3.2.2 Dashboard Contextual

// src/pages/Dashboard.tsx - Versão contextual
import { useUserContext } from '@/hooks/useUserContext';
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics';

export default function Dashboard() {
  const { userContext } = useUserContext();
  const { metrics, isLoading } = useDashboardMetrics();

  // Definir cards baseados no role
  const getMetricCards = () => {
    const baseCards = [
      {
        title: "Minhas Vendas",
        value: metrics.personalSales?.toString() || "0",
        change: metrics.personalSalesChange || "+0%",
        changeType: "positive" as const,
        icon: TrendingUp,
        visible: true // Sempre visível
      },
      {
        title: "Minhas Comissões",
        value: formatCurrency(metrics.personalCommissions || 0),
        change: metrics.personalCommissionsChange || "+0%",
        changeType: "positive" as const,
        icon: DollarSign,
        visible: true // Sempre visível
      }
    ];

    // Cards para Manager+
    if (['manager', 'admin', 'owner'].includes(userContext?.role || '')) {
      baseCards.push(
        {
          title: "Vendas da Região",
          value: metrics.regionalSales?.toString() || "0",
          change: metrics.regionalSalesChange || "+0%",
          changeType: "positive" as const,
          icon: Target,
          visible: true
        },
        {
          title: "Performance da Equipe",
          value: `${metrics.teamPerformance?.toFixed(0) || 0}%`,
          change: metrics.teamPerformanceChange || "+0%",
          changeType: "positive" as const,
          icon: Users,
          visible: true
        }
      );
    }

    // Cards para Admin+
    if (['admin', 'owner'].includes(userContext?.role || '')) {
      baseCards.push(
        {
          title: "Vendas Globais",
          value: metrics.globalSales?.toString() || "0",
          change: metrics.globalSalesChange || "+0%",
          changeType: "positive" as const,
          icon: BarChart3,
          visible: true
        },
        {
          title: "Receita Total",
          value: formatCurrency(metrics.totalRevenue || 0),
          change: metrics.totalRevenueChange || "+0%",
          changeType: "positive" as const,
          icon: DollarSign,
          visible: true
        }
      );
    }

    return baseCards.filter(card => card.visible);
  };

  const metricCards = getMetricCards();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4 sm:p-6 lg:p-8 xl:p-12 w-full max-w-none">
        {/* Header contextual */}
        <div className="mb-6 lg:mb-8 xl:mb-12">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-gray-900">
            Dashboard
            {userContext?.role === 'user' && ' - Painel Pessoal'}
            {userContext?.role === 'manager' && ' - Painel Gerencial'}
            {['admin', 'owner'].includes(userContext?.role || '') && ' - Painel Executivo'}
          </h1>
          <p className="text-sm sm:text-base lg:text-lg text-gray-600 mt-1">
            {userContext?.role === 'user' && 'Acompanhe suas vendas e performance'}
            {userContext?.role === 'manager' && 'Visão geral da sua região e equipe'}
            {['admin', 'owner'].includes(userContext?.role || '') && 'Visão completa do negócio'}
          </p>
        </div>

        {/* Metrics Grid - Adaptável ao contexto */}
        <div className={`grid gap-4 lg:gap-6 xl:gap-8 mb-6 lg:mb-8 xl:mb-12 ${
          metricCards.length <= 2 ? 'grid-cols-1 sm:grid-cols-2' :
          metricCards.length <= 4 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4' :
          'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6'
        }`}>
          {metricCards.map((card, index) => (
            <MetricCard
              key={index}
              title={card.title}
              value={card.value}
              change={card.change}
              changeType={card.changeType}
              icon={card.icon}
            />
          ))}
        </div>

        {/* Charts contextuais */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 lg:gap-6 xl:gap-8 mb-6 lg:mb-8 xl:mb-12">
          {/* Gráfico principal - contextual */}
          <Card className="xl:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg lg:text-xl">
                <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6" />
                {userContext?.role === 'user' && 'Minhas Vendas'}
                {userContext?.role === 'manager' && 'Vendas da Região'}
                {['admin', 'owner'].includes(userContext?.role || '') && 'Vendas vs Meta'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 sm:h-80 lg:h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={metrics.chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="vendas" fill="#3b82f6" name="Vendas" />
                    {(['admin', 'owner'].includes(userContext?.role || '')) && (
                      <Bar dataKey="meta" fill="#e5e7eb" name="Meta" />
                    )}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Gráfico secundário - sempre contextual */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg lg:text-xl">
                <Activity className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6" />
                Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 sm:h-80 lg:h-96">
                {metrics.performanceData && metrics.performanceData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={metrics.performanceData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {metrics.performanceData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    {userContext?.role === 'user' ? 'Realize mais vendas para ver sua performance' :
                     'Sem dados de performance para exibir'}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabela de ações rápidas - contextual */}
        <PermissionGuard
          permission={{ module: 'dashboard', resource: 'quick_actions', action: 'read' }}
          fallback={null}
        >
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg lg:text-xl">
                <Calendar className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6" />
                Ações Rápidas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button
                  variant="outline"
                  className="h-20 flex-col"
                  onClick={() => navigate('/vendas/nova')}
                >
                  <ShoppingCart className="h-6 w-6 mb-2" />
                  Nova Venda
                </Button>
                
                <Button
                  variant="outline"
                  className="h-20 flex-col"
                  onClick={() => navigate('/clientes/novo')}
                >
                  <Users className="h-6 w-6 mb-2" />
                  Novo Cliente
                </Button>

                {(['manager', 'admin', 'owner'].includes(userContext?.role || '')) && (
                  <Button
                    variant="outline"
                    className="h-20 flex-col"
                    onClick={() => navigate('/relatorios')}
                  >
                    <BarChart3 className="h-6 w-6 mb-2" />
                    Relatórios
                  </Button>
                )}

                <Button
                  variant="outline"
                  className="h-20 flex-col"
                  onClick={() => navigate('/simulacao-consorcio')}
                >
                  <Calculator className="h-6 w-6 mb-2" />
                  Simulação
                </Button>
              </div>
            </CardContent>
          </Card>
        </PermissionGuard>
      </div>
    </div>
  );
}
4.3.3 Critérios de Conclusão da Fase 3
[ ] AppSidebar contextual implementado
[ ] Dashboard adaptativo por role funcionando
[ ] Todas as telas com PermissionGuard
[ ] Testes de navegação por role
FASE 4: SEGURANÇA E AUDITORIA
Duração estimada: 2-3 semanas

4.4.1 Objetivos da Fase 4
Implementar sistema de auditoria completo
Adicionar logs de segurança
Criar alertas automáticos
4.4.2 Tarefas Detalhadas
4.4.2.1 Sistema de Auditoria Aprimorado

-- Atualizar tabela audit_log com mais contexto
ALTER TABLE audit_log 
ADD COLUMN permission_context jsonb DEFAULT '{}'::jsonb,
ADD COLUMN access_denied boolean DEFAULT false,
ADD COLUMN security_level varchar(20) DEFAULT 'normal',
ADD COLUMN role_at_time varchar(20),
ADD COLUMN office_context uuid,
ADD COLUMN team_context uuid;

-- Função melhorada para auditoria
CREATE OR REPLACE FUNCTION enhanced_audit_trigger()
RETURNS TRIGGER AS $$
DECLARE
  user_context jsonb;
  current_role user_role;
BEGIN
  -- Buscar contexto atual do usuário
  SELECT to_jsonb(tu.*) INTO user_context
  FROM tenant_users tu
  WHERE tu.user_id = auth.uid() 
    AND tu.tenant_id = COALESCE(NEW.tenant_id, OLD.tenant_id)
    AND tu.active = true;

  -- Extrair role atual
  current_role := (user_context->>'role')::user_role;

  -- Inserir log de auditoria
  INSERT INTO audit_log (
    table_name,
    record_id,
    action,
    old_values,
    new_values,
    user_id,
    tenant_id,
    ip_address,
    user_agent,
    role_at_time,
    permission_context,
    security_level
  ) VALUES (
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    TG_OP,
    CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END,
    auth.uid(),
    COALESCE(NEW.tenant_id, OLD.tenant_id),
    inet_client_addr(),
    current_setting('request.headers', true)::jsonb->>'user-agent',
    current_role,
    user_context,
    CASE 
      WHEN TG_TABLE_NAME IN ('permissions', 'role_permissions', 'user_permissions') THEN 'high'
      WHEN TG_TABLE_NAME IN ('sales', 'commissions') AND TG_OP = 'UPDATE' THEN 'medium'
      ELSE 'normal'
    END
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
4.4.2.2 Sistema de Alertas de Segurança

// src/lib/security/SecurityMonitor.ts
export class SecurityMonitor {
  private static instance: SecurityMonitor;
  private alertThresholds = {
    accessDeniedPerHour: 10,
    permissionChangesPerDay: 5,
    suspiciousPatterns: ['multiple_roles', 'escalation_attempt', 'bulk_access']
  };

  static getInstance(): SecurityMonitor {
    if (!SecurityMonitor.instance) {
      SecurityMonitor.instance = new SecurityMonitor();
    }
    return SecurityMonitor.instance;
  }

  async logAccessAttempt(
    userId: string,
    resource: string,
    action: string,
    granted: boolean,
    context?: any
  ): Promise<void> {
    try {
      // Log na tabela de auditoria
      await supabase.from('audit_log').insert({
        table_name: 'security_access',
        action: granted ? 'ACCESS_GRANTED' : 'ACCESS_DENIED',
        user_id: userId,
        new_values: {
          resource,
          action,
          granted,
          context,
          timestamp: new Date().toISOString()
        },
        access_denied: !granted,
        security_level: granted ? 'normal' : 'medium'
      });

      // Verificar padrões suspeitos se acesso negado
      if (!granted) {
        await this.checkSuspiciousActivity(userId);
      }
    } catch (error) {
      console.error('Error logging access attempt:', error);
    }
  }

  private async checkSuspiciousActivity(userId: string): Promise<void> {
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);

    // Contar tentativas de acesso negado na última hora
    const { count } = await supabase
      .from('audit_log')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('access_denied', true)
      .gte('created_at', oneHourAgo.toISOString());

    if (count && count >= this.alertThresholds.accessDeniedPerHour) {
      await this.triggerSecurityAlert('HIGH_ACCESS_DENIED_FREQUENCY', {
        userId,
        count,
        timeWindow: '1 hour'
      });
    }
  }

  private async triggerSecurityAlert(type: string, data: any): Promise<void> {
    // Implementar notificação para administradores
    const alert = {
      type,
      severity: 'HIGH',
      data,
      timestamp: new Date().toISOString()
    };

    // Salvar alerta
    await supabase.from('security_alerts').insert(alert);

    // Notificar administradores (implementar conforme necessário)
    console.warn('SECURITY ALERT:', alert);
  }

  async generateSecurityReport(tenantId: string, period: 'day' | 'week' | 'month'): Promise<any> {
    const startDate = new Date();
    switch (period) {
      case 'day':
        startDate.setDate(startDate.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
    }

    const { data: auditLogs } = await supabase
      .from('audit_log')
      .select('*')
      .eq('tenant_id', tenantId)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false });

    return {
      period,
      totalActions: auditLogs?.length || 0,
      accessDenied: auditLogs?.filter(log => log.access_denied).length || 0,
      highSecurityActions: auditLogs?.filter(log => log.security_level === 'high').length || 0,
      uniqueUsers: new Set(auditLogs?.map(log => log.user_id)).size,
      topActions: this.getTopActions(auditLogs || []),
      suspiciousActivity: auditLogs?.filter(log => 
        log.access_denied && log.security_level === 'high'
      ) || []
    };
  }

  private getTopActions(logs: any[]): any[] {
    const actionCounts = logs.reduce((acc, log) => {
      const key = `${log.table_name}:${log.action}`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(actionCounts)
      .map(([action, count]) => ({ action, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }
}

// Hook para usar o monitor de segurança
export const useSecurityMonitor = () => {
  const monitor = SecurityMonitor.getInstance();
  const { user, activeTenant } = useAuth();

  const logAccess = async (resource: string, action: string, granted: boolean, context?: any) => {
    if (user?.id) {
      await monitor.logAccessAttempt(user.id, resource, action, granted, context);
    }
  };

  const generateReport = async (period: 'day' | 'week' | 'month' = 'week') => {
    if (!activeTenant?.tenant_id) return null;
    return await monitor.generateSecurityReport(activeTenant.tenant_id, period);
  };

  return {
    logAccess,
    generateReport
  };
};
4.4.3 Critérios de Conclusão da Fase 4
[ ] Sistema de auditoria completo
[ ] Alertas de segurança funcionando
[ ] Relatórios de segurança implementados
[ ] Monitoramento em tempo real ativo
FASE 5: OTIMIZAÇÃO E REFINAMENTOS
Duração estimada: 2-3 semanas

4.5.1 Objetivos da Fase 5
Otimizar performance das consultas
Implementar cache inteligente
Criar interface administrativa de permissões
Documentação final e treinamento
4.5.2 Tarefas Detalhadas
4.5.2.1 Otimização de Performance

-- Views otimizadas para consultas frequentes
CREATE MATERIALIZED VIEW user_permission_summary AS
SELECT 
  tu.user_id,
  tu.tenant_id,
  tu.role,
  tu.office_id,
  tu.department_id,
  tu.team_id,
  array_agg(DISTINCT p.module) as accessible_modules,
  array_agg(DISTINCT p.resource) as accessible_resources,
  count(DISTINCT rp.permission_id) as role_permissions_count,
  count(DISTINCT up.permission_id) as user_permissions_count
FROM tenant_users tu
LEFT JOIN role_permissions rp ON rp.role = tu.role AND rp.tenant_id = tu.tenant_id
LEFT JOIN user_permissions up ON up.user_id = tu.user_id AND up.tenant_id = tu.tenant_id
LEFT JOIN permissions p ON p.id = COALESCE(rp.permission_id, up.permission_id)
WHERE tu.active = true
GROUP BY tu.user_id, tu.tenant_id, tu.role, tu.office_id, tu.department_id, tu.team_id;

-- Índices para otimização
CREATE INDEX CONCURRENTLY idx_audit_log_user_tenant_time 
ON audit_log (user_id, tenant_id, created_at DESC);

CREATE INDEX CONCURRENTLY idx_permission_contexts_user_tenant_active 
ON permission_contexts (user_id, tenant_id, is_active) 
WHERE is_active = true;

CREATE INDEX CONCURRENTLY idx_sales_contextual 
ON sales (tenant_id, seller_id, office_id, status, sale_date DESC);

-- Função otimizada para verificação rápida de permissões
CREATE OR REPLACE FUNCTION quick_permission_check(
  user_uuid uuid,
  tenant_uuid uuid,
  module_name varchar,
  resource_name varchar,
  action_name varchar
)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_permission_summary ups
    WHERE ups.user_id = user_uuid 
      AND ups.tenant_id = tenant_uuid
      AND (
        ups.role = 'owner' OR
        module_name = ANY(ups.accessible_modules)
      )
  );
$$;
4.5.2.2 Interface Administrativa de Permissões

// src/pages/PermissionManagement.tsx
import { useState } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { useUsers } from '@/hooks/useUsers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';

export default function PermissionManagement() {
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  
  const { allPermissions, updateRolePermissions, grantUserPermission } = usePermissions();
  const { users } = useUsers();

  const roleHierarchy = {
    owner: { level: 5, label: 'Proprietário', color: 'destructive' },
    admin: { level: 4, label: 'Administrador', color: 'default' },
    manager: { level: 3, label: 'Gerente', color: 'secondary' },
    user: { level: 2, label: 'Usuário', color: 'outline' },
    viewer: { level: 1, label: 'Visualizador', color: 'outline' }
  };

  const permissionMatrix = [
    {
      module: 'Dashboard',
      permissions: [
        { resource: 'view', actions: ['read'], roles: ['viewer', 'user', 'manager', 'admin', 'owner'] },
        { resource: 'metrics', actions: ['read'], roles: ['manager', 'admin', 'owner'] },
        { resource: 'global_metrics', actions: ['read'], roles: ['admin', 'owner'] }
      ]
    },
    {
      module: 'Sales',
      permissions: [
        { resource: 'own', actions: ['read', 'write'], roles: ['user', 'manager', 'admin', 'owner'] },
        { resource: 'team', actions: ['read', 'write'], roles: ['manager', 'admin', 'owner'] },
        { resource: 'global', actions: ['read', 'write'], roles: ['admin', 'owner'] },
        { resource: 'approve', actions: ['write'], roles: ['manager', 'admin', 'owner'] }
      ]
    },
    {
      module: 'Clients',
      permissions: [
        { resource: 'own', actions: ['read', 'write'], roles: ['user', 'manager', 'admin', 'owner'] },
        { resource: 'team', actions: ['read', 'write'], roles: ['manager', 'admin', 'owner'] },
        { resource: 'global', actions: ['read', 'write'], roles: ['admin', 'owner'] }
      ]
    },
    {
      module: 'Commissions',
      permissions: [
        { resource: 'own', actions: ['read'], roles: ['user', 'manager', 'admin', 'owner'] },
        { resource: 'team', actions: ['read', 'write'], roles: ['manager', 'admin', 'owner'] },
        { resource: 'global', actions: ['read', 'write'], roles: ['admin', 'owner'] },
        { resource: 'approve', actions: ['write'], roles: ['manager', 'admin', 'owner'] }
      ]
    },
    {
      module: 'Management',
      permissions: [
        { resource: 'offices', actions: ['read', 'write'], roles: ['admin', 'owner'] },
        { resource: 'teams', actions: ['read', 'write'], roles: ['manager', 'admin', 'owner'] },
        { resource: 'users', actions: ['read', 'write'], roles: ['admin', 'owner'] },
        { resource: 'permissions', actions: ['read', 'write'], roles: ['owner'] }
      ]
    }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gerenciamento de Permissões</h1>
          <p className="text-muted-foreground">Configure permissões por role e usuário</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Painel de Roles */}
        <Card>
          <CardHeader>
            <CardTitle>Níveis de Acesso</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(roleHierarchy).map(([role, config]) => (
              <div
                key={role}
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                  selectedRole === role ? 'bg-primary/10 border-primary' : 'hover:bg-muted'
                }`}
                onClick={() => setSelectedRole(role)}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{config.label}</span>
                  <Badge variant={config.color as any}>
                    Nível {config.level}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {role === 'owner' && 'Acesso total ao sistema'}
                  {role === 'admin' && 'Gestão administrativa completa'}
                  {role === 'manager' && 'Gestão de equipes e regiões'}
                  {role === 'user' && 'Operações de vendas'}
                  {role === 'viewer' && 'Apenas visualização'}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Matriz de Permissões */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>
              Matriz de Permissões
              {selectedRole && ` - ${roleHierarchy[selectedRole].label}`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Módulo</TableHead>
                    <TableHead>Recurso</TableHead>
                    <TableHead>Ações</TableHead>
                    <TableHead>Permissão</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {permissionMatrix.map((module) =>
                    module.permissions.map((perm, index) => (
                      <TableRow key={`${module.module}-${index}`}>
                        {index === 0 && (
                          <TableCell rowSpan={module.permissions.length} className="font-medium">
                            {module.module}
                          </TableCell>
                        )}
                        <TableCell>{perm.resource}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {perm.actions.map(action => (
                              <Badge key={action} variant="outline" className="text-xs">
                                {action}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              selectedRole && perm.roles.includes(selectedRole) 
                                ? 'default' 
                                : 'secondary'
                            }
                          >
                            {selectedRole && perm.roles.includes(selectedRole) 
                              ? 'Permitido' 
                              : 'Negado'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Painel de Usuários */}
      <Card>
        <CardHeader>
          <CardTitle>Usuários e Permissões Especiais</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Role Padrão</TableHead>
                  <TableHead>Escritório</TableHead>
                  <TableHead>Permissões Especiais</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{user.full_name}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={roleHierarchy[user.role]?.color as any}>
                        {roleHierarchy[user.role]?.label}
                      </Badge>
                    </TableCell>
                    <TableCell>{user.office_name || 'Não definido'}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {user.special_permissions_count || 0} especiais
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedUser(user.id)}
                      >
                        Gerenciar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
4.5.3 Critérios de Conclusão da Fase 5
[ ] Performance otimizada
[ ] Interface administrativa completa
[ ] Cache inteligente implementado
[ ] Documentação final criada
[ ] Treinamento da equipe realizado
5. TESTES E VALIDAÇÃO {#testes-validação}
5.1 Cenários de Teste por Role
5.1.1 Testes de Owner

describe('Owner Role Tests', () => {
  test('should access all modules', async () => {
    // Testar acesso a todos os módulos do sistema
  });
  
  test('should see global data', async () => {
    // Verificar se vê dados de todos os escritórios
  });
  
  test('should manage all permissions', async () => {
    // Testar gestão de permissões
  });
});
5.1.2 Testes de Manager

describe('Manager Role Tests', () => {
  test('should see only regional data', async () => {
    // Verificar filtros por escritório/região
  });
  
  test('should not access admin functions', async () => {
    // Verificar restrições de acesso
  });
});
5.1.3 Testes de User

describe('User Role Tests', () => {
  test('should see only own data', async () => {
    // Verificar isolamento de dados
  });
  
  test('should not edit others data', async () => {
    // Testar restrições de edição
  });
});
5.2 Testes de Segurança
Tentativas de escalação de privilégios
Bypass de filtros RLS
Manipulação de URLs
Testes de injection
5.3 Testes de Performance
Consultas com grandes volumes
Cache hit ratio
Tempo de resposta por role
Consumo de memória
6. MONITORAMENTO E MANUTENÇÃO {#monitoramento}
6.1 KPIs de Segurança
Tentativas de acesso negado/dia
Tempo médio de autenticação
Logs de auditoria por usuário
Padrões anômalos de acesso
6.2 Manutenção Programada
Limpeza de logs antigos (>90 dias)
Atualização de cache de permissões
Revisão trimestral de roles
Auditoria semestral de acessos
6.3 Alertas Automáticos
Múltiplas tentativas de acesso negado
Modificações em permissões críticas
Acessos em horários anômalos
Padrões suspeitos de navegação
7. CRONOGRAMA CONSOLIDADO
| Fase | Duração | Marco Principal | Entregáveis | |------|---------|----------------|-------------| | Fase 1 | 2-3 semanas | Fundação de Dados | Estruturas RLS, Funções, Hooks contextuais | | Fase 2 | 2-3 semanas | Middleware e Filtros | Autorização, Hooks atualizados, Cache | | Fase 3 | 3-4 semanas | Interface Adaptativa | Sidebar contextual, Dashboard, Proteções | | Fase 4 | 2-3 semanas | Segurança e Auditoria | Logs avançados, Alertas, Relatórios | | Fase 5 | 2-3 semanas | Otimização Final | Performance, Interface admin, Documentação |

Duração Total Estimada: 11-16 semanas (2,5 a 4 meses)

8. RECURSOS NECESSÁRIOS
8.1 Equipe Técnica
1 Desenvolvedor Senior (Full-stack)
1 Desenvolvedor Pleno (Frontend)
1 DBA/DevOps
1 QA/Tester
8.2 Ferramentas e Infraestrutura
Ambiente de desenvolvimento isolado
Ferramentas de monitoramento
Sistema de backup diferenciado
Documentação técnica atualizada
Esta documentação serve como guia completo para implementação do sistema RBAC no Argus360, garantindo segurança, escalabilidade e facilidade de manutenção.