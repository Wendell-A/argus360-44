# Correção do Cadastro de Clientes - RLS
**Data:** 25/09/2025  
**Horário:** 10:43 AM  
**Contexto:** Resolução crítica de erro de violação de RLS no cadastro de clientes

## Problema Identificado
Usuários com perfil "user" não conseguiam cadastrar clientes devido a violação de política RLS na tabela `clients`. O erro ocorria porque os campos `office_id` e `responsible_user_id` não estavam sendo definidos corretamente durante o INSERT.

**Erro específico:** "new row violates row-level security policy"

## Análise da Causa
1. **RLS Policy Requirement**: A política RLS exige que usuários "user" tenham `responsible_user_id = auth.uid()` e `office_id` dentro do contexto acessível
2. **Frontend Issues**: 
   - Não havia campo para seleção de escritório
   - `responsible_user_id` não estava sendo enviado explicitamente
   - Tratamento de erros inadequado (mensagens genéricas)
3. **Backend Trigger**: A função `ensure_client_responsible_user` não contemplava o preenchimento automático de `office_id`

## Soluções Implementadas

### 1. Backend - SQL Function & Trigger
- **Arquivo:** Migration SQL
- **Função:** `ensure_client_responsible_user()`
- **Melhorias:**
  - Se `responsible_user_id` for null → define como `auth.uid()`
  - Se `office_id` for null → busca na `tenant_users` pelo `responsible_user_id`
  - Fallback: se usuário responsável não existe no tenant, usa `auth.uid()` e seu `office_id`

### 2. Frontend - ClientModal
- **Arquivo:** `src/components/ClientModal.tsx`
- **Adições:**
  - Importação de `useOffices`, `useUserContext`, `useAuth`
  - Campo `office_id` no schema Zod
  - Campo "Escritório" no formulário com lógica inteligente:
    - **1 escritório acessível**: seleção automática (campo pode ficar oculto/disabled)
    - **2+ escritórios**: Select obrigatório
    - **0 escritórios**: bloqueia submit com mensagem clara
  - Envio explícito de `responsible_user_id: user.id`
  - Validação no frontend antes do submit
  - Melhor tratamento de erros do Supabase (mapeamento de mensagens RLS)

### 3. Hook useCreateClient
- **Arquivo:** `src/hooks/useClients.ts`
- **Melhorias:**
  - Logs detalhados para debug (sem dados sensíveis)
  - Captura de detalhes completos do erro Supabase (`message`, `details`, `hint`, `code`)

## Regras de Negócio Implementadas

### Para Usuários "user" (vendedores):
- **Obrigatoriedade**: Deve selecionar escritório se tiver acesso a múltiplos
- **Auto-seleção**: Se tiver acesso a apenas 1 escritório, é selecionado automaticamente
- **Bloqueio**: Se não tiver acesso a nenhum escritório, não pode criar clientes

### Para Admin/Owner:
- **Flexibilidade**: Pode criar clientes com ou sem `office_id` específico
- **Acesso global**: Vê todos os escritórios na lista de seleção

### Para Manager:
- **Contexto limitado**: Vê apenas escritórios que pode acessar
- **Mesmo comportamento**: Segue as mesmas regras dos usuários "user"

## Cenários de Teste Validados

### ✅ Usuário "Cleiton" (role: user, 1 office):
- Abrir Clientes → Novo cliente → campo escritório auto-preenchido → salvar → **SUCESSO**

### ✅ Usuário com múltiplos offices:
- Tentar salvar sem selecionar escritório → validação impede submit
- Selecionar escritório acessível → **SUCESSO**

### ✅ Admin/Owner:
- Criar com ou sem office_id → ambos funcionam
- **SUCESSO** em todos os casos

### ✅ Usuário sem escritórios:
- Formulário exibe mensagem: "Sua conta não está associada a um escritório. Contate um administrador."
- Submit é bloqueado

## Melhorias de UX

### Mensagens de Erro Mapeadas:
- `"row-level security policy"` → "Você não tem permissão para criar clientes neste escritório..."
- `"violates check constraint"` → "Dados inválidos fornecidos. Verifique os campos obrigatórios."
- Erro genérico → exibe `error.message` do Supabase quando disponível

### Campo Escritório Inteligente:
- **Loading state**: "Carregando escritórios..."
- **Auto-seleção visual**: Campo mostra o nome do escritório selecionado automaticamente
- **Validação contextual**: Só obrigatório para não-admins

## Preservação de Dados
- ✅ Nenhum dado existente foi alterado
- ✅ Trigger atua apenas em novos INSERT/UPDATE
- ✅ Funcionalidade de edição preservada
- ✅ Compatibilidade mantida com clientes existentes

## Arquivos Alterados
1. **Migration SQL** - função `ensure_client_responsible_user()`
2. **src/components/ClientModal.tsx** - interface completa
3. **src/hooks/useClients.ts** - logging e error handling
4. **Este arquivo de documentação**

## Observações Técnicas
- As RLS policies da tabela `clients` **não foram alteradas** (estão corretas)
- A solução garante que os campos obrigatórios sejam preenchidos antes da validação RLS
- Sistema mantém isolamento por tenant e contexto de escritório
- Logs detalhados permitem debug futuro sem expor dados sensíveis

---
**Status:** ✅ IMPLEMENTADO E TESTADO  
**Impacto:** CRÍTICO - Resolve problema de cadastro para vendedores  
**Próximos passos:** Monitorar logs de produção para garantir estabilidade