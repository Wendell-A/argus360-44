# Análise Profunda – Tela de Dashboard
**Data:** 03 de Outubro de 2025  
**Módulo:** Dashboard  
**Arquivos-chave:** `src/pages/Dashboard.tsx`, `src/hooks/useCachedDashboard.ts`, `src/hooks/useDashboardStats.ts`, `supabase/migrations/20251002200742_7fab7d74-983c-4b56-b900-0832385ba3ab.sql`, `documentacao/analise/diagnostico-performance-seguranca-completo-02-10-2025.md`

---

## Contexto e Objetivo

Exibir visão executiva com KPIs (vendas, comissões, usuários ativos, metas, recentes) com consultas consolidadas e alto desempenho.

---

## Dados e Consultas

- RPC: `public.get_funnel_stats_optimized(tenant_uuid)` para métricas de funil.  
- RPC consolidada de dashboard (definida em documentação técnica) com `json_build_object` para KPIs.  
- Hooks: `useCachedDashboard.ts`, `useDashboardStats.ts` integram queries e cache.

---

## Fluxo de Dados

1. Usuário acessa `/dashboard`.  
2. Frontend consulta RPCs de KPIs e funil; dados são agregados no banco.  
3. UI renderiza cards e gráficos com cargas reduzidas.

---

## Performance e Cache

- Redução de 80% de queries para estatísticas de funil.  
- KPIs consolidados minimizam múltiplas chamadas sequenciais.  
- Cache híbrido adequado para dados de leitura frequente.

---

## Segurança e RBAC

- Isolamento por tenant; KPIs respeitam escopo dos dados.  
- Sensibilidade ajustada conforme tipo de dado (pessoal vs negócios vs público).

---

## Riscos e Recomendações

- Manter consistência de períodos (start/end) entre KPIs.  
- Validar precisão de agregações com benchmarks e amostras.

---

## KPIs Sugeridos

- Tempo de resposta total do dashboard.  
- Taxa de cache hit para KPIs.  
- Variação de KPIs por período.

---

## Referências

- `src/hooks/useCachedDashboard.ts`, `src/hooks/useDashboardStats.ts`  
- Migração SQL das RPCs e documentação técnica de diagnóstico.