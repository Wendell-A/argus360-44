
# Tela de Usuários - Gestão Completa de Usuários

**Data de Criação:** 27 de Janeiro de 2025 - 13:45h  
**Localização:** `/usuarios`  
**Permissões:** Apenas Admin e Owner  
**Arquivo Principal:** `src/pages/Usuarios.tsx`

## Visão Geral

A tela de Usuários é o centro de controle para gerenciamento completo de todos os usuários da organização. Permite visualizar, editar, ativar/inativar usuários mantendo integridade dos dados históricos.

## Funcionalidades Principais

### 1. **Dashboard de Estatísticas**
- **Total de Usuários:** Contador geral
- **Usuários Ativos:** Usuários com status ativo
- **Usuários Inativos:** Usuários inativados
- **Administradores:** Usuários com perfil admin/owner

### 2. **Sistema de Filtros Avançado**
- **Busca por Texto:** Nome ou email
- **Filtro por Perfil:** owner, admin, manager, user, viewer
- **Filtro por Status:** ativo, inativo
- **Filtro por Escritório:** todos os escritórios disponíveis
- **Botão Limpar:** Reset de todos os filtros

### 3. **Lista Detalhada de Usuários**
Para cada usuário exibe:
- **Avatar e Nome Completo**
- **Badges de Perfil e Status**
- **Email e Telefone**
- **Escritório Associado**
- **Data de Ingresso**
- **Ações:** Editar, Ativar/Inativar

### 4. **Modal de Edição Completo**
#### Informações Pessoais:
- Nome completo (editável)
- Email (somente leitura)
- Telefone (editável)
- Cargo (editável)

#### Configurações do Sistema:
- Perfil de Acesso (owner, admin, manager, user)
- Escritório associado
- Departamento
- Equipe

#### Status e Dependências:
- Status atual (ativo/inativo)
- Data de ingresso
- **Análise de Dependências:**
  - Vendas associadas
  - Comissões do usuário
  - Clientes sob responsabilidade
  - Recomendação de ação

## Componentes e Arquitetura

### Componentes Principais
```
src/pages/Usuarios.tsx          # Página principal
src/components/UserEditModal.tsx # Modal de edição
src/hooks/useUserManagement.ts   # Hook de gerenciamento
```

### Dependências de Dados
- `profiles` - Informações pessoais
- `tenant_users` - Associação com tenant
- `office_users` - Associação com escritório
- `sales` - Vendas do usuário (dependência)
- `commissions` - Comissões do usuário (dependência)
- `clients` - Clientes responsáveis (dependência)

## Sistema de Inativação Inteligente

### Soft Delete Strategy
A tela implementa **inativação inteligente** em vez de exclusão física:

1. **Verificação de Dependências:**
   - Analisa vendas, comissões e clientes
   - Calcula impacto da remoção
   - Apresenta relatório detalhado

2. **Inativação Controlada:**
   - Define `active = false` em `tenant_users`
   - Inativa registros em `office_users`
   - **Preserva todos os dados históricos**
   - Registra auditoria completa

3. **Reativação Segura:**
   - Permite reativar usuários facilmente
   - Restaura associações necessárias
   - Mantém configurações anteriores

## Segurança e Permissões

### Controle de Acesso
- **Admins e Owners:** Acesso total
- **Managers:** Bloqueado (podem usar outras telas)
- **Users:** Bloqueado

### Validações Implementadas
- Verificação de permissões antes de qualquer ação
- Confirmação dupla para inativação
- Logs de auditoria para todas as operações
- Proteção contra exclusão acidental

## Fluxos de Uso

### 1. Editar Usuário
1. Admin acessa `/usuarios`
2. Localiza usuário (busca/filtros)
3. Clica em "Editar"
4. Modal abre com dados atuais
5. Modifica informações necessárias
6. Clica "Salvar Alterações"
7. Sistema valida e persiste dados

### 2. Inativar Usuário
1. Admin localiza usuário ativo
2. Clica em "Inativar"
3. Sistema analisa dependências
4. Apresenta confirmação com detalhes
5. Admin confirma ação
6. Sistema inativa preservando histórico
7. Toast confirma sucesso

### 3. Análise de Dependências
1. Modal de edição carrega automaticamente
2. Sistema consulta:
   - Vendas como vendedor
   - Comissões como recipient
   - Clientes como responsável
3. Apresenta contadores e recomendações
4. Admin toma decisão informada

## Tratamento de Erros

### Cenários Cobertos
- **Usuário sem permissão:** Redirect automático
- **Falha na consulta:** Retry automático
- **Erro de atualização:** Toast com detalhes
- **Conflitos de dados:** Mensagem específica

### Logs e Debugging
- Console logs detalhados em todas as operações
- Identificação de erros por emoji
- Stack traces preservados
- Context de tenant/user sempre presente

## Integrações

### Hooks Utilizados
- `useUserManagement()` - CRUD de usuários
- `useOffices()` - Lista de escritórios  
- `useDepartments()` - Lista de departamentos
- `useTeams()` - Lista de equipes
- `useAuth()` - Context de autenticação

### APIs do Supabase
- **RLS Queries:** Respeitam permissões contextuais
- **Batch Updates:** Múltiplas tabelas em transação
- **Cascade Operations:** Inativação controlada

## Performance

### Otimizações Aplicadas
- **Query caching:** 5 minutos de cache
- **Lazy loading:** Modal só carrega quando aberto  
- **Debounced search:** Busca otimizada
- **Selective updates:** Apenas campos alterados
- **Background prefetch:** Dependências em background

### Métricas Esperadas
- **Loading inicial:** < 2 segundos
- **Filtros:** Instantâneo (client-side)
- **Modal de edição:** < 1 segundo
- **Análise de dependências:** < 3 segundos
- **Operações CRUD:** < 2 segundos

## Melhorias Futuras

### Funcionalidades Planejadas
1. **Export de dados:** CSV/Excel da lista
2. **Bulk operations:** Ações em lote
3. **Histórico de alterações:** Timeline de mudanças
4. **Notificações:** Alertas de atividade
5. **Avatar upload:** Upload de fotos
6. **Campos customizados:** Extensões por tenant

### Integrações Futuras
1. **SSO Integration:** Login único
2. **AD Sync:** Sincronização com Active Directory
3. **Slack/Teams:** Notificações externas
4. **Backup automatizado:** Recuperação de dados

## Documentação Técnica

### Estados do Sistema
```typescript
interface UserManagementState {
  users: UserTenantAssociation[];
  loading: boolean;
  filters: FilterState;
  selectedUser: UserTenantAssociation | null;
  dependencies: UserDependencies | null;
}
```

### Eventos Principais
- `user.profile.updated` - Perfil alterado
- `user.tenant.updated` - Associação tenant alterada  
- `user.deactivated` - Usuário inativado
- `user.reactivated` - Usuário reativado
- `dependencies.analyzed` - Dependências verificadas

---

**Última Atualização:** 27 de Janeiro de 2025 - 13:45h  
**Responsável:** Sistema implementado integralmente  
**Status:** ✅ FUNCIONAL E DOCUMENTADO
