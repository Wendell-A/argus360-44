# Análise Profunda – Tela de Vendas
**Data:** 03 de Outubro de 2025  
**Módulo:** Vendas  
**Arquivos-chave:** `src/pages/Vendas.tsx`, `src/hooks/useCachedSales.ts`, `supabase/migrations/20251002200742_7fab7d74-983c-4b56-b900-0832385ba3ab.sql`

---

## Contexto e Objetivo

Listar vendas com dados relacionados (cliente, produto, vendedor, escritório) e resumo de comissões, com paginação, filtros e alto desempenho. Evitar N+1 queries e garantir RBAC.

---

## Dados e Consultas

- RPC: `public.get_sales_complete_optimized(tenant_uuid, limit_param, offset_param)`
  - Retorna: `sale_data`, `client_data`, `product_data`, `seller_data`, `office_data`, `commission_summary`.
  - Segurança: valida papel do usuário (`owner/admin/manager/user/viewer`) e escritórios acessíveis.
  - Ordena por `sale_date DESC, created_at DESC`, paginação server-side.

- Hook: `useCachedSales.ts`
  - Chama RPC com `tenant_uuid`, `limit_param`, `offset_param`.
  - Aplica filtros adicionais no cliente (status, período, escritório, vendedor).
  - Transforma: mapeia resposta para estrutura esperada e enriquece nomes (`client_name`, `seller_name`, `product_name`, `office_name`).

---

## Fluxo de Dados

1. Usuário abre `/vendas` com filtros e paginação.  
2. Frontend chama `get_sales_complete_optimized` via `useCachedSales`.  
3. RPC aplica RBAC, JOINs e agregações de comissões no banco.  
4. Resposta é filtrada e transformada no frontend e exibida.

---

## Performance e Cache

- Elimina N+1: dados relacionados vêm em uma única query.  
- Paginação no banco reduz payload e melhora TTFB.  
- Integrável com cache híbrido (camada do `useOptimizedQuery`) em cenários de alto tráfego.  
- Índices em `sales(tenant_id, sale_date, created_at)` e FK relacionadas suportam JOINs.

---

## Segurança e RBAC

- `SECURITY DEFINER` com checagem de `user_role` e escritórios (`get_user_context_offices`).  
- Isolamento por `tenant_uuid` em todas as cláusulas.  
- Exibição só de vendas permitidas por papel e contexto.

---

## Riscos e Recomendações

- Filtros no cliente: sempre preferir filtros críticos no banco quando possível (data, status) para reduzir payload.  
- Validar consistência de `commission_summary` com eventos de pagamento e aprovação.  
- Monitorar latência com offset alto; considerar `keyset pagination` em crescimento futuro.

---

## KPIs Sugeridos

- Tempo médio de resposta `/vendas` (P50, P95).  
- Taxa de acerto de cache para listagem.  
- Percentual de filtros aplicados server-side vs client-side.  
- Volume de vendas por role/office acessado.

---

## Referências

- `src/hooks/useCachedSales.ts`  
- `supabase/migrations/20251002200742_7fab7d74-983c-4b56-b900-0832385ba3ab.sql`  
- `documentacao/alteracoes/fase3-otimizacao-rpcs-02-10-2025.md`