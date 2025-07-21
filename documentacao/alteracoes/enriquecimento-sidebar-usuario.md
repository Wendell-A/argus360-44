
# Enriquecimento do AppSidebar com Dados do Usuário

## Resumo das Alterações
Esta documentação descreve as melhorias implementadas no AppSidebar.tsx para exibir informações detalhadas do usuário e tenant ativo.

## Arquivos Criados

### 1. `src/hooks/useCurrentUser.ts`
**Objetivo:** Hook customizado para buscar dados completos do usuário atual
**Funcionalidades:**
- Busca dados do usuário autenticado
- Obtém informações do escritório associado
- Recupera dados do departamento
- Identifica o cargo/role do usuário
- Integra com o tenant ativo

**Estrutura de Dados Retornados:**
```typescript
interface CurrentUserData {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  office?: {
    id: string;
    name: string;
    type: string;
  };
  department?: {
    id: string;
    name: string;
  };
  role?: string;
}
```

### 2. `src/components/UserAvatar.tsx`
**Objetivo:** Componente reutilizável para exibir avatar do usuário
**Funcionalidades:**
- Exibe foto do usuário quando disponível
- Gera iniciais automaticamente quando não há foto
- Suporte a diferentes tamanhos (sm, md, lg)
- Integração com o sistema de temas

## Arquivos Modificados

### 1. `src/components/AppSidebar.tsx`
**Melhorias Implementadas:**

#### A. Header do Tenant
- **Antes:** Exibia "Argus360" fixo
- **Depois:** Exibe o nome do tenant ativo dinamicamente
- **Localização:** Seção superior do sidebar

#### B. Seção de Perfil do Usuário
**Nova seção adicionada com:**
- Avatar do usuário (foto ou iniciais)
- Nome completo do usuário
- Cargo/role traduzido para português
- Nome do departamento
- Nome do escritório
- Estado de loading com skeletons

#### C. Responsividade
- **Modo expandido:** Exibe todas as informações
- **Modo colapsado:** Exibe apenas o avatar
- **Transições suaves:** Mantém a experiência do usuário

## Detalhes Técnicos

### Integração com Banco de Dados
O hook `useCurrentUser` realiza uma consulta JOIN nas seguintes tabelas:
- `office_users`: Tabela principal com relacionamentos
- `offices`: Dados do escritório
- `departments`: Dados do departamento

### Mapeamento de Roles
```typescript
const roleMap: Record<string, string> = {
  admin: 'Administrador',
  manager: 'Gerente',
  seller: 'Vendedor',
  user: 'Usuário'
};
```

### Estado de Loading
- Utiliza skeletons para melhor UX durante carregamento
- Fallbacks seguros quando dados não estão disponíveis

## Estrutura Visual

### Seção do Tenant (Topo)
```
[Ícone] Nome do Tenant
        Sistema de Vendas
```

### Seção do Usuário
```
[Avatar] Nome Completo
         Cargo
         Departamento
         Escritório
```

### Menu de Navegação
- Mantida estrutura original
- Três grupos: Principal, Gestão, Sistema
- Indicação visual de rota ativa

## Benefícios Implementados

1. **Contexto Visual:** Usuário sempre sabe qual tenant está acessando
2. **Identificação Clara:** Avatar e nome sempre visíveis
3. **Hierarquia Organizacional:** Cargo, departamento e escritório claros
4. **Experiência Consistente:** Loading states e fallbacks apropriados
5. **Responsividade:** Funciona bem em modo colapsado e expandido

## Considerações de Performance

- **Cache Inteligente:** useQuery com chaves específicas por usuário e tenant
- **Lazy Loading:** Dados carregados apenas quando necessário
- **Otimização de Queries:** Single query com JOINs eficientes

## Testes Recomendados

1. Verificar exibição com usuários que têm foto
2. Testar com usuários sem foto (iniciais)
3. Validar comportamento com diferentes roles
4. Testar usuários sem departamento/escritório
5. Verificar responsividade do sidebar
6. Testar troca de tenants

## Próximos Passos Sugeridos

1. Adicionar tooltip com informações completas no modo colapsado
2. Implementar menu de contexto no avatar do usuário
3. Adicionar opção de logout no perfil do usuário
4. Implementar indicador de status online/offline
