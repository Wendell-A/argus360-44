
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
