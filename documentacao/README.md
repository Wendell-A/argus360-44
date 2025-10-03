
# Documentação do Sistema Argus360

Sistema de Gestão de Comissões para Consórcios

## Índice

1. [Visão Geral do Sistema](#visão-geral-do-sistema)
2. [Arquitetura](#arquitetura)
3. [Documentação por Tela](#documentação-por-tela)
4. [Banco de Dados](#banco-de-dados)
5. [Fluxos do Sistema](#fluxos-do-sistema)

## Visão Geral do Sistema

O Argus360 é um sistema web desenvolvido em React/TypeScript para gestão de comissões de consórcios, permitindo o controle completo de vendedores, clientes, consórcios e comissões.

### Tecnologias Utilizadas

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **UI Components**: Shadcn/UI, Radix UI
- **Backend**: Supabase (PostgreSQL, Auth, APIs)
- **Gráficos**: Recharts
- **Roteamento**: React Router DOM
- **Estado**: TanStack Query

### Funcionalidades Principais

- Dashboard com métricas e gráficos
- Gestão de Vendedores
- Gestão de Clientes  
- Gestão de Consórcios
- Controle de Comissões
- Relatórios Analíticos
- Configurações do Sistema

## Arquitetura

```
src/
├── components/          # Componentes reutilizáveis
│   ├── ui/             # Componentes base (Shadcn)
│   ├── AppSidebar.tsx  # Menu lateral
│   └── MetricCard.tsx  # Card de métricas
├── pages/              # Páginas do sistema
├── integrations/       # Integrações (Supabase)
├── hooks/              # Hooks customizados
└── lib/               # Utilitários
```

## Documentação por Tela

Cada tela possui documentação detalhada em arquivos separados:

- [Dashboard](./telas/Dashboard.md)
- [Vendedores](./telas/Vendedores.md)
- [Clientes](./telas/Clientes.md)
- [Consórcios](./telas/Consorcios.md)
- [Comissões](./telas/Comissoes.md)
- [Relatórios](./telas/Relatorios.md)

## Banco de Dados

- [Schema do Banco](./database/Schema.md)
- [Relacionamentos](./database/Relacionamentos.md)
- [Funções e Triggers](./database/Funcoes.md)

## Fluxos do Sistema

- [Fluxo de Autenticação](./fluxos/Autenticacao.md)
- [Fluxo de Vendas](./fluxos/Vendas.md)
- [Fluxo de Comissões](./fluxos/Comissoes.md)

## Análises e Arquitetura Otimizada

- [Análise de Valor do Sistema](./analise/analise-valor-sistema-03-10-2025.md)
- [Arquitetura de Consultas Otimizadas](./analise/arquitetura-consultas-otimizadas-03-10-2025.md)
- [Mapa de Rotas e Telas](./telas/mapa-rotas-e-telas-argus360-44-03-10-2025.md)

## Análises por Tela

- [Vendas](./analise/telas/analise-vendas-03-10-2025.md)
- [CRM](./analise/telas/analise-crm-03-10-2025.md)
- [Comissões](./analise/telas/analise-comissoes-03-10-2025.md)
- [Dashboard](./analise/telas/analise-dashboard-03-10-2025.md)
- [Auditoria de Segurança](./analise/telas/analise-auditoria-seguranca-03-10-2025.md)

## Guia e KPIs

- [Guia de Desenvolvimento do Argus360](./guia/guia-desenvolvimento-argus360-03-10-2025.md)
- [KPIs e Benchmarks](./analise/kpis-benchmarks-03-10-2025.md)
