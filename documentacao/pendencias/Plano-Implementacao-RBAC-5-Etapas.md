# PLANO DE IMPLEMENTAÇÃO RBAC - SISTEMA ARGUS360
## 5 ETAPAS DE EXECUÇÃO

**Data de Criação:** 26/01/2025 15:45  
**Status:** Em Análise  
**Prioridade:** Alta  

---

## ANÁLISE PRELIMINAR DO SISTEMA ATUAL

### 🟢 COMPATIBILIDADES IDENTIFICADAS

1. **Estrutura de Banco Adequada:**
   - Tabelas `tenant_users`, `permissions`, `role_permissions`, `user_permissions` já implementadas
   - Funções `get_user_tenant_ids()`, `get_user_role_in_tenant()` funcionais
   - RLS policies básicas implementadas em todas as tabelas

2. **Sistema de Autenticação Robusto:**
   - AuthContext com suporte multi-tenant
   - Hook `usePermissions` funcional com verificações básicas
   - Componente `PermissionGuard` disponível

3. **Estrutura Frontend Preparada:**
   - AppSidebar organizado com grupos de menus
   - Hooks de dados usando React Query
   - Sistema de rotas protegidas implementado

### ⚠️ GAPS IDENTIFICADOS

1. **Falta de Contexto Hierárquico:**
   - Não há filtros contextuais por office/department/team
   - RLS policies são apenas tenant-level, não hierárquicas
   - Dados mostrados globalmente para todos os usuários

2. **Interface Não Adaptativa:**
   - AppSidebar não filtra menus por permissão
   - Todos os usuários veem todas as opções
   - Ausência de verificações de role na UI

3. **Dados Sem Segregação:**
   - Hooks não aplicam filtros contextuais
   - Usuários veem dados de outros usuários/escritórios
   - Falta controle granular de acesso

---

## PLANO DE 5 ETAPAS

### 🏗️ ETAPA 1: FUNDAÇÃO DE CONTEXTOS (2 semanas)
**Objetivo:** Criar infraestrutura de dados para controle hierárquico

#### 1.1 Migração de Banco
```sql
-- Criar tabela de contextos de permissão
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

-- Atualizar tenant_users com campos contextuais
ALTER TABLE tenant_users 
ADD COLUMN office_id uuid REFERENCES offices(id),
ADD COLUMN department_id uuid REFERENCES departments(id),
ADD COLUMN team_id uuid REFERENCES teams(id),
ADD COLUMN context_level integer DEFAULT 1; -- 1=Global, 2=Office, 3=Team, 4=Individual
```

#### 1.2 Funções de Contexto
```sql
-- Função para obter escritórios que o usuário pode acessar
CREATE OR REPLACE FUNCTION get_user_context_offices(user_uuid uuid, tenant_uuid uuid)
RETURNS uuid[] 
LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Função para verificar acesso a dados de outro usuário
CREATE OR REPLACE FUNCTION can_access_user_data(accessing_user_id uuid, target_user_id uuid, tenant_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER;
```

#### 1.3 Hook de Contexto
```typescript
// src/hooks/useUserContext.ts
export const useUserContext = () => {
  // Buscar contextos do usuário
  // Retornar office_ids, department_ids, team_ids acessíveis
  // Calcular nível de permissão (global, office, team, individual)
};
```

**Entregáveis:**
- [ ] Migração de banco executada
- [ ] Funções de contexto implementadas
- [ ] Hook useUserContext funcional
- [ ] Testes unitários das funções

---

### 🔐 ETAPA 2: POLÍTICAS RLS CONTEXTUAIS (2 semanas)
**Objetivo:** Implementar Row Level Security baseada em hierarquia

#### 2.1 RLS para Tabelas Principais
```sql
-- Sales: usuários veem apenas vendas do seu contexto
CREATE POLICY "Users can view sales in their context" 
ON sales FOR SELECT USING (
  tenant_id = ANY (get_user_tenant_ids(auth.uid())) AND (
    get_user_role_in_tenant(auth.uid(), tenant_id) IN ('owner', 'admin') OR
    (get_user_role_in_tenant(auth.uid(), tenant_id) = 'manager' AND 
     office_id = ANY (get_user_context_offices(auth.uid(), tenant_id))) OR
    (get_user_role_in_tenant(auth.uid(), tenant_id) IN ('user', 'viewer') AND 
     seller_id = auth.uid())
  )
);

-- Clients: filtro por responsável/escritório
-- Commissions: filtro por contexto de vendas
-- Vendedores: filtro por hierarquia
```

#### 2.2 Middleware de Autorização
```typescript
// src/lib/authorization/AuthorizationMiddleware.ts
export class AuthorizationMiddleware {
  async checkPermission(userId: string, tenantId: string, rule: AuthorizationRule): Promise<boolean>
  private async evaluatePermission(): Promise<boolean>
  private async checkOfficeContext(): Promise<boolean>
  private async checkTeamContext(): Promise<boolean>
}
```

**Entregáveis:**
- [ ] Políticas RLS atualizadas para todas as tabelas
- [ ] Middleware de autorização implementado
- [ ] Hook useAuthorization funcional
- [ ] Testes de segurança executados

---

### 📊 ETAPA 3: HOOKS DE DADOS CONTEXTUAIS (2 semanas)
**Objetivo:** Atualizar hooks para aplicar filtros hierárquicos

#### 3.1 Hooks Atualizados
```typescript
// src/hooks/useSales.ts
export const useSales = (filters?: SalesFilters) => {
  const { userContext } = useUserContext();
  
  // Aplicar filtros baseados no contexto do usuário
  const contextualFilters = {
    ...filters,
    office_ids: userContext.accessibleOffices,
    seller_ids: userContext.accessibleSellers
  };
};

// Similarmente para:
// - useClients.ts
// - useCommissions.ts 
// - useVendedores.ts
// - useDashboardStats.ts
```

#### 3.2 Componentes de Filtro
```typescript
// src/components/ContextualFilters.tsx
export const ContextualFilters = ({ onFilterChange }: ContextualFiltersProps) => {
  // Renderizar filtros baseados no contexto do usuário
  // Owner/Admin: todos os filtros
  // Manager: apenas seus escritórios/equipes
  // User: apenas filtros próprios
};
```

**Entregáveis:**
- [ ] Todos os hooks principais atualizados
- [ ] Componentes de filtro contextuais
- [ ] Testes de integração dos hooks
- [ ] Performance otimizada com cache

---

### 🎨 ETAPA 4: INTERFACE ADAPTATIVA (1.5 semanas)
**Objetivo:** Adaptar UI baseada em permissões e contexto

#### 4.1 AppSidebar Dinâmico
```typescript
// src/components/AppSidebar.tsx
const getVisibleMenuItems = (userRole: string, permissions: Permission[]) => {
  const roleMenuMap = {
    owner: [...allMenuItems, ...managementItems, ...configItems],
    admin: [...allMenuItems, ...managementItems, ...configItems],
    manager: [...allMenuItems, ...filterManagementItems(), ...filterConfigItems()],
    user: [...filterMainItems(), ...filterViewItems()],
    viewer: [...filterViewOnlyItems()]
  };
  
  return roleMenuMap[userRole] || [];
};
```

#### 4.2 Dashboard Contextual
```typescript
// src/pages/Dashboard.tsx
export const Dashboard = () => {
  const { userContext } = useUserContext();
  
  return (
    <div>
      {userContext.isOwnerOrAdmin && <GlobalMetrics />}
      {userContext.isManager && <OfficeMetrics offices={userContext.accessibleOffices} />}
      {userContext.isUser && <PersonalMetrics />}
    </div>
  );
};
```

#### 4.3 Componentes Condicionais
```typescript
// Usar PermissionGuard em toda a aplicação
<PermissionGuard permission={{ module: 'sales', resource: 'management', action: 'write' }}>
  <CreateSaleButton />
</PermissionGuard>
```

**Entregáveis:**
- [ ] AppSidebar adaptativo implementado
- [ ] Dashboard contextual
- [ ] Componentes protegidos por permissão
- [ ] UX otimizada por role

---

### 🛡️ ETAPA 5: AUDITORIA E SEGURANÇA (1 semana)
**Objetivo:** Fortalecer auditoria e monitoramento de segurança

#### 5.1 Auditoria Aprimorada
```sql
-- Atualizar audit_log com campos contextuais
ALTER TABLE audit_log 
ADD COLUMN user_role user_role,
ADD COLUMN context_type varchar(20),
ADD COLUMN context_id uuid,
ADD COLUMN access_level varchar(20);

-- Trigger atualizado
CREATE OR REPLACE FUNCTION enhanced_audit_trigger()
RETURNS trigger AS $function$
BEGIN
  -- Capturar contexto do usuário na auditoria
  INSERT INTO audit_log (
    tenant_id, user_id, user_role, context_type, context_id,
    table_name, record_id, action, old_values, new_values
  ) VALUES (
    tenant_id_value, auth.uid(), 
    get_user_role_in_tenant(auth.uid(), tenant_id_value),
    'office', -- determinar dinamicamente
    NULL, -- determinar dinamicamente
    TG_TABLE_NAME, COALESCE(NEW.id, OLD.id), TG_OP,
    CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE row_to_json(OLD) END,
    CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE row_to_json(NEW) END
  );
  RETURN COALESCE(NEW, OLD);
END;
$function$;
```

#### 5.2 Monitoramento de Segurança
```typescript
// src/lib/security/SecurityMonitor.ts
export class SecurityMonitor {
  static logSecurityEvent(event: SecurityEvent): void
  static checkSuspiciousActivity(userId: string): Promise<SecurityAlert[]>
  static generateSecurityReport(tenantId: string): Promise<SecurityReport>
}
```

#### 5.3 Página de Auditoria Avançada
```typescript
// src/pages/Auditoria.tsx
export const Auditoria = () => {
  // Filtros contextuais baseados no role
  // Relatórios de segurança
  // Alertas de atividade suspeita
  // Dashboard de compliance
};
```

**Entregáveis:**
- [ ] Sistema de auditoria aprimorado
- [ ] Monitoramento de segurança ativo
- [ ] Página de auditoria avançada
- [ ] Relatórios de compliance

---

## CRITÉRIOS DE ACEITE POR ETAPA

### Etapa 1 ✅
- [ ] Usuário Manager vê apenas dados de seus escritórios
- [ ] Usuário User vê apenas seus próprios dados
- [ ] Funções de contexto retornam dados corretos
- [ ] Testes unitários passando

### Etapa 2 ✅
- [ ] Tentativa de acesso não autorizado é negada
- [ ] Políticas RLS funcionam em todas as tabelas
- [ ] Performance das consultas mantida
- [ ] Logs de segurança gerados

### Etapa 3 ✅
- [ ] Hooks retornam dados filtrados por contexto
- [ ] Dashboard mostra métricas corretas por role
- [ ] Filtros aparecem conforme permissão
- [ ] Cache funcionando adequadamente

### Etapa 4 ✅
- [ ] Menu lateral mostra apenas opções permitidas
- [ ] Botões/ações aparecem conforme permissão
- [ ] Navegação fluida entre contextos
- [ ] UX intuitiva para cada role

### Etapa 5 ✅
- [ ] Auditoria captura eventos contextuais
- [ ] Alertas de segurança funcionais
- [ ] Relatórios completos e precisos
- [ ] Compliance verificado

---

## RISCOS E MITIGAÇÕES

### 🔴 Riscos Críticos
1. **Performance:** Políticas RLS complexas podem impactar performance
   - **Mitigação:** Otimização de índices, cache estratégico, testes de carga

2. **Complexidade:** Sistema muito complexo pode gerar bugs
   - **Mitigação:** Implementação incremental, testes extensivos, rollback preparado

3. **Migração:** Dados existentes podem ser impactados
   - **Mitigação:** Backup completo, ambiente de testes, migração gradual

### 🟡 Riscos Médios
1. **UX:** Interface pode ficar confusa para usuários
   - **Mitigação:** Testes de usabilidade, treinamento, documentação

2. **Manutenção:** Sistema complexo para manter
   - **Mitigação:** Documentação detalhada, testes automatizados

---

## RECURSOS NECESSÁRIOS

### Desenvolvimento
- **2-3 desenvolvedores** durante 8-9 semanas
- **1 arquiteto de software** para revisões
- **1 especialista em segurança** para validações

### Infraestrutura
- **Ambiente de testes** dedicado
- **Ferramentas de monitoramento** de performance
- **Backup strategy** robusta

### Validação
- **Testes de penetração** após implementação
- **Auditoria de segurança** externa
- **Validação de compliance** com regulamentações

---

## CONCLUSÃO

O sistema atual **TEM CAPACIDADE** para implementar o RBAC conforme planejado. As fundações estão sólidas:

✅ **Banco de dados preparado**  
✅ **Sistema de autenticação robusto**  
✅ **Estrutura frontend adequada**  
✅ **Padrões de desenvolvimento corretos**

A implementação em 5 etapas permite:
- **Baixo risco** com implementação incremental
- **Validação contínua** a cada etapa
- **Rollback seguro** se necessário
- **Performance otimizada** com melhorias graduais

**Recomendação:** PROSSEGUIR com a implementação conforme planejado.