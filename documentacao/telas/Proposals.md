# Tela de Orçamentos (Proposals)

**Data de Criação:** 29/09/2025  
**Rota:** `/proposals`  
**Componente Principal:** `src/pages/Proposals.tsx`

## Descrição

Tela dedicada à gestão de orçamentos (proposals) que ainda não foram convertidos em vendas. Permite visualizar, editar, excluir orçamentos e entrar em contato direto com os clientes via WhatsApp.

## Componentes Envolvidos

### Componentes Principais
- **Proposals** (`src/pages/Proposals.tsx`): Componente principal da página
- **ProposalEditModal** (`src/components/proposals/ProposalEditModal.tsx`): Modal para edição de orçamentos
- **ProposalDeleteDialog** (`src/components/proposals/ProposalDeleteDialog.tsx`): Dialog de confirmação de exclusão

### Hooks Customizados
- **useProposalsWithClient**: Busca orçamentos com dados do cliente (JOIN otimizado via view)
- **useProposalsTotalValue**: Calcula a soma total de todos os orçamentos
- **useUpdateProposal**: Atualiza um orçamento existente
- **useDeleteProposal**: Remove um orçamento

## Estrutura de Dados

### Tabela: `proposals`
Contém os dados dos orçamentos:
- `id`: UUID único
- `tenant_id`: ID do tenant
- `office_id`: ID do escritório
- `client_id`: ID do cliente
- `product_id`: ID do produto
- `valor_da_simulacao`: Valor total do orçamento
- `valor_da_parcela`: Valor de cada parcela
- `prazo`: Quantidade de meses
- `data_da_simulacao`: Data da simulação
- `taxa_comissao_escritorio`: % de comissão do escritório
- `taxa_comissao_vendedor`: % de comissão do vendedor

### View: `proposals_with_client_info`
View otimizada que faz JOIN de `proposals` com `clients` para trazer:
- Todos os campos de `proposals`
- `client_name`: Nome do cliente
- `client_phone`: Telefone do cliente
- `client_email`: Email do cliente

## Funcionalidades

### 1. Card de Previsibilidade
- Exibe a soma total de todos os orçamentos em aberto
- Atualiza automaticamente quando orçamentos são criados/editados/excluídos
- Design destacado com gradiente e ícone de tendência

### 2. Listagem de Orçamentos
Tabela com as seguintes colunas:
- **Cliente**: Nome do cliente
- **Valor**: Valor total do orçamento (formatado em R$)
- **Parcela**: Valor de cada parcela (formatado em R$)
- **Prazo**: Quantidade de meses
- **Data**: Data da simulação (formatada)
- **Ações**: Botões de ação

### 3. Busca
- Campo de busca para filtrar orçamentos por nome do cliente
- Filtro em tempo real (client-side)

### 4. Ações por Orçamento

#### WhatsApp
- Ícone: `MessageSquare`
- Abre uma nova aba com link para WhatsApp Web/App
- Formato: `https://wa.me/{TELEFONE_LIMPO}`
- Só aparece se o cliente tiver telefone cadastrado

#### Ver no CRM
- Ícone: `Eye`
- Navega para a página de detalhes do cliente
- Rota: `/clients/{client_id}`

#### Editar
- Ícone: `Edit`
- Abre modal com formulário de edição
- Campos editáveis:
  - Valor da simulação
  - Valor da parcela
  - Prazo
  - Taxa de comissão do escritório
  - Taxa de comissão do vendedor

#### Excluir
- Ícone: `Trash2` (vermelho)
- Abre dialog de confirmação
- Exibe o nome do cliente para confirmação
- Ação irreversível

## Segurança (RLS)

As políticas RLS da tabela `proposals` garantem que:
- Usuários só vejam orçamentos do seu tenant
- Owner/Admin veem todos os orçamentos do tenant
- Manager vê orçamentos dos escritórios sob sua gestão
- User/Viewer vê apenas orçamentos de clientes onde é responsável

## Estados de Loading

- **Skeleton loading** para o card de previsibilidade
- **Skeleton loading** para a tabela de orçamentos
- Estados de loading nos botões dos modais durante operações
- Mensagem amigável quando não há orçamentos

## Formatações

### Moeda (R$)
```typescript
new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
}).format(value)
```

### Data
```typescript
new Date(date).toLocaleDateString('pt-BR')
```

### Telefone para WhatsApp
```typescript
const cleanPhone = phone.replace(/\D/g, ''); // Remove tudo que não é número
```

## Dependências

### UI Components (shadcn/ui)
- Card, CardContent, CardDescription, CardHeader, CardTitle
- Button
- Input
- Table (completo)
- Dialog
- AlertDialog
- Label
- Skeleton

### Icons (lucide-react)
- MessageSquare (WhatsApp)
- Eye (Ver CRM)
- Edit (Editar)
- Trash2 (Excluir)
- TrendingUp (Card de previsibilidade)

### React Query
- useQuery para buscar dados
- useMutation para operações de escrita

## Fluxo de Dados

```
1. Usuário acessa /proposals
2. useProposalsWithClient busca dados via view
3. useProposalsTotalValue calcula soma total
4. Dados renderizados na tabela
5. Ações do usuário:
   - Busca → filtro local
   - WhatsApp → window.open
   - Ver CRM → navigate
   - Editar → abre modal → useUpdateProposal
   - Excluir → abre dialog → useDeleteProposal
6. Após mutações, queries são invalidadas
```

## Melhorias Futuras

1. Paginação para grandes volumes de dados
2. Filtros avançados (por data, valor, produto)
3. Exportação para Excel/PDF
4. Conversão direta de orçamento para venda
5. Histórico de alterações
6. Notificações automáticas para clientes
7. Dashboard de conversão de orçamentos
