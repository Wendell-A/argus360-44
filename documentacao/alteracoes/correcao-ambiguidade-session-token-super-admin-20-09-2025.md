# Correção de Ambiguidade session_token Super Admin - 20/09/2025

## Problema Identificado
- Erro: "column reference 'session_token' is ambiguous"
- Causa: Variável local com mesmo nome da coluna da tabela
- Afetava as funções `authenticate_super_admin` e `validate_super_admin_session`

## Soluções Implementadas

### 1. Correção da Variável Local
```sql
-- ANTES: session_token TEXT (conflitava com coluna)
-- DEPOIS: v_session_token TEXT (sem conflito)
```

### 2. Qualificação Explícita de Colunas
```sql
-- Todas as colunas agora têm alias de tabela explícito
UPDATE public.super_admins sa
SET last_login = now(),
    session_token = v_session_token,  -- usando variável distinta
    session_expires_at = now() + INTERVAL '8 hours'
WHERE sa.id = admin_record.id;
```

### 3. Funções Corrigidas
- `authenticate_super_admin`: Variable renomeada para `v_session_token`
- `validate_super_admin_session`: Alias `sa` aplicado consistentemente
- Ambas com `SET search_path = 'public'` para segurança

## Resultados
✅ Erro de ambiguidade eliminado
✅ Login de super admin funcional
✅ Validação de sessão corrigida
✅ Padrão de nomenclatura consistente

## Arquivos Afetados
- `supabase/migrations/` - Novas funções SQL corrigidas
- Sistema de autenticação administrativo operacional

Data: 20/09/2025 - 22:55
Status: ✅ CORRIGIDO E TESTADO