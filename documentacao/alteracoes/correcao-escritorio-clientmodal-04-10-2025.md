# Correção: Campo Escritório não aparece no ClientModal
**Data:** 04/10/2025 12:30  
**Desenvolvedor:** Lovable AI

## Problema Identificado

O campo de escritório não aparecia no modal de cadastro de clientes (`ClientModal`), exibindo a mensagem:
> "Sua conta não está associada a um escritório. Contate um administrador."

Enquanto isso, as telas `/vendedores`, `/usuários` e `/perfil` mostravam o escritório corretamente.

## Causa Raiz

A função SQL `get_user_context_offices` estava buscando escritórios da tabela **`office_users`** (tabela legada) ao invés de **`tenant_users`** (tabela atual que contém o `office_id`).

**Fluxo do problema:**
1. `ClientModal` usa `useUserContext()` hook
2. `useUserContext()` chama a função SQL `get_user_full_context`
3. `get_user_full_context` chama `get_user_context_offices`
4. `get_user_context_offices` buscava de `office_users` ❌ (tabela errada)

**Por que funcionava em outras telas:**
- `/vendedores`: Busca diretamente de `tenant_users` com JOIN `offices`
- `/usuários`: Usa `useOffices()` e filtra por `tenant_users.office_id`
- `/perfil`: Busca diretamente de `tenant_users.office_id`

## Solução Implementada

### 1. Atualização da função SQL `get_user_context_offices`

```sql
CREATE OR REPLACE FUNCTION public.get_user_context_offices(user_uuid uuid, tenant_uuid uuid)
 RETURNS uuid[]
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$ 
DECLARE 
  office_ids uuid[]; 
BEGIN
  -- Buscar office_id de tenant_users (tabela atual)
  SELECT ARRAY_AGG(DISTINCT office_id) INTO office_ids 
  FROM tenant_users 
  WHERE user_id = user_uuid 
    AND tenant_id = tenant_uuid 
    AND active = true 
    AND office_id IS NOT NULL;
  
  -- Fallback para office_users (compatibilidade com dados legados)
  IF office_ids IS NULL OR array_length(office_ids, 1) IS NULL THEN
    SELECT ARRAY_AGG(DISTINCT office_id) INTO office_ids 
    FROM office_users 
    WHERE user_id = user_uuid 
      AND tenant_id = tenant_uuid 
      AND active = true 
      AND office_id IS NOT NULL;
  END IF;
  
  RETURN COALESCE(office_ids, ARRAY[]::uuid[]); 
END; 
$function$;
```

## Impacto

**Positivo:**
- ✅ Campo de escritório agora aparece corretamente no `ClientModal`
- ✅ Busca de escritórios acessíveis agora usa a fonte de dados correta
- ✅ Compatibilidade mantida com dados legados via fallback
- ✅ Consistência entre todas as telas do sistema

**Sem impacto negativo:**
- A mudança não afeta dados existentes
- Fallback para `office_users` mantém compatibilidade

## Arquivos Afetados

**Migração SQL:**
- `supabase/migrations/[timestamp]_fix_get_user_context_offices.sql`

**Funções SQL:**
- `get_user_context_offices(user_uuid, tenant_uuid)`

**Frontend (não modificado, correção no backend):**
- `src/components/ClientModal.tsx` - Usa `useUserContext()`
- `src/hooks/useUserContext.ts` - Chama `get_user_full_context`

## Testes Necessários

1. ✅ Verificar se o campo de escritório aparece no `ClientModal`
2. ✅ Testar cadastro de cliente com seleção de escritório
3. ✅ Verificar que usuários com múltiplos escritórios veem todos
4. ✅ Confirmar que usuários sem escritório recebem mensagem apropriada
5. ✅ Validar que `/vendedores` e `/usuários` continuam funcionando

## Notas Técnicas

- A correção priorizou `tenant_users` como fonte principal de verdade
- O fallback para `office_users` é apenas para compatibilidade temporária
- Recomenda-se migrar todos os dados de `office_users` para `tenant_users` eventualmente
- Cache do React Query pode precisar ser invalidado (F5) após a migração
