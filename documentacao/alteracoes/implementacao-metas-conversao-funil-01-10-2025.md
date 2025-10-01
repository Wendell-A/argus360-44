# Implementação de Metas de Conversão do Funil de Vendas - 01/10/2025

## Resumo Executivo
Implementado sistema completo de metas de conversão baseado no funil de vendas CRM, permitindo que tenants configurem etapas inicial e final do funil e acompanhem taxas de conversão através de metas específicas e widgets no dashboard.

---

## Índice
1. [Backend - Estrutura do Banco de Dados](#1-backend---estrutura-do-banco-de-dados)
2. [Backend - Função RPC de Cálculo](#2-backend---função-rpc-de-cálculo)
3. [Frontend - Sistema de Metas](#3-frontend---sistema-de-metas)
4. [Frontend - Widget de Conversão](#4-frontend---widget-de-conversão)
5. [Frontend - Integração Dashboard](#5-frontend---integração-dashboard)
6. [Frontend - Configuração do Funil](#6-frontend---configuração-do-funil)
7. [Segurança e RLS](#7-segurança-e-rls)
8. [Guia de Uso](#8-guia-de-uso)
9. [Arquivos Criados](#9-arquivos-criados)
10. [Arquivos Modificados](#10-arquivos-modificados)

---

## 1. Backend - Estrutura do Banco de Dados

### 1.1 Migração: Colunas de Configuração do Funil
**Arquivo de Migração:** `supabase/migrations/YYYYMMDDHHMMSS_add_conversion_goal_feature.sql`

```sql
-- Adicionar colunas para identificar etapas inicial e final do funil
ALTER TABLE public.sales_funnel_stages
ADD COLUMN IF NOT EXISTS is_initial_stage BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS is_final_stage BOOLEAN NOT NULL DEFAULT false;

-- Documentação das colunas
COMMENT ON COLUMN public.sales_funnel_stages.is_initial_stage IS 
  'Indica se esta etapa é o início do funil para cálculo de conversão';
COMMENT ON COLUMN public.sales_funnel_stages.is_final_stage IS 
  'Indica se esta etapa é o fim do funil para cálculo de conversão';

-- Índices para otimizar consultas de conversão
CREATE INDEX IF NOT EXISTS idx_sales_funnel_stages_initial 
  ON public.sales_funnel_stages(tenant_id, is_initial_stage) 
  WHERE is_initial_stage = true;
  
CREATE INDEX IF NOT EXISTS idx_sales_funnel_stages_final 
  ON public.sales_funnel_stages(tenant_id, is_final_stage) 
  WHERE is_final_stage = true;

-- Índice para consultas de metas de conversão
CREATE INDEX IF NOT EXISTS idx_goals_type 
  ON public.goals(tenant_id, goal_type) 
  WHERE goal_type = 'conversion';
```

### 1.2 Tipo de Meta: Conversão
O tipo `'conversion'` foi adicionado à coluna `goal_type` da tabela `goals` (VARCHAR), permitindo criação de metas baseadas em quantidade de conversões.

**Validações:**
- `target_amount` para metas de conversão deve ser número inteiro (quantidade de clientes)
- Apenas uma etapa pode ser marcada como `is_initial_stage` por tenant
- Apenas uma etapa pode ser marcada como `is_final_stage` por tenant

---

## 2. Backend - Função RPC de Cálculo

### 2.1 Função `get_conversion_rate_summary`
**Arquivo:** Mesma migração acima

```sql
CREATE OR REPLACE FUNCTION public.get_conversion_rate_summary(
  p_tenant_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE (
  current_conversions INTEGER,
  conversion_goal NUMERIC,
  conversion_rate NUMERIC,
  total_entered INTEGER,
  progress_percentage NUMERIC
)
```

**Lógica de Cálculo:**
1. **Busca etapas configuradas:** Identifica `is_initial_stage` e `is_final_stage` do tenant
2. **Conta entradas:** Clientes que entraram na etapa inicial no período
3. **Conta conversões:** Clientes que chegaram à etapa final no período E passaram pela inicial
4. **Busca meta ativa:** Meta de tipo `'conversion'` ativa no período
5. **Calcula métricas:**
   - Taxa de conversão: (convertidos / entradas) × 100
   - Progresso: (convertidos / meta) × 100

**Segurança:**
- `SECURITY DEFINER` com `search_path = public`
- `STABLE` - não modifica dados
- `GRANT EXECUTE` para `authenticated`
- Retorna zeros se etapas não configuradas

**Performance:**
- Usa índices criados em `sales_funnel_stages`
- Filtra por `tenant_id` primeiro
- Usa `EXISTS` para verificar passagem pela etapa inicial

---

## 3. Frontend - Sistema de Metas

### 3.1 Hook: `useGoals.ts`
**Modificações:**

```typescript
// Tipos atualizados
type Goal = {
  // ... campos existentes
  goal_type: 'office' | 'individual' | 'conversion';
}

type GoalStats = {
  // ... stats existentes
  conversionGoals: number;
}
```

### 3.2 Componente: `GoalModal.tsx`
**Modificações:**

```typescript
// Novo item no Select de tipo de meta
<SelectItem value="conversion">Contagem de Conversão</SelectItem>

// Campo de valor ajustado para conversão
<Input
  type="number"
  step={formData.goal_type === 'conversion' ? '1' : '0.01'}
  placeholder={formData.goal_type === 'conversion' ? '0' : '0.00'}
/>

// Validação no submit
const targetAmount = formData.goal_type === 'conversion' 
  ? Math.floor(Number(formData.target_amount))
  : Number(formData.target_amount);
```

**Validação Client-Side:**
- Campo de valor aceita apenas números inteiros quando tipo = 'conversion'
- Texto de ajuda explicativo: "Número de clientes que devem converter do início ao fim do funil"
- Uso do schema `zod` implícito via React Hook Form

---

## 4. Frontend - Widget de Conversão

### 4.1 Hook: `useConversionRateSummary.ts`
**Arquivo Criado:** `src/hooks/useConversionRateSummary.ts`

```typescript
export const useConversionRateSummary = ({ 
  startDate, 
  endDate 
}: UseConversionRateSummaryParams = {}) => {
  // Usa período do mês atual se não especificado
  // Cache: 2 minutos
  // Chama RPC get_conversion_rate_summary
}
```

**Características:**
- Retorna dados padronizados (zeros) se não houver configuração
- Cache inteligente de 2 minutos
- Tratamento de erros robusto
- `refetchOnWindowFocus: false`

### 4.2 Componente: `ConversionRateWidget.tsx`
**Arquivo Criado:** `src/components/dashboard/ConversionRateWidget.tsx`

**Estrutura Visual:**
```
┌─────────────────────────────────────┐
│ 🎯 Taxa de Conversão do Funil       │
├─────────────────────────────────────┤
│                                     │
│   7 / 10        Progress: 70.0%    │
│   ▓▓▓▓▓▓▓░░░   ← Barra de progresso│
│                                     │
│   📊 Taxa: 35.0%  👥 Entradas: 20  │
│                                     │
│   ⚠️ Alertas informativos           │
└─────────────────────────────────────┘
```

**Estados:**
- Loading: Spinner animado
- Erro: Alert com mensagem de configuração
- Sem meta: Alert amarelo sugerindo criar meta
- Sem dados: Alert informativo sobre configuração de etapas
- Com dados: Exibição completa das métricas

**Cores Dinâmicas:**
- Verde: progresso ≥ 100%
- Amarelo: progresso ≥ 70%
- Padrão: progresso < 70%

---

## 5. Frontend - Integração Dashboard

### 5.1 Tipo de Métrica Atualizado
**Arquivo:** `src/hooks/useDashboardPersonalization.ts`

```typescript
export interface MetricConfig {
  // ... campos existentes
  type: 'sales' | 'commissions' | 'clients' | 'sellers' | 
        'goals' | 'products' | 'conversion_rate';
}
```

### 5.2 Modal de Configuração
**Arquivo:** `src/components/DashboardConfigModal.tsx`

```typescript
// Nova opção no Select
<SelectItem value="conversion_rate">Taxa de Conversão</SelectItem>
```

### 5.3 Renderização no Dashboard
**Arquivo:** `src/components/ConfigurableDashboard.tsx`

```typescript
// Lógica especial para widget de conversão
{activeConfig.widget_configs.metrics.map((metric) => {
  if (metric.type === 'conversion_rate') {
    return (
      <div key={metric.id} className="col-span-1 md:col-span-2">
        <ConversionRateWidget />
      </div>
    );
  }
  return <DynamicMetricCard ... />;
})}
```

**Layout:**
- Widget de conversão ocupa 2 colunas (maior destaque)
- Outros widgets mantêm 1 coluna
- Grid responsivo: 1 col (mobile), 2 cols (tablet), 4 cols (desktop)

---

## 6. Frontend - Configuração do Funil

### 6.1 Hook: `useFunnelStageConfig.ts`
**Arquivo Criado:** `src/hooks/useFunnelStageConfig.ts`

**Funções:**

```typescript
// Atualizar configuração de etapa
export function useUpdateFunnelStageConfig()

// Limpar configuração de etapa
export function useClearFunnelStageConfig()
```

**Validações:**
- Schema Zod para validação de entrada
- stageId deve ser UUID válido
- Apenas uma etapa inicial por tenant (auto-desmarca outras)
- Apenas uma etapa final por tenant (auto-desmarca outras)

**Segurança:**
- Valida `tenant_id` do contexto
- Usa transações para garantir consistência
- Logs detalhados para auditoria

### 6.2 Componente: `FunnelStageConfigModal.tsx`
**Arquivo Criado:** `src/components/crm/FunnelStageConfigModal.tsx`

**Interface do Usuário:**
```
┌────────────────────────────────────────────┐
│ 🎯 Configurar Funil de Conversão           │
├────────────────────────────────────────────┤
│ ℹ️ A taxa de conversão mede quantos...    │
│                                            │
│ ✅ Configuração completa! Você pode...    │
│                                            │
│ Etapas do Funil:                          │
│ ┌────────────────────────────────────┐   │
│ │ 🔵 Lead                             │   │
│ │ Potenciais clientes identificados  │   │
│ │           [Etapa Inicial] ☑️       │   │
│ │           [Etapa Final]   ☐        │   │
│ └────────────────────────────────────┘   │
│ ┌────────────────────────────────────┐   │
│ │ 🟢 Fechado        [FIM]            │   │
│ │ Venda concluída com sucesso        │   │
│ │           [Etapa Inicial] ☐        │   │
│ │           [Etapa Final]   ☑️       │   │
│ └────────────────────────────────────┘   │
│                                            │
│                       [Fechar]             │
└────────────────────────────────────────────┘
```

**Características:**
- Sincronização automática com estado do banco
- Alertas informativos contextuais
- Visual destacado para etapas selecionadas
- Switches para seleção intuitiva
- Cores das etapas preservadas visualmente

### 6.3 Integração na Página CRM
**Arquivo:** `src/pages/CRM.tsx`

**Modificações:**
```typescript
// Estado
const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
const { activeTenant } = useAuth();
const canConfigure = activeTenant && ['owner', 'admin'].includes(activeTenant.user_role || '');

// Botão no header (apenas para admin/owner)
<Button onClick={() => setIsConfigModalOpen(true)}>
  <Settings /> Configurar Conversão
</Button>

// Modal
<FunnelStageConfigModal
  open={isConfigModalOpen}
  onOpenChange={setIsConfigModalOpen}
  stages={stages}
/>
```

**Controle de Acesso:**
- Botão visível apenas para roles: `owner` e `admin`
- Modal só renderiza se `canConfigure === true`
- Verificação baseada em `activeTenant.user_role`

---

## 7. Segurança e RLS

### 7.1 Políticas RLS da Tabela `sales_funnel_stages`

**Política de SELECT:**
```sql
-- Usuários podem ver etapas de funil do seu tenant
CREATE POLICY "Users can view sales funnel stages in their tenants"
ON public.sales_funnel_stages
FOR SELECT
USING (tenant_id = ANY (get_user_tenant_ids(auth.uid())));
```

**Política de INSERT/UPDATE/DELETE:**
```sql
-- Apenas admin/owner podem gerenciar etapas
CREATE POLICY "Admins can manage sales funnel stages"
ON public.sales_funnel_stages
FOR ALL
USING (
  tenant_id = ANY (get_user_tenant_ids(auth.uid())) 
  AND get_user_role_in_tenant(auth.uid(), tenant_id) = ANY (ARRAY['owner'::user_role, 'admin'::user_role])
);
```

### 7.2 Avisos de Segurança do Linter

**Status Atual:** 15 avisos (pré-existentes, não introduzidos por esta feature)

**Avisos Relevantes (Pré-existentes):**
1. **Security Definer View** (ERROR) - Views com SECURITY DEFINER
2. **Function Search Path Mutable** (WARN) - Funções antigas sem search_path fixo
3. **Extension in Public** (WARN) - Extensões no schema public
4. **Auth OTP long expiry** (WARN) - Configuração de Auth
5. **Leaked Password Protection Disabled** (WARN) - Configuração de Auth
6. **Current Postgres version has security patches** (WARN) - Atualização de versão

**Novos Elementos com Segurança Implementada:**
- ✅ `get_conversion_rate_summary`: `SECURITY DEFINER` + `search_path = public`
- ✅ Validação Zod client-side em `useFunnelStageConfig`
- ✅ Verificação de roles para configuração do funil
- ✅ Políticas RLS adequadas mantidas

### 7.3 Validações Implementadas

**Backend:**
- RLS policies isolam dados por tenant
- Função RPC valida tenant_id
- Índices garantem performance sem expor dados

**Frontend:**
- Validação Zod de UUIDs e tipos booleanos
- Verificação de roles (`owner`/`admin`) para configuração
- Sanitização de inputs numéricos
- Tratamento de erros com mensagens não-verbosas

**Não há problemas de segurança introduzidos por esta implementação.**

---

## 8. Guia de Uso

### 8.1 Configurar Funil de Conversão

**Passo 1:** Acessar CRM
- Navegar para `/crm`
- Clicar em **"Configurar Conversão"** (botão no header)

**Passo 2:** Selecionar Etapas
- Marcar **Etapa Inicial**: Primeira etapa do funil (ex: "Lead")
- Marcar **Etapa Final**: Última etapa do funil (ex: "Fechado")
- Sistema auto-desmarca outras etapas para garantir unicidade

**Passo 3:** Confirmar
- Clicar em "Fechar"
- Configuração salva automaticamente

### 8.2 Criar Meta de Conversão

**Passo 1:** Acessar Metas
- Navegar para `/metas`
- Clicar em **"Nova Meta"**

**Passo 2:** Configurar Meta
- **Tipo de Meta:** Selecionar "Contagem de Conversão"
- **Quantidade de Conversões:** Inserir número inteiro (ex: 10)
- **Período:** Definir data início e fim
- **Status:** Ativa
- **Descrição:** (Opcional)

**Passo 3:** Salvar
- Clicar em "Salvar"
- Meta aparecerá na lista de metas

### 8.3 Adicionar Widget ao Dashboard

**Passo 1:** Configurar Dashboard
- Navegar para `/` (Dashboard)
- Clicar em **"Configurar"** (apenas admin/owner)

**Passo 2:** Adicionar Métrica
- Aba **"Métricas"**
- Clicar em **"Adicionar Métrica"**
- **Tipo de Dado:** Selecionar "Taxa de Conversão"
- **Título:** "Taxa de Conversão do Funil" (ou personalizar)

**Passo 3:** Salvar Configuração
- Clicar em "Salvar Configuração"
- Widget aparecerá no dashboard

### 8.4 Interpretar Métricas

**Widget Mostra:**
- **Conversões Atuais / Meta:** 7 / 10 (70% de progresso)
- **Taxa de Conversão:** 35.0% (7 convertidos de 20 que entraram)
- **Total de Entradas:** 20 clientes entraram na etapa inicial
- **Barra de Progresso:** Visual do progresso em relação à meta

**Alertas:**
- 🟡 Sem meta configurada: Criar em `/metas`
- ℹ️ Sem dados: Configurar etapas em `/crm`
- 🟢 Configuração completa: Tudo OK!

---

## 9. Arquivos Criados

### Backend
1. **Migração:** `supabase/migrations/YYYYMMDDHHMMSS_add_conversion_goal_feature.sql`
   - Colunas `is_initial_stage`, `is_final_stage`
   - Função RPC `get_conversion_rate_summary`
   - Índices de performance

### Frontend - Hooks
2. **`src/hooks/useConversionRateSummary.ts`**
   - Hook para chamar RPC de conversão
   - Cache inteligente
   - Tratamento de erros

3. **`src/hooks/useFunnelStageConfig.ts`**
   - Hook para configurar etapas do funil
   - Validação Zod
   - Mutações para update/clear

### Frontend - Componentes
4. **`src/components/dashboard/ConversionRateWidget.tsx`**
   - Widget visual de taxa de conversão
   - Exibição de métricas
   - Alertas contextuais

5. **`src/components/crm/FunnelStageConfigModal.tsx`**
   - Modal de configuração de etapas
   - Interface intuitiva com switches
   - Sincronização automática

### Documentação
6. **`documentacao/alteracoes/implementacao-metas-conversao-funil-01-10-2025.md`**
   - Este documento completo

---

## 10. Arquivos Modificados

### Backend
*Nenhum arquivo backend modificado, apenas adições via migração.*

### Frontend - Hooks
1. **`src/hooks/useGoals.ts`**
   - Tipo `Goal`: Adicionado `'conversion'` ao `goal_type`
   - Tipo `GoalInsert`: Idem
   - Tipo `GoalStats`: Adicionado `conversionGoals: number`
   - Função `useGoalStats`: Atualizada contagem de `conversionGoals`

2. **`src/hooks/useDashboardPersonalization.ts`**
   - Interface `MetricConfig`: Adicionado `'conversion_rate'` ao tipo `type`

### Frontend - Componentes
3. **`src/components/GoalModal.tsx`**
   - Select de tipo: Adicionado item "Contagem de Conversão"
   - Campo valor: Ajustado `step` e `placeholder` para conversão
   - Texto de ajuda explicativo
   - Submit: Validação para arredondar valor inteiro em conversão

4. **`src/components/DashboardConfigModal.tsx`**
   - Select de tipo de dado: Adicionado item "Taxa de Conversão"

5. **`src/components/ConfigurableDashboard.tsx`**
   - Import: Adicionado `ConversionRateWidget`
   - Renderização: Lógica condicional para widget de conversão (2 colunas)

6. **`src/pages/CRM.tsx`**
   - Imports: Adicionados `Button`, `Settings`, `FunnelStageConfigModal`, `useAuth`
   - Estado: Adicionado `isConfigModalOpen`, `canConfigure`
   - Header: Botão "Configurar Conversão" (condicional)
   - Modal: Renderização do `FunnelStageConfigModal`

---

## Checklist de Implementação

- [x] **Etapa 1:** Backend - Migração de colunas e índices
- [x] **Etapa 2:** Backend - Função RPC de cálculo
- [x] **Etapa 3:** Frontend - Atualização sistema de metas
- [x] **Etapa 4:** Frontend - Criação de widget de conversão
- [x] **Etapa 5:** Frontend - Integração ao dashboard
- [x] **Etapa 6:** Frontend - Interface de configuração do funil
- [x] **Segurança:** Revisão de RLS e validações
- [x] **Documentação:** Guia completo de implementação

---

## Observações Finais

### Performance
- Índices criados garantem consultas rápidas
- Cache de 2 minutos no frontend reduz chamadas ao banco
- RPC otimizada com `STABLE` e `SECURITY DEFINER`

### Manutenibilidade
- Código bem documentado e modularizado
- Hooks reutilizáveis
- Componentes com responsabilidade única
- Validações centralizadas

### Escalabilidade
- Suporta múltiplos tenants sem conflito
- Configuração por tenant permite personalização
- Sistema de metas flexível

### Próximos Passos (Sugestões)
- [ ] Adicionar histórico de mudanças de configuração do funil
- [ ] Criar relatórios de conversão por período
- [ ] Implementar alertas automáticos de conversão baixa
- [ ] Dashboard de análise de funil (tempo médio por etapa)

---

**Data de Implementação:** 01/10/2025  
**Desenvolvedor:** Sistema Lovable AI  
**Status:** ✅ Implementado e Testado  
**Versão:** 1.0.0
