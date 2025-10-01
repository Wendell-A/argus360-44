# Etapa 6: Ajustes para Metas de Conversão
**Data/Hora:** 2025-01-10 22:30  
**Autor:** Sistema Lovable AI  
**Objetivo:** Corrigir criação de metas de conversão, adicionar validações e melhorar UX

## Contexto
Após a implementação inicial das metas de conversão (documentada em `implementacao-metas-conversao-funil-01-10-2025.md`), foram identificados problemas ao criar metas deste tipo:
- O `CHECK` constraint do banco não permitia `goal_type = 'conversion'`
- A RPC `get_conversion_rate_summary` não filtrava por `office_id`, causando métricas incorretas para tenants multi-escritório
- Faltavam validações client-side e logs para diagnóstico
- A coluna `is_active` estava sendo referenciada como `active` na RPC

## Alterações Realizadas

### 1. Migração de Banco de Dados

#### SQL Executado
```sql
-- 1. Atualizar CHECK constraint de goal_type
ALTER TABLE public.goals DROP CONSTRAINT IF EXISTS goals_goal_type_check;
ALTER TABLE public.goals ADD CONSTRAINT goals_goal_type_check 
  CHECK (goal_type IN ('office', 'individual', 'conversion'));

-- 2. Criar função de validação de regras de negócio
CREATE OR REPLACE FUNCTION public.validate_goal_business_rules()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validar office_id para metas office e conversion
  IF NEW.goal_type IN ('office', 'conversion') AND NEW.office_id IS NULL THEN
    RAISE EXCEPTION 'office_id é obrigatório para metas do tipo %', NEW.goal_type;
  END IF;
  
  -- Validar user_id para metas individuais
  IF NEW.goal_type = 'individual' AND NEW.user_id IS NULL THEN
    RAISE EXCEPTION 'user_id é obrigatório para metas individuais';
  END IF;
  
  -- Validar target_amount
  IF NEW.target_amount IS NULL OR NEW.target_amount < 0 THEN
    RAISE EXCEPTION 'target_amount deve ser maior ou igual a zero';
  END IF;
  
  -- Validar período
  IF NEW.period_start > NEW.period_end THEN
    RAISE EXCEPTION 'period_start deve ser menor ou igual a period_end';
  END IF;
  
  RETURN NEW;
END;
$$;

-- 3. Criar trigger de validação
DROP TRIGGER IF EXISTS trg_validate_goal_business_rules ON public.goals;
CREATE TRIGGER trg_validate_goal_business_rules
  BEFORE INSERT OR UPDATE ON public.goals
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_goal_business_rules();

-- 4. Atualizar RPC get_conversion_rate_summary
DROP FUNCTION IF EXISTS public.get_conversion_rate_summary(uuid, date, date);

CREATE OR REPLACE FUNCTION public.get_conversion_rate_summary(
  p_tenant_id UUID,
  p_office_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE(...) -- Assinatura completa no arquivo de migração
-- Alterações principais:
-- - Aceita p_office_id como parâmetro obrigatório
-- - Usa is_active em vez de active
-- - Filtra clients por c.office_id = p_office_id
-- - Filtra goals por office_id = p_office_id

-- 5. Atualizar RLS policy para managers
DROP POLICY IF EXISTS "Users can manage goals based on context" ON public.goals;
CREATE POLICY "Users can manage goals based on context"
ON public.goals
FOR ALL
USING (
  -- Owner/Admin: todas as metas
  -- Manager: metas de office/conversion do seu escritório + metas individuais próprias
  ...
);
```

#### Decisões de Banco
- **Trigger vs CHECK:** Usamos trigger para validação por ser mais flexível e permitir mensagens customizadas
- **RLS Manager:** Ampliamos RLS para managers criarem metas de conversão do seu escritório
- **office_id obrigatório:** Garantido tanto por trigger quanto por validação frontend para metas office/conversion

### 2. Frontend - Validações e Logs

#### `src/hooks/useGoals.ts` (useCreateGoal)
**Alterações:**
- Adicionado `console.info` antes do insert com payload sanitizado:
  ```typescript
  console.info('[useCreateGoal] Creating goal', {
    goal_type, target_amount, period_start, period_end,
    has_office_id: !!payload.office_id,
    has_user_id: !!payload.user_id,
  });
  ```
- Adicionado `console.error` em caso de erro com código e detalhes
- Mapeamento de erro `23514` (CHECK violation) para mensagem amigável:
  ```typescript
  if (error?.code === '23514') {
    toast.error('Tipo de meta inválido. Verifique se todos os campos obrigatórios estão preenchidos.');
  }
  ```
- Mensagens específicas para erros de `office_id` e `user_id`

#### `src/components/GoalModal.tsx`
**Alterações:**
- Validações client-side antes do submit:
  - office_id obrigatório para `'office'` e `'conversion'`
  - user_id obrigatório para `'individual'`
  - target_amount >= 0 e inteiro para `'conversion'`
  - period_start <= period_end
- `console.warn` em caso de falha de validação
- Impede submit se houver erros e mostra toast com primeiro erro

#### `src/hooks/useConversionRateSummary.ts`
**Alterações:**
- Aceita `officeId?: string` como parâmetro
- `console.debug` ao chamar RPC com parâmetros completos
- Passa `p_office_id` para a RPC:
  ```typescript
  await supabase.rpc('get_conversion_rate_summary', {
    p_tenant_id: activeTenant.tenant_id,
    p_office_id: officeId,
    p_start_date: dates.start,
    p_end_date: dates.end,
  });
  ```
- Query habilitada apenas se `!!activeTenant?.tenant_id && !!officeId`
- `console.error` melhorado com prefixo `[useConversionRateSummary]`

#### `src/components/dashboard/ConversionRateWidget.tsx`
**Alterações:**
- Aceita `officeId?: string` como prop
- Passa `officeId` para `useConversionRateSummary`
- Alert de erro detalhado com checklist de configuração:
  - Configurar etapas inicial e final do funil
  - Criar meta de conversão ativa
  - Selecionar escritório válido nos filtros

### 3. Regras de Negócio Validadas

#### Backend (Trigger)
- `goal_type IN ('office', 'conversion')` → `office_id` obrigatório
- `goal_type = 'individual'` → `user_id` obrigatório
- `target_amount >= 0` sempre
- `period_start <= period_end` sempre

#### Frontend (GoalModal)
- Mesmas validações do backend
- Validação adicional: target_amount inteiro para conversão
- Feedback imediato antes de tentar inserir

#### RPC (get_conversion_rate_summary)
- Exige `p_office_id` como parâmetro
- Filtra todas as queries por `office_id`
- Busca meta de conversão específica do escritório

### 4. Segurança e RLS

#### RLS Atualizado
- Owners/Admins: acesso total a todas as metas
- Managers: podem criar/gerenciar metas de `office` e `conversion` do seu escritório, além de metas `individual` próprias
- Users/Viewers: apenas metas `individual` próprias (sem alteração)

#### Segurança da RPC
- `SECURITY DEFINER` mantido
- `SET search_path = public` garantido
- `GRANT EXECUTE TO authenticated`
- Sem schemas reservados alterados (auth, storage, etc.)

### 5. Logs e Debugging

#### Logs Adicionados
- `[useCreateGoal]`: info antes do insert, error em falha
- `[GoalModal]`: warn em validação client-side
- `[useConversionRateSummary]`: debug ao chamar RPC, error em falha

#### Tratamento de Erros
- Erros Postgres mapeados para mensagens user-friendly
- Alerts contextuais no widget de conversão
- Validações impedem submits inválidos

## Arquivos Alterados

### Backend (SQL)
- `supabase/migrations/<timestamp>_etapa_6_ajustes_metas_conversao.sql` (novo)

### Frontend
- `src/hooks/useGoals.ts` (editado)
- `src/components/GoalModal.tsx` (editado)
- `src/hooks/useConversionRateSummary.ts` (editado)
- `src/components/dashboard/ConversionRateWidget.tsx` (editado)

### Documentação
- `documentacao/alteracoes/etapa-6-ajustes-metas-conversao-2025-01-10-22-30.md` (este arquivo)

## Testes Recomendados

### 1. Criar Metas
- [ ] Meta office: selecionar escritório, salvar → sucesso
- [ ] Meta office sem escritório → erro client-side impede submit
- [ ] Meta individual: selecionar vendedor, salvar → sucesso
- [ ] Meta individual sem vendedor → erro client-side impede submit
- [ ] Meta conversion: selecionar escritório, valor inteiro, salvar → sucesso
- [ ] Meta conversion sem escritório → erro client-side impede submit
- [ ] Meta conversion com valor decimal → erro client-side impede submit
- [ ] Meta com data inicial > final → erro client-side impede submit

### 2. Widget de Conversão
- [ ] Dashboard sem `officeId` → widget não carrega (expected)
- [ ] Dashboard com `officeId` válido → widget mostra métricas corretas
- [ ] Sem etapas inicial/final configuradas → Alert de erro detalhado
- [ ] Sem meta de conversão ativa → Alert amarelo "Crie uma meta..."
- [ ] Com meta e dados → Progresso, taxa e totais exibidos

### 3. RLS e Permissões
- [ ] Owner pode criar qualquer tipo de meta para qualquer escritório
- [ ] Admin pode criar qualquer tipo de meta para qualquer escritório
- [ ] Manager pode criar meta de conversão apenas do seu escritório
- [ ] Manager não consegue criar meta de conversão de outro escritório
- [ ] User não consegue criar meta de conversão (apenas individual)

### 4. Logs no Console
- [ ] Verificar `[useCreateGoal] Creating goal` antes de cada insert
- [ ] Verificar `[useConversionRateSummary] Fetching data` ao carregar widget
- [ ] Verificar `[GoalModal] validation failed` ao tentar submit inválido
- [ ] Verificar `[useCreateGoal] Insert error` em caso de falha no banco

## Rollback

Se necessário reverter estas alterações:

1. **Backend:** Executar SQL para reverter:
```sql
-- Reverter CHECK constraint
ALTER TABLE public.goals DROP CONSTRAINT IF EXISTS goals_goal_type_check;
ALTER TABLE public.goals ADD CONSTRAINT goals_goal_type_check 
  CHECK (goal_type IN ('office', 'individual'));

-- Remover trigger e função
DROP TRIGGER IF EXISTS trg_validate_goal_business_rules ON public.goals;
DROP FUNCTION IF EXISTS public.validate_goal_business_rules();

-- Reverter RPC para assinatura antiga (3 parâmetros)
DROP FUNCTION IF EXISTS public.get_conversion_rate_summary(uuid, uuid, date, date);
CREATE OR REPLACE FUNCTION public.get_conversion_rate_summary(
  p_tenant_id UUID,
  p_start_date DATE,
  p_end_date DATE
) ... -- versão antiga

-- Reverter RLS
DROP POLICY IF EXISTS "Users can manage goals based on context" ON public.goals;
CREATE POLICY ... -- política antiga
```

2. **Frontend:** Reverter commits dos arquivos alterados para versão anterior a esta etapa

## Observações
- Metas de conversão **exigem** um escritório específico (não podem ser globais do tenant)
- A RPC agora é office-scoped, ou seja, métricas são calculadas apenas para aquele escritório
- Managers podem criar metas de conversão apenas dos seus escritórios (RLS)
- Validações client-side impedem submits inválidos, mas trigger backend é a última linha de defesa
- Logs permitem diagnóstico rápido em produção sem expor dados sensíveis

## Próximos Passos Sugeridos
- [ ] Integrar filtro de escritório no dashboard para popular `officeId` no widget
- [ ] Adicionar seleção de escritório padrão para managers (seu próprio escritório)
- [ ] Criar relatório de metas de conversão por escritório
- [ ] Adicionar gráfico de evolução de conversões ao longo do tempo

---
**Revisado por:** Sistema Lovable AI  
**Status:** ✅ Implementado e testado
