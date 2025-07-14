
# Vendedores - Documentação

## RPD (Requisitos, Processos e Dados)

### Requisitos Funcionais
- RF001: Listar todos os vendedores cadastrados
- RF002: Exibir informações de contato (email, telefone)
- RF003: Mostrar performance mensal (vendas e comissões)
- RF004: Permitir adicionar novo vendedor
- RF005: Permitir editar dados do vendedor
- RF006: Visualizar histórico de vendas
- RF007: Filtrar vendedores por status (Ativo/Inativo)

### Requisitos Não Funcionais
- RNF001: Tabela responsiva com scroll horizontal em mobile
- RNF002: Avatar com iniciais para identificação visual
- RNF003: Status visual com badges coloridas

### Processos
1. **Listagem de Vendedores**
   - Sistema busca todos os vendedores
   - Ordena por performance ou nome
   - Exibe em tabela paginada

2. **Cadastro de Vendedor**
   - Formulário com dados pessoais
   - Definição de taxa de comissão
   - Vinculação ao escritório

3. **Edição de Vendedor**
   - Carrega dados existentes
   - Permite alteração
   - Salva modificações

### Dados Utilizados
- Dados pessoais do vendedor
- Informações de contato
- Performance mensal
- Status ativo/inativo
- Taxa de comissão

## Schema de Dados

```typescript
interface Vendedor {
  id: number;
  nome: string;
  email: string;
  telefone: string;
  vendasMes: number;
  comissaoMes: string;
  taxaComissao: string;
  status: 'Ativo' | 'Inativo';
  iniciais: string;
}

interface VendedoresState {
  vendedores: Vendedor[];
  loading: boolean;
  totalVendedores: number;
  comissaoTotal: string;
  vendasMes: number;
}
```

## FlowChart (Fluxo Textual)

```
INÍCIO Vendedores
├── Usuário acessa rota "/vendedores"
├── Sistema carrega componente Vendedores
├── Busca dados dos vendedores
├── Busca métricas resumo
│   ├── Total de vendedores
│   ├── Comissões totais do mês
│   └── Total de vendas do mês
├── Renderiza interface
│   ├── Header com título e botão "Novo Vendedor"
│   ├── Cards de resumo (3 métricas)
│   └── Tabela de vendedores
│       ├── Avatar com iniciais
│       ├── Dados pessoais
│       ├── Informações de contato
│       ├── Performance mensal
│       ├── Taxa de comissão
│       ├── Status (badge)
│       └── Ações (Editar, Ver Vendas)
├── Interações possíveis
│   ├── Clique "Novo Vendedor" → Modal/Página cadastro
│   ├── Clique "Editar" → Modal/Página edição
│   └── Clique "Ver Vendas" → Página histórico
└── FIM
```

## Componentes Utilizados

### Principais
- `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableCell`: Estrutura da tabela
- `Avatar`, `AvatarFallback`: Avatar dos vendedores
- `Badge`: Status e taxa de comissão
- `Button`: Ações e novo vendedor
- `Card`: Cards de métricas

### Ícones
- `Plus`: Novo vendedor
- `Mail`, `Phone`: Informações de contato
- `TrendingUp`, `DollarSign`: Métricas

## Estados e Interações

### Estados
- Lista de vendedores carregada
- Modal de cadastro aberto/fechado
- Modal de edição aberto/fechado
- Filtros aplicados

### Interações
- Adicionar novo vendedor
- Editar vendedor existente
- Visualizar histórico de vendas
- Filtrar por status
- Ordenar tabela

## Validações

### Cadastro/Edição
- Nome obrigatório
- Email válido e único
- Telefone no formato correto
- Taxa de comissão entre 0% e 100%

## Melhorias Futuras
- Busca por nome/email
- Filtros avançados
- Exportação da lista
- Histórico de alterações
- Metas individuais por vendedor
