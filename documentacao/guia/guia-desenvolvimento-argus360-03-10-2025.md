# Guia de Desenvolvimento do Argus360

Data: 03/10/2025

## Objetivo
Orientar desenvolvedores sobre setup, padrões e práticas do Argus360, cobrindo arquitetura, segurança, performance e fluxo de trabalho.

## Setup do Ambiente
- Requisitos: `Node 18+`, `pnpm` ou `npm`, conta Supabase com projeto configurado
- Variáveis: `.env` com `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `REDIS_URL` (se aplicável)
- Rodar local: `pnpm install` e `pnpm dev`; testes unitários: `pnpm test`

## Arquitetura Frontend
- Base: React 18 + TypeScript + Tailwind + Shadcn/UI
- Roteamento: `react-router-dom` com rotas públicas, protegidas e admin
- Estado: TanStack Query para dados do Supabase com cache e invalidation
- Padrões de pastas: `src/pages`, `src/hooks`, `src/components/ui`, `src/lib`, `src/integrations`

## Integração com Supabase
- Autenticação: Supabase Auth; contexto do usuário via hooks (`useUserContext`)
- Dados: RPCs otimizadas com `security definer` e RLS no banco
- Padrão de hooks: `useCached*` para chamadas que usam cache Redis; `use*Optimized` para RPC direta

## Segurança e RBAC
- RBAC: Checagens por role e por escritórios acessíveis no backend (SQL/RPC) e no frontend (guards)
- RLS: Todas as tabelas sensíveis com policies por `tenant_id`
- Boas práticas: Nunca confiar apenas no frontend para autorização; preferir RPCs com segurança

## Performance
- Consultas: Usar RPCs otimizadas (`get_*_optimized`) para evitar N+1
- Cache: Redis com estratégia cache-aside nos hooks `useCached*`
- Paginação e limites: Respeitar `limit_param`, `offset` e filtros; evitar trazer campos não usados
- Lazy rendering: Skeletons e carregamento incremental para listas longas

## Padrões de Código
- TypeScript estrito; evitar `any`
- Componentização: UI reaproveitável e sem lógica de dados acoplada
- Nomenclatura: Consistente com domínio (ex.: `Seller`, `Commission`, `CRMClient`)
- Estilo: Seguir convenções existentes e utilitários do design system

## Testes
- Unidades: Funções puras, utils e transformações de dados
- Integração: Hooks com mocks de Supabase/Redis
- E2E (opcional): Fluxos críticos (login, CRM, vendas, comissões)

## Fluxo de Trabalho
- Branching: Feature branches; PRs pequenos e focados
- Commits: Mensagens descritivas; evitar commits múltiplos não relacionados
- Revisões: Código limpo, testes passando, sem regressões de performance

## Uso de RPCs Otimizadas (exemplos)
- `get_crm_complete_optimized`: clientes, funil, interações, tarefas, vendas
- `get_sales_complete_optimized`: venda + cliente + vendedor + produto + escritório
- `get_funnel_stats_optimized`: agregados por estágio do funil
- `get_commissions_complete_optimized`: resumo por status e escritórios

## Boas Práticas de Hooks
- `useCached*`: implementar chave de cache com `tenant_id` e filtros
- Invalidation: invalidar por evento relevante (ex.: criação/edição/alteração de status)
- Seletor: mapear RPC → estrutura consumida pelo componente

## Observabilidade
- Logs: erros de RPC e tempos de resposta
- Métricas: hit ratio do cache, latência média, erro por rota/tela
- Alertas: thresholds de latência e taxa de erro por módulo

## Referências
- `documentacao/analise/arquitetura-consultas-otimizadas-03-10-2025.md`
- `documentacao/analise/diagnostico-performance-seguranca-completo-02-10-2025.md`
- Hooks: `src/hooks/useCachedCRM.ts`, `src/hooks/useCachedSales.ts`