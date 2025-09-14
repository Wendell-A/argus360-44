# Correção: Permissões de Execução das Funções de Convite Público

- Data: 14/09/2025, 15:20 UTC
- Tipo: Correção de Produção
- Status: Concluído ✅

## Problema
Ao acessar `/registrar-com-token/:token` a validação retornava erro genérico ("Erro ao validar o link de convite") mesmo com links ativos. Indicativo de falha na chamada RPC por permissão.

## Causa Raiz
Faltava GRANT EXECUTE nas funções Postgres usadas pelo fluxo público:
- `public.validate_public_invitation_token(p_token varchar)`
- `public.accept_public_invitation(p_token varchar, p_user_id uuid, p_email varchar, p_full_name varchar)`

Sem o GRANT, o papel `anon` não conseguia executar as RPCs, resultando em erro no PostgREST.

## Ações Implementadas
1. Banco de Dados (migração):
   - Concedido `GRANT EXECUTE` para `anon` e `authenticated` nas funções acima.
2. Frontend:
   - Melhorado o tratamento de erro em `RegistrarComToken.tsx` para exibir a mensagem real do RPC quando ocorrer (facilita diagnóstico).

## Scripts Executados
```sql
GRANT EXECUTE ON FUNCTION public.validate_public_invitation_token(p_token character varying) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.accept_public_invitation(p_token character varying, p_user_id uuid, p_email character varying, p_full_name character varying) TO anon, authenticated;
```

## Observações de Segurança
- O linter apontou avisos sobre `search_path` não definido em diversas funções. Próximo passo recomendado: padronizar `SECURITY DEFINER SET search_path = public` nas funções sensíveis.

## Arquivos Alterados
- Migração criada automaticamente: grants de execução (Supabase)
- `src/pages/RegistrarComToken.tsx` – melhoria no feedback de erro (mínima)

## Testes Recomendados
- Acessar o botão “Testar” em /convites para links ativos e verificar carregamento do formulário.
- Validar cenários de link expirado, desativado e limite atingido (mensagens específicas devem aparecer).

---
Documento gerado automaticamente para histórico de mudanças.
