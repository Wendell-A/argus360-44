# Análise Profunda – Tela de CRM
**Data:** 03 de Outubro de 2025  
**Módulo:** CRM  
**Arquivos-chave:** `src/pages/CRM.tsx`, `src/hooks/useCRMOptimized.ts`, `src/hooks/useCachedCRM.ts`, `supabase/migrations/20251002200742_7fab7d74-983c-4b56-b900-0832385ba3ab.sql`

---

## Contexto e Objetivo

Consolidar visão do cliente com posição no funil, interações recentes, tarefas pendentes e vendas, com segurança e performance, evitando N+1.

---

## Dados e Consultas

- RPC: `public.get_crm_complete_optimized(tenant_uuid, limit_param)`
  - Retorna: `client_data`, `funnel_position`, `recent_interactions`, `pending_tasks`, `sales_data` (agregados por cliente).  
  - Segurança: papel (`owner/admin/manager/user/viewer`) e escritórios acessíveis; isolamento por tenant.

- RPC: `public.get_funnel_stats_optimized(tenant_uuid)`
  - Estatísticas agregadas por estágio do funil: contagem, valor esperado total, probabilidade média, taxa de conversão.

- Hooks: `useCRMOptimized.ts`, `useCachedCRM.ts`
  - Integram as RPCs, aplicam cache e transformações de exibição.

---

## Fluxo de Dados

1. Usuário acessa `/crm` com filtros do funil.  
2. Frontend consulta `get_crm_complete_optimized` para lista e `get_funnel_stats_optimized` para métricas.  
3. Dados retornam consolidados; UI exibe funil, clientes e insights sem N+1.

---

## Performance e Cache

- Redução de 5–7 queries por cliente para 1–2 RPCs.  
- Agregações no banco (funil, vendas por cliente) minimizam cálculos no cliente.  
- Cache híbrido pode armazenar estágios do funil e clientes recentes; invalidação por contexto/tenant.

---

## Segurança e RBAC

- Checagem de papel e escritórios acessíveis; clientes só visíveis conforme responsabilidade ou office.  
- Auditoria recomendada de interações e tarefas via função de log contextual.

---

## Riscos e Recomendações

- Funis extensos: monitorar performance em tenants com muitos estágios; otimizar índices.  
- Interações e tarefas: assegurar limites (limit/offset) para listas grandes.  
- Harmonizar filtros entre cliente e servidor para manter payload enxuto.

---

## KPIs Sugeridos

- Tempo de resposta para carga de CRM e funil.  
- Taxa de conversão por estágio e variação temporal.  
- Volume de interações e tarefas pendentes por usuário/office.

---

## Referências

- `src/hooks/useCRMOptimized.ts`, `src/hooks/useCachedCRM.ts`  
- `supabase/migrations/20251002200742_7fab7d74-983c-4b56-b900-0832385ba3ab.sql`  
- `documentacao/alteracoes/fase3-otimizacao-rpcs-02-10-2025.md`