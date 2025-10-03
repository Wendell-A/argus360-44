# Análise Profunda – Tela de Comissões
**Data:** 03 de Outubro de 2025  
**Módulo:** Comissões  
**Arquivos-chave:** `src/pages/Comissoes.tsx`, `src/pages/comissoes/ComissoesEscritorio.tsx`, `src/pages/comissoes/ComissoesVendedores.tsx`, `src/hooks/useCommissions.ts`, `supabase/migrations/20251002200742_7fab7d74-983c-4b56-b900-0832385ba3ab.sql`

---

## Contexto e Objetivo

Consolidar comissões de vendedores e escritórios com dados completos de vendas e destinatários, incluindo sumarizações e filtros.

---

## Dados e Consultas

- RPC: `public.get_commissions_complete_optimized(tenant_uuid, p_date_start, p_date_end, p_office_id, p_seller_id, p_product_id, limit_param, offset_param)`
  - Retorna: `commission_data`, `sale_data`, `recipient_data`, `parent_commission_data` (se houver), além de `summary` agregado.  
  - Segurança: papel do usuário e escopo de acesso; paginação e ordenação por `due_date` e `created_at`.

- Hooks: `useCommissions.ts` e específicos por página  
  - Integram filtros de período, office, seller, produto; exibem resumo (pendente, aprovado, pago).

---

## Fluxo de Dados

1. Usuário acessa `/comissoes` e variantes por office/vendedor.  
2. Frontend consulta RPC consolidada com filtros.  
3. UI exibe tabela detalhada com resumo agregado e paginação.

---

## Performance e Cache

- Elimina 3–4 queries adicionais de busca de venda/destinatário.  
- Agregações no banco fornecem resumo pronto, reduzindo cálculos no cliente.  
- Cache pode ser aplicado a relatórios frequentes; invalidação por mudanças de status.

---

## Segurança e RBAC

- Destinatários visíveis conforme papel e contexto; isolado por tenant.  
- Recomenda-se auditoria de alterações de status e pagamentos.

---

## Riscos e Recomendações

- Filtros combinados podem aumentar custo; validar índices para colunas usadas em WHERE/JOIN.  
- Garantir consistência com vendas aprovadas e pagamentos efetivados.

---

## KPIs Sugeridos

- SLA de geração de relatórios de comissões.  
- Distribuição por status (pendente/aprovado/pago).  
- Valor total por office/vendedor e período.

---

## Referências

- `src/pages/comissoes/*`, `src/hooks/useCommissions.ts`  
- `supabase/migrations/20251002200742_7fab7d74-983c-4b56-b900-0832385ba3ab.sql`  
- `documentacao/alteracoes/fase3-otimizacao-rpcs-02-10-2025.md`