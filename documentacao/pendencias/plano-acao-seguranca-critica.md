
# Plano de Ação - Correções Críticas de Segurança

## 📋 Resumo Executivo

Este documento detalha o plano de ação para corrigir as **pendências críticas de segurança** identificadas no sistema Argus360, especificamente relacionadas ao isolamento de dados entre tenants e configuração inicial de usuários.

---

## 🎯 Objetivos

1. **Garantir isolamento total** entre dados de diferentes tenants
2. **Corrigir função de setup inicial** para criar escritório matriz automaticamente
3. **Implementar auditoria e logging** para rastreabilidade
4. **Estabelecer triggers automáticos** para comissões

---

## 🚨 Problemas Críticos Identificados

### ✅ 1. Vazamento de Dados Entre Tenants - **RESOLVIDO**
**Status:** Corrigido
**Arquivo:** `src/hooks/useOffices.ts`
**Ação:** Filtro por `activeTenant.tenant_id` implementado

### ❌ 2. Função de Setup Inicial Incompleta - **CRÍTICO**
**Status:** Pendente
**Problema:** `create_initial_user_setup` não cria escritório matriz
**Impacto:** Novos usuários ficam sem escritório associado

---

## 📝 Plano de Implementação Detalhado

### **FASE 1: Correção da Função de Setup Inicial**

#### **1.1 Análise da Função Atual**
```sql
-- Função atual não cria escritório matriz
CREATE OR REPLACE FUNCTION public.create_initial_user_setup(...)
-- Falta: criação automática de escritório matriz
-- Falta: associação em office_users
```

#### **1.2 Correção Necessária**
- ✅ Criar tenant
- ✅ Criar perfil de usuário  
- ✅ Criar associação tenant_user
- ❌ **FALTA:** Criar escritório matriz
- ❌ **FALTA:** Associar usuário ao escritório

#### **1.3 Implementação da Correção**

**SQL Migration Necessária:**
```sql
CREATE OR REPLACE FUNCTION public.create_initial_user_setup(
  user_id uuid, 
  user_email text, 
  user_full_name text, 
  tenant_name text, 
  tenant_slug text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_tenant_id uuid;
  new_office_id uuid;
  result jsonb;
BEGIN
  -- 1. Criar tenant
  INSERT INTO public.tenants (name, slug, status)
  VALUES (tenant_name, tenant_slug, 'trial')
  RETURNING id INTO new_tenant_id;
  
  -- 2. Criar perfil do usuário
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (user_id, user_email, user_full_name)
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name;
    
  -- 3. Criar associação tenant_user como owner
  INSERT INTO public.tenant_users (user_id, tenant_id, role, active, joined_at)
  VALUES (user_id, new_tenant_id, 'owner', true, now());
  
  -- 4. NOVO: Criar escritório matriz automaticamente
  INSERT INTO public.offices (
    tenant_id, 
    name, 
    type, 
    responsible_id,
    active
  )
  VALUES (
    new_tenant_id, 
    tenant_name || ' - Matriz', 
    'matriz',
    user_id,
    true
  )
  RETURNING id INTO new_office_id;
  
  -- 5. NOVO: Associar usuário ao escritório matriz
  INSERT INTO public.office_users (
    user_id, 
    office_id, 
    tenant_id,
    role,
    active
  )
  VALUES (
    user_id, 
    new_office_id, 
    new_tenant_id,
    'admin',
    true
  );
  
  -- 6. Retornar informações do setup
  result := jsonb_build_object(
    'tenant_id', new_tenant_id,
    'office_id', new_office_id,
    'user_id', user_id,
    'success', true
  );
  
  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;
```

### **FASE 2: Implementação de Triggers de Comissões**

#### **2.1 Trigger de Comissões Automáticas**
```sql
-- Criar trigger para gerar comissões automaticamente
CREATE OR REPLACE FUNCTION public.create_automatic_commissions()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Só criar comissões quando a venda for aprovada
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    -- Comissão do vendedor
    INSERT INTO public.commissions (
      tenant_id,
      sale_id,
      recipient_id,
      recipient_type,
      base_amount,
      commission_rate,
      commission_amount,
      due_date,
      status
    ) VALUES (
      NEW.tenant_id,
      NEW.id,
      NEW.seller_id,
      'seller',
      NEW.sale_value,
      NEW.commission_rate,
      NEW.commission_amount,
      NEW.approval_date + INTERVAL '30 days',
      'pending'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Aplicar trigger na tabela sales
CREATE TRIGGER trigger_create_automatic_commissions
  AFTER UPDATE ON public.sales
  FOR EACH ROW
  EXECUTE FUNCTION public.create_automatic_commissions();
```

### **FASE 3: Implementação de Auditoria**

#### **3.1 Trigger de Auditoria Universal**
```sql
-- Função genérica de auditoria
CREATE OR REPLACE FUNCTION public.audit_trigger()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  tenant_id_value uuid;
BEGIN
  -- Tentar extrair tenant_id do registro
  IF TG_OP = 'DELETE' THEN
    tenant_id_value := OLD.tenant_id;
  ELSE
    tenant_id_value := COALESCE(NEW.tenant_id, OLD.tenant_id);
  END IF;

  INSERT INTO public.audit_log (
    tenant_id,
    user_id,
    table_name,
    record_id,
    action,
    old_values,
    new_values,
    ip_address,
    user_agent
  ) VALUES (
    tenant_id_value,
    auth.uid(),
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    TG_OP,
    CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE row_to_json(OLD) END,
    CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE row_to_json(NEW) END,
    inet_client_addr(),
    current_setting('request.headers', true)::json->>'user-agent'
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;
```

#### **3.2 Aplicar Auditoria em Tabelas Críticas**
```sql
-- Aplicar auditoria nas tabelas principais
CREATE TRIGGER audit_sales
  AFTER INSERT OR UPDATE OR DELETE ON public.sales
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();

CREATE TRIGGER audit_commissions
  AFTER INSERT OR UPDATE OR DELETE ON public.commissions
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();

CREATE TRIGGER audit_clients
  AFTER INSERT OR UPDATE OR DELETE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();
```

---

## 🔧 Validações e Testes

### **Checklist de Validação:**

#### ✅ **Setup Inicial**
- [ ] Novo usuário cria tenant
- [ ] Escritório matriz é criado automaticamente
- [ ] Usuário é associado ao escritório matriz
- [ ] Tipo do escritório é 'matriz'
- [ ] Usuário tem role 'owner' no tenant
- [ ] Usuário tem role 'admin' no escritório

#### ✅ **Isolamento de Dados**
- [ ] Usuário A não vê dados do Tenant B
- [ ] Escritórios filtrados por tenant_id
- [ ] Vendas isoladas por tenant
- [ ] Comissões isoladas por tenant

#### ✅ **Comissões Automáticas**
- [ ] Comissão criada ao aprovar venda
- [ ] Valores calculados corretamente
- [ ] Data de vencimento = aprovação + 30 dias

#### ✅ **Auditoria**
- [ ] Operações CRUD são logadas
- [ ] tenant_id correto nos logs
- [ ] user_id capturado corretamente

---

## 📅 Cronograma de Execução

### **Sprint 1 - Correções Críticas (Semana 1)**
- **Dia 1-2:** Corrigir função `create_initial_user_setup`
- **Dia 3:** Implementar trigger de comissões automáticas
- **Dia 4:** Implementar auditoria básica
- **Dia 5:** Testes e validações

### **Sprint 2 - Refinamentos (Semana 2)**
- **Dia 1-2:** Otimizar queries e índices
- **Dia 3-4:** Melhorar logs de auditoria
- **Dia 5:** Testes finais e documentação

---

## ⚠️ Riscos e Mitigações

### **Alto Risco:**
1. **Função de setup falhar** → Backup e rollback automático
2. **Triggers causarem lentidão** → Otimização e monitoração
3. **Dados perdidos** → Backup antes das alterações

### **Médio Risco:**
1. **Usuários existentes sem escritório** → Script de migração
2. **Performance degradada** → Índices otimizados

---

## 🎯 Critérios de Sucesso

### **Funcional:**
- ✅ 100% dos novos usuários têm escritório matriz
- ✅ Zero vazamento de dados entre tenants
- ✅ Comissões criadas automaticamente
- ✅ Todas as operações auditadas

### **Performance:**
- ✅ Setup inicial < 2 segundos
- ✅ Queries com isolamento < 500ms
- ✅ Triggers não impactam performance

### **Segurança:**
- ✅ RLS ativo em todas as tabelas
- ✅ Políticas testadas e validadas
- ✅ Logs de auditoria completos

---

## 📊 Métricas de Acompanhamento

### **Diárias:**
- Tempo de setup de novos usuários
- Erros de isolamento (deve ser 0)
- Performance das queries principais

### **Semanais:**
- Auditoria de logs de segurança
- Validação de integridade dos dados
- Review de políticas RLS

---

## 📞 Responsabilidades

### **Desenvolvimento:**
- Implementar correções SQL
- Criar testes automatizados
- Documentar mudanças

### **DevOps:**
- Backup antes das alterações
- Monitoração pós-deploy
- Rollback se necessário

### **QA:**
- Validar todos os cenários
- Testes de segurança
- Testes de performance

---

## 📝 Próximos Passos

1. **Aprovação do plano** ✅
2. **Execução das correções SQL** ⏳
3. **Testes em ambiente de desenvolvimento** ⏳
4. **Deploy em produção** ⏳
5. **Monitoração e ajustes** ⏳

---

**Documento criado em:** `${new Date().toLocaleDateString('pt-BR')}`
**Última atualização:** `${new Date().toLocaleDateString('pt-BR')}`
**Status:** Em Execução
