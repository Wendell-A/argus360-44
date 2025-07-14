
# Clientes - Documentação

## RPD (Requisitos, Processos e Dados)

### Requisitos Funcionais
- RF001: Listar todos os clientes cadastrados
- RF002: Distinguir Pessoa Física e Pessoa Jurídica
- RF003: Exibir vendedor responsável
- RF004: Mostrar última compra e valor total
- RF005: Permitir busca por nome, CNPJ/CPF
- RF006: Filtrar por status (Ativo, Prospect, Inativo)
- RF007: Permitir cadastro de novo cliente
- RF008: Visualizar histórico de compras

### Requisitos Não Funcionais
- RNF001: Busca em tempo real conforme digitação
- RNF002: Filtros visuais com destaque
- RNF003: Formatação automática de CNPJ/CPF

### Processos
1. **Listagem de Clientes**
   - Sistema busca todos os clientes
   - Aplica filtros selecionados
   - Ordena por relevância

2. **Busca de Clientes**
   - Busca em tempo real
   - Pesquisa por nome, CNPJ/CPF
   - Destaca resultados

3. **Cadastro de Cliente**
   - Formulário adaptado para PF/PJ
   - Validação de documentos
   - Vinculação ao vendedor

### Dados Utilizados
- Dados pessoais/empresariais
- Documentos (CPF/CNPJ)
- Histórico de compras
- Vendedor responsável
- Status do relacionamento

## Schema de Dados

```typescript
interface Cliente {
  id: number;
  nome: string;
  cnpj: string; // CPF para PF
  vendedor: string;
  ultimaCompra: string;
  valorTotal: string;
  status: 'Ativo' | 'Prospect' | 'Inativo';
  tipo: 'Pessoa Física' | 'Pessoa Jurídica';
}

interface ClientesState {
  clientes: Cliente[];
  filtroAtivo: string;
  termoBusca: string;
  loading: boolean;
  metricas: {
    totalClientes: number;
    clientesAtivos: number;
    prospects: number;
    valorTotal: string;
  };
}
```

## FlowChart (Fluxo Textual)

```
INÍCIO Clientes
├── Usuário acessa rota "/clientes"
├── Sistema carrega componente Clientes
├── Busca dados dos clientes
├── Busca métricas resumo
│   ├── Total de clientes
│   ├── Clientes ativos
│   ├── Prospects em negociação
│   └── Valor total da carteira
├── Renderiza interface
│   ├── Header com título e botão "Novo Cliente"
│   ├── Cards de resumo (4 métricas)
│   ├── Barra de busca e filtros
│   │   ├── Campo de busca com ícone
│   │   └── Botões de filtro por status
│   └── Tabela de clientes
│       ├── Nome e ID
│       ├── CNPJ/CPF formatado
│       ├── Tipo (PF/PJ) com badge
│       ├── Vendedor responsável
│       ├── Data última compra
│       ├── Valor total (destaque verde)
│       ├── Status com badge colorida
│       └── Ações (Editar, Histórico)
├── Interações possíveis
│   ├── Digitação na busca → Filtra em tempo real
│   ├── Clique nos filtros → Aplica filtro de status
│   ├── Clique "Novo Cliente" → Modal/Página cadastro
│   ├── Clique "Editar" → Modal/Página edição
│   └── Clique "Histórico" → Página histórico compras
└── FIM
```

## Componentes Utilizados

### Principais
- `Input`: Campo de busca
- `Table`: Listagem de clientes
- `Badge`: Status e tipo de pessoa
- `Button`: Filtros e ações
- `Card`: Cards de métricas

### Ícones
- `Search`: Busca
- `Plus`: Novo cliente
- `Users`, `Building2`, `HandCoins`: Métricas

## Estados e Interações

### Estados
- Lista de clientes carregada
- Filtro ativo selecionado
- Termo de busca atual
- Modal de cadastro/edição

### Interações
- Busca em tempo real
- Filtros por status
- Cadastro de novo cliente
- Edição de cliente
- Visualização de histórico

## Validações

### Cadastro/Edição
- Nome obrigatório
- CNPJ válido para PJ
- CPF válido para PF
- Email válido se informado
- Vendedor responsável obrigatório

## Formatações
- CNPJ: XX.XXX.XXX/XXXX-XX
- CPF: XXX.XXX.XXX-XX
- Valores monetários: R$ X.XXX,XX

## Melhorias Futuras
- Importação de clientes via CSV
- Histórico de interações
- Segmentação de clientes
- Mapa de localização
- Integração com CRM externo
