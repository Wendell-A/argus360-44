
# Enriquecimento do Sidebar com Dados do Usuário

## Resumo
Implementação de melhorias no AppSidebar.tsx para exibir informações completas do usuário logado e dados do tenant, incluindo foto/iniciais, nome, cargo, departamento e escritório.

## Alterações Realizadas

### 1. Hook useCurrentUser (`src/hooks/useCurrentUser.ts`)
**Criado:** Hook personalizado para buscar dados completos do usuário logado

**Funcionalidades:**
- Busca dados do usuário na tabela `office_users` com relacionamento para `offices`
- Busca dados do departamento na tabela `departments`
- Retorna informações consolidadas do usuário (nome, email, cargo, escritório, departamento)
- Utiliza React Query para cache e gerenciamento de estado
- Tratamento de erros adequado

**Correções aplicadas:**
- **v1.1:** Corrigido erro de tipagem "Type instantiation is excessively deep" através da simplificação das interfaces TypeScript
- Separação das interfaces `OfficeData` e `DepartmentData` para evitar referências circulares
- Tipagem explícita da função `queryFn` como `Promise<CurrentUserData>`

**Dados retornados:**
```typescript
interface CurrentUserData {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  office?: OfficeData;
  department?: DepartmentData;
  role?: string;
}
```

### 2. Componente UserAvatar (`src/components/UserAvatar.tsx`)
**Criado:** Componente para exibir avatar do usuário ou iniciais

**Funcionalidades:**
- Exibe foto do usuário se disponível
- Fallback para iniciais do nome (primeiras letras do primeiro e último nome)
- Design consistente com o tema do sistema
- Tamanhos configuráveis (sm, md, lg)

**Props:**
- `user`: dados do usuário atual
- `size`: tamanho do avatar ('sm' | 'md' | 'lg')

### 3. AppSidebar Atualizado (`src/components/AppSidebar.tsx`)
**Modificado:** Enriquecimento com dados do usuário e tenant

**Novas funcionalidades adicionadas:**
- **Seção de Perfil do Usuário:**
  - Avatar/iniciais do usuário
  - Nome completo
  - Cargo/função
  - Departamento (se disponível)
  - Escritório atual
- **Nome do Tenant:** Substituição de "Argos360" pelo nome real do tenant
- **Botão de Logout:** Implementação segura de logout com limpeza de cache

**Segurança do Logout:**
- Chama `signOut()` do AuthContext (limpa tokens do Supabase)
- Invalida todas as queries do React Query
- Redirecionamento automático para página de login
- Prevenção contra ataques de sessão

**Layout preservado:**
- Mantidas todas as funcionalidades existentes
- Menu de navegação inalterado
- Apenas adicionadas as novas seções de informações do usuário

## Estrutura de Dados Utilizadas

### Tabelas do Banco de Dados:
1. **office_users:** Relacionamento usuário-escritório com cargo
2. **offices:** Dados dos escritórios (nome, tipo)
3. **departments:** Departamentos disponíveis
4. **profiles:** Perfil básico do usuário (via AuthContext)

### Fluxo de Dados:
1. AuthContext fornece dados básicos do usuário e tenant
2. useCurrentUser busca dados complementares via Supabase
3. Componentes exibem informações consolidadas

## Arquivos Criados/Modificados

### Criados:
- `src/hooks/useCurrentUser.ts` - Hook para dados do usuário
- `src/components/UserAvatar.tsx` - Componente de avatar
- `documentacao/alteracoes/enriquecimento-sidebar-usuario.md` - Esta documentação

### Modificados:
- `src/components/AppSidebar.tsx` - Adicionadas seções de perfil e logout

## Considerações Técnicas

### Performance:
- Cache automático via React Query
- Queries condicionais (só executa se usuário logado)
- Reutilização de dados em diferentes componentes

### Segurança:
- RLS (Row Level Security) nas consultas Supabase
- Logout seguro com limpeza completa de sessão
- Validação de permissões via tenant_id

### Manutenibilidade:
- Hooks reutilizáveis
- Componentes pequenos e focados
- Tipagem TypeScript completa
- Documentação detalhada

## Próximos Passos Sugeridos
1. Implementar cache local para avatar do usuário
2. Adicionar configurações de perfil do usuário
3. Implementar upload de foto de perfil
4. Adicionar indicadores de status online/offline
