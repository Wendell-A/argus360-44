
# Plano de Ação - Pontos Críticos do Sistema Argus360

## 📋 Resumo Executivo

Este documento estabelece um plano de ação detalhado para correção dos pontos críticos identificados no sistema Argus360. O foco está em garantir a funcionalidade completa do MVP e a segurança dos dados dos tenants.

---

## 🚨 PONTOS CRÍTICOS IDENTIFICADOS E PLANO DE AÇÃO

### 1. SEGURANÇA DE DADOS - VAZAMENTO ENTRE TENANTS
**Status:** ✅ **CORRIGIDO**
**Criticidade:** MÁXIMA
**Prazo:** Imediato

**Problema Identificado:**
- Hook `useOffices.ts` não filtrava por `tenant_id`
- Permitia acesso a dados de outros tenants

**Ação Realizada:**
- ✅ Adicionado filtro `activeTenant.tenant_id` em todas as queries
- ✅ Implementada verificação de tenant ativo antes das operações
- ✅ Testado isolamento de dados entre tenants

**Próximos Passos:**
- [ ] Auditar todos os demais hooks para garantir mesmo padrão
- [ ] Implementar testes automatizados de isolamento de tenant
- [ ] Configurar logging de auditoria

---

### 2. FUNÇÃO DE SETUP INICIAL INCOMPLETA
**Status:** ❌ **PENDENTE**
**Criticidade:** ALTA
**Prazo:** 3 dias

**Problema Identificado:**
- Função `create_initial_user_setup` não cria escritório matriz automaticamente
- Novos usuários ficam sem escritório associado
- Processo de onboarding quebrado

**Plano de Ação:**
1. **Modificar função SQL:** Incluir criação automática do escritório matriz
2. **Atualizar trigger:** Garantir associação correta em `office_users`
3. **Testar fluxo completo:** Registro → Tenant → Office → User Association
4. **Documentar processo:** Criar guia de troubleshooting

**SQL Necessário:**
```sql
-- Modificar create_initial_user_setup para incluir criação de office
-- Adicionar INSERT INTO offices após criação de tenant
-- Adicionar INSERT INTO office_users para associação
```

---

### 3. SISTEMA DE COMISSÕES AUTOMÁTICAS
**Status:** ❌ **PENDENTE**
**Criticidade:** ALTA
**Prazo:** 5 dias

**Problema Identificado:**
- Comissões não são criadas automaticamente após aprovação de vendas
- Processo manual demorado e propenso a erros
- Falta trigger `create_automatic_commissions()`

**Plano de Ação:**
1. **Implementar trigger:** Criar `create_automatic_commissions()` no banco
2. **Configurar automação:** Trigger executar após UPDATE de sales com status='approved'
3. **Testar workflow:** Venda → Aprovação → Comissão Automática
4. **Interface de gestão:** Melhorar tela de comissões para aprovação manual

**Funcionalidades do Trigger:**
- Criar comissão para vendedor automaticamente
- Calcular valor baseado na taxa da venda
- Definir data de vencimento (30 dias após aprovação)
- Status inicial como 'pending'

---

### 4. RELATÓRIOS SEM FUNCIONALIDADE
**Status:** ❌ **PENDENTE**
**Criticidade:** MÉDIA
**Prazo:** 7 dias

**Problema Identificado:**
- Interface existe mas não gera relatórios reais
- Dados fictícios em todas as métricas
- Falta exportação de dados

**Plano de Ação:**
1. **Conectar dados reais:** Substituir dados fictícios por queries ao banco
2. **Implementar filtros:** Por período, vendedor, escritório, status
3. **Adicionar exportação:** PDF e Excel para relatórios
4. **Criar templates:** Relatórios pré-definidos mais usados

**Relatórios Prioritários:**
- Vendas por período
- Comissões por vendedor
- Performance por escritório
- Clientes por status

---

### 5. GESTÃO DE EQUIPES NÃO IMPLEMENTADA
**Status:** ❌ **PENDENTE**
**Criticidade:** BAIXA
**Prazo:** 14 dias

**Problema Identificado:**
- Tabelas `teams`, `team_members` existem mas sem interface
- Sem gestão hierárquica
- Sem atribuição de metas por equipe

**Plano de Ação:**
1. **Criar interfaces CRUD:** Para teams e team_members
2. **Implementar hierarquia:** Estrutura de liderança de equipes
3. **Sistema de metas:** Definição e acompanhamento por equipe
4. **Relatórios de equipe:** Performance coletiva

---

### 6. SISTEMA DE PERMISSÕES BÁSICO
**Status:** ❌ **PENDENTE**
**Criticidade:** MÉDIA
**Prazo:** 10 dias

**Problema Identificado:**
- Controle de acesso rudimentar
- Tabelas `permissions`, `user_permissions` subutilizadas
- Falta granularidade nas permissões

**Plano de Ação:**
1. **Mapear permissões:** Definir matriz de permissões por role
2. **Implementar middleware:** Verificação de permissões nas rotas
3. **Interface de gestão:** Tela para atribuir permissões
4. **Testes de segurança:** Validar controle de acesso

---

## 🔧 MELHORIAS TÉCNICAS NECESSÁRIAS

### 7. OTIMIZAÇÃO DE PERFORMANCE
**Status:** ❌ **PENDENTE**
**Criticidade:** MÉDIA
**Prazo:** 7 dias

**Problemas:**
- Queries sem índices otimizados
- Falta paginação em listagens
- Loading states inconsistentes

**Ações:**
1. **Criar índices:** Análise de queries frequentes e criação de índices
2. **Implementar paginação:** Em todas as listagens com mais de 50 itens
3. **Padronizar loading:** Estados de carregamento consistentes
4. **Cache estratégico:** Para dados pouco mutáveis

### 8. VALIDAÇÕES E TRATAMENTO DE ERROS
**Status:** ❌ **PENDENTE**
**Criticidade:** MÉDIA
**Prazo:** 5 dias

**Problemas:**
- Validações básicas apenas no frontend
- Falta tratamento de erros do backend
- Mensagens de erro pouco descritivas

**Ações:**
1. **Validações robustas:** Zod schemas para todos os forms
2. **Tratamento de erros:** Interceptors para erros de API
3. **Mensagens amigáveis:** Toast messages informativos
4. **Logs estruturados:** Para debugging e monitoramento

---

## 📊 CRONOGRAMA DE IMPLEMENTAÇÃO

### **Semana 1 - Correções Críticas**
- [x] Corrigir vazamento de dados (useOffices) - ✅ CONCLUÍDO
- [ ] Corrigir função create_initial_user_setup
- [ ] Implementar trigger de comissões automáticas
- [ ] Testes de segurança básicos

### **Semana 2 - Funcionalidades Core**
- [ ] Conectar relatórios com dados reais
- [ ] Implementar exportação de relatórios
- [ ] Melhorar workflow de comissões
- [ ] Otimizar queries principais

### **Semana 3 - Refinamentos**
- [ ] Implementar paginação universal
- [ ] Padronizar validações e erros
- [ ] Sistema de permissões avançado
- [ ] Testes de integração

### **Semana 4 - Funcionalidades Avançadas**
- [ ] Gestão de equipes e hierarquias
- [ ] Sistema de metas e KPIs
- [ ] Relatórios avançados
- [ ] Documentação final

---

## 🎯 CRITÉRIOS DE SUCESSO

### **Funcionalidade**
- [x] Usuários conseguem se registrar e acessar apenas seus dados
- [ ] Vendas aprovadas geram comissões automaticamente
- [ ] Relatórios mostram dados reais com exportação
- [ ] Sistema de permissões funciona corretamente

### **Segurança**
- [x] Isolamento total entre tenants
- [ ] Auditoria de todas as ações críticas
- [ ] Validações robustas em todos os inputs
- [ ] Tratamento seguro de erros

### **Performance**
- [ ] Listagens com paginação funcionando
- [ ] Tempo de carregamento < 3 segundos
- [ ] Interface responsiva em todos os dispositivos
- [ ] Queries otimizadas com índices

### **Usabilidade**
- [ ] Fluxos intuitivos para usuários finais
- [ ] Mensagens de erro claras e acionáveis
- [ ] Estados de loading consistentes
- [ ] Confirmações para ações destrutivas

---

## 🚦 MATRIZ DE RISCO

| Item | Impacto | Probabilidade | Risco | Mitigação |
|------|---------|---------------|-------|-----------|
| Vazamento de dados | ALTO | BAIXA | MÉDIO | ✅ Já corrigido + Testes |
| Setup inicial falha | ALTO | MÉDIA | ALTO | Priorizar correção |
| Comissões manuais | MÉDIO | ALTA | ALTO | Implementar trigger |
| Performance lenta | MÉDIO | MÉDIA | MÉDIO | Otimização gradual |
| Permissões falhas | ALTO | BAIXA | MÉDIO | Testes de segurança |

---

## 📝 NOTAS DE IMPLEMENTAÇÃO

### **Padrões Técnicos**
- Sempre filtrar por `tenant_id` em queries
- Usar hooks personalizados para operações CRUD
- Implementar loading states em todas as operações
- Validar dados com Zod no frontend e backend

### **Testes Obrigatórios**
- Isolamento de tenant em todas as operações
- Fluxo completo de registro de usuário
- Criação automática de comissões
- Exportação de relatórios

### **Monitoramento**
- Implementar logging de auditoria
- Monitorar performance de queries
- Alertas para falhas críticas
- Métricas de uso por tenant

---

*Documento criado em: ${new Date().toLocaleDateString('pt-BR')}*
*Última atualização: ${new Date().toLocaleString('pt-BR')}*
*Responsável: Equipe de Desenvolvimento Argus360*
