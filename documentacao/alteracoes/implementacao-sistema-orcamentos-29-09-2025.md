# Implementação do Sistema de Orçamentos - 29/09/2025

## Data e Horário
- **Data**: 29/09/2025
- **Horário**: Implementação completa

## Resumo
Implementação completa do sistema de registro de orçamentos a partir da tela de simulação de consórcios, permitindo cadastrar clientes e registrar propostas comerciais em duas fases.

## Alterações Realizadas

### 1. Banco de Dados - Tabela `proposals`

**Arquivo**: Migration Supabase
**Alteração**: Criação da tabela `proposals` (orçamentos)

**Estrutura da Tabela**:
```sql
CREATE TABLE public.proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  office_id UUID NOT NULL REFERENCES offices(id),
  client_id UUID NOT NULL REFERENCES clients(id),
  product_id UUID NOT NULL,
  valor_da_simulacao NUMERIC NOT NULL,
  valor_da_parcela NUMERIC NOT NULL,
  prazo INTEGER NOT NULL,
  data_da_simulacao DATE NOT NULL,
  taxa_comissao_escritorio NUMERIC NOT NULL,
  taxa_comissao_vendedor NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
)
```

**Políticas RLS Implementadas**:
- **SELECT**: Usuários podem ver orçamentos baseado em contexto (owner/admin: todos, manager: escritórios acessíveis, user/viewer: clientes sob responsabilidade)
- **INSERT**: Usuários podem criar orçamentos dentro do seu contexto
- **UPDATE**: Apenas admins e managers podem atualizar orçamentos

**Índices Criados**:
- `idx_proposals_tenant_id`: Otimiza queries por tenant
- `idx_proposals_client_id`: Otimiza queries por cliente
- `idx_proposals_office_id`: Otimiza queries por escritório
- `idx_proposals_product_id`: Otimiza queries por produto
- `idx_proposals_data_simulacao`: Otimiza queries por data
- `idx_proposals_created_at`: Otimiza queries por data de criação

### 2. Hook `useProposals`

**Arquivo**: `src/hooks/useProposals.ts` (NOVO)

**Funcionalidades**:
- `useProposals()`: Lista todos os orçamentos do tenant com cache
- `useCreateProposal()`: Cria novo orçamento com validação de tenant e escritório
- Gestão automática de cache com React Query
- Feedback visual com toasts de sucesso/erro

**Interface TypeScript**:
```typescript
interface Proposal {
  id: string;
  tenant_id: string;
  office_id: string;
  client_id: string;
  product_id: string;
  valor_da_simulacao: number;
  valor_da_parcela: number;
  prazo: number;
  data_da_simulacao: string;
  taxa_comissao_escritorio: number;
  taxa_comissao_vendedor: number;
  created_at: string;
  updated_at: string;
}
```

### 3. Componente `ProposalModal`

**Arquivo**: `src/components/ProposalModal.tsx` (NOVO)

**Fluxo em Duas Fases**:

#### Fase 1 - Cadastro de Cliente:
- Nome Completo (obrigatório)
- Tipo: Pessoa Física/Jurídica (obrigatório)
- CPF/CNPJ (obrigatório, label dinâmico)
- Email (obrigatório)
- Telefone (obrigatório)

**Ações**:
- Cliente é cadastrado na tabela `clients`
- Status inicial: "prospect"
- Classificação inicial: "warm"
- `client_id` é armazenado para a próxima fase

#### Fase 2 - Registro do Orçamento:
**Campos pré-preenchidos/somente leitura**:
- Valor da Carta de Crédito (da simulação)
- Valor da Parcela (calculado)
- Prazo em meses (do formulário de simulação)

**Campos editáveis**:
- Data da Simulação (padrão: hoje)
- Taxa Comissão Escritório (%)
- Taxa Comissão Vendedor (%)

**Validações**:
- Todos os campos obrigatórios validados
- Taxas de comissão entre 0 e 100%
- Tenant e escritório validados
- Client_id obrigatório

### 4. Integração com Simulação de Consórcios

**Arquivo**: `src/pages/SimulacaoConsorcio.tsx`
**Alteração**: Integração do modal de orçamentos

**Mudanças**:
1. Importação do componente `ProposalModal`
2. Adição de estado para controle do modal
3. Botão "Registrar Orçamento" configurado para abrir modal
4. Desabilita botão se não houver valor ou produto selecionado
5. Passa dados da simulação para o modal via props

**Dados Transmitidos**:
```typescript
{
  creditValue: number,           // Valor da carta de crédito
  monthlyPayment: number,         // Parcela calculada
  term: number,                   // Prazo em meses
  productId: string,              // ID do produto selecionado
  adminRate: number               // Taxa de administração
}
```

## Fluxo de Uso

### Passo a Passo:
1. Usuário preenche simulação de consórcio em `/simulacao-consorcio`
2. Clica no botão "Registrar Orçamento"
3. **Fase 1**: Modal abre com formulário de cliente
   - Preenche dados básicos do cliente
   - Clica em "Próxima Etapa"
   - Cliente é cadastrado no sistema
4. **Fase 2**: Modal exibe formulário de orçamento
   - Dados da simulação aparecem pré-preenchidos (readonly)
   - Usuário ajusta taxas de comissão se necessário
   - Define data da simulação
   - Clica em "Registrar Orçamento"
5. Sistema registra orçamento e exibe confirmação
6. Modal fecha automaticamente

## Segurança e Isolamento

### Multi-tenancy:
- Todos os registros isolados por `tenant_id`
- Validação automática de tenant no backend
- RLS policies garantem acesso contextual

### Controle de Acesso:
- **Owner/Admin**: Visualizam todos os orçamentos do tenant
- **Manager**: Apenas orçamentos dos escritórios gerenciados
- **User/Viewer**: Apenas orçamentos de clientes sob responsabilidade

### Validações:
- Tenant obrigatório em todos os registros
- Escritório obrigatório e validado
- Cliente deve existir antes do orçamento
- Product_id validado (referência externa)

## Arquitetura e Performance

### Otimizações:
- Índices estratégicos para queries frequentes
- Cache de queries com React Query
- Invalidação automática de cache após mutations
- Componentes focados e reutilizáveis

### Responsividade:
- Layout adaptável para mobile e desktop
- Grid responsivo nos formulários
- Modais com scroll para telas pequenas

## Componentes Criados

1. **`src/hooks/useProposals.ts`**: Hook de dados para orçamentos
2. **`src/components/ProposalModal.tsx`**: Modal em duas fases
3. **Migration**: Tabela proposals com RLS e índices

## Componentes Modificados

1. **`src/pages/SimulacaoConsorcio.tsx`**: Integração do modal

## Próximos Passos Sugeridos

1. **Tela de Listagem de Orçamentos**:
   - Criar página dedicada para gerenciar orçamentos
   - Filtros por data, cliente, produto, status
   - Ações de conversão para venda

2. **Dashboard de Orçamentos**:
   - Métricas de conversão
   - Orçamentos por vendedor
   - Taxa de aprovação

3. **Workflow de Aprovação**:
   - Status do orçamento (pendente, aprovado, rejeitado)
   - Notificações para gerentes
   - Histórico de alterações

4. **Exportação de Propostas**:
   - Gerar PDF da proposta
   - Template personalizável
   - Envio por email

## Observações Técnicas

- **Sem Foreign Key para Products**: Tabela `products` não existe no schema atual, mantido como UUID NOT NULL
- **Trigger de Updated_At**: Reutilizado trigger existente do sistema
- **Avisos de Segurança**: Avisos do linter são pré-existentes, não relacionados a esta implementação

---

**Desenvolvedor**: Sistema Lovable AI
**Revisão**: Pendente
**Status**: ✅ Implementado e Funcional
