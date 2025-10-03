# KPIs e Benchmarks do Argus360

Data: 03/10/2025

## Objetivo
Definir KPIs de produto e engenharia, e orientar a execução de benchmarks de performance.

## KPIs por Módulo
- CRM
  - Tempo médio para listar clientes (`p50/p95`)
  - Taxa de conversão por estágio (% por período)
  - Tarefas pendentes por vendedor (média, p95)
- Vendas
  - Latência de listagem de vendas (`p50/p95`)
  - Ticket médio e valor total no período
  - Tempo de criação de venda (UX + backend)
- Comissões
  - Tempo de cálculo/consulta por status
  - Total a receber vs recebido (por mês/escritório)
  - Tempo de aprovação/pagamento (lead time)
- Dashboard
  - Tempo de renderização inicial
  - Número de queries (reduzidas via RPCs)
  - Hit ratio de cache Redis
- Auditoria de Segurança
  - Incidentes bloqueados por RLS/RBAC
  - Tempo de resposta de auditorias
  - Cobertura de policies por tabela

## Benchmarks de Performance
- Metodologia
  - Ambiente com dados realistas (N clientes, M vendas, K comissões)
  - Medir latência e throughput com/sem cache
  - Executar 3 rodadas por cenário; usar `p50/p95` e desvio padrão
- Cenários
  - CRM com 10k clientes, 50k interações, 5k tarefas
  - Vendas com 20k registros (diversos produtos/escritórios)
  - Comissões: 100k registros (pendentes/aprovadas/pagas)
  - Dashboard com agregações por período e filtros diversos
- Métricas coletadas
  - Latência RPC (server-side)
  - Latência render (client-side)
  - Taxa de acertos de cache
  - Utilização de índices (explain/analyze)

## Metas Sugeridas (SLOs)
- Latência p95 por RPC crítica < 600ms
- Tempo de render inicial de telas principais < 1.5s
- Hit ratio de cache > 70%
- Redução de queries por tela > 70%

## Ferramentas
- `k6` ou `Artillery` para carga
- `Supabase` logs e `EXPLAIN ANALYZE` para SQL
- `Lighthouse` para métricas frontend

## Referências
- `documentacao/analise/arquitetura-consultas-otimizadas-03-10-2025.md`
- `documentacao/analise/diagnostico-performance-seguranca-completo-02-10-2025.md`
- Análises por tela em `documentacao/analise/telas/*`