# Arquitetura de Consultas Otimizadas
**Data:** 03 de Outubro de 2025

---

## Infraestrutura Central

- `useOptimizedQuery.ts`: abstrai autenticação, contexto de segurança, cache híbrido (três camadas), deduplicação de requisições, rate limiting, timeout e classificação de sensibilidade.
- Hooks derivados: `useOptimizedUserQuery`, `useOptimizedBusinessQuery`, `useOptimizedPublicQuery` com estratégias distintas conforme sensibilidade e cache.

---

## RPCs Otimizadas (Supabase / Postgres)

- `public.get_sales_complete_optimized(tenant_uuid, limit_param, offset_param)`
  - Retorno em tabela JSONB: venda, cliente, vendedor, produto, escritório e resumo de comissões.
  - Controle de acesso por `user_role` e escritórios acessíveis; ordenação e paginação server-side.

- `public.get_crm_complete_optimized(tenant_uuid, limit_param)`
  - Consolida cliente, posição de funil, interações, tarefas e vendas em uma única query.
  - Isolamento por tenant e papel; ordenação por atualização/criação.

- `public.get_funnel_stats_optimized(tenant_uuid)`
  - Agrega métricas por estágio: contagem de clientes, valor esperado, probabilidade média e taxa de conversão.

- `public.get_commissions_complete_optimized(tenant_uuid, ...)`
  - Comissões com dados de venda e destinatários; inclui agregações e paginação.

---

## Benefícios

- Reduz drasticamente N+1 queries e payloads.
- Melhora tempos de resposta e a experiência nas telas com alto volume.
- Padroniza segurança e governança ao centralizar regras em RPCs.

---

## Pontos de Atenção

- Manter índices coerentes com filtros e joins mais acessados.
- Monitorar TTL e invalidações de cache por contexto de segurança.
- Validar continuamente RBAC em chamadas de alta sensibilidade.