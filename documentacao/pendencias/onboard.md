
# Guia de Onboard - Sistema Argus360

## Visão Geral do Sistema

O Argus360 é um sistema completo de gestão para empresas de consórcio que oferece controle total sobre vendas, clientes, vendedores, comissões e muito mais.

## Configurações Essenciais para Novos Usuários

### 1. Configurações Básicas da Empresa

**Tela:** `/configuracoes`
**Prioridade:** CRÍTICA

- **Dados da Empresa:** Nome, CNPJ, endereço, contatos
- **Configurações de Sistema:** Timezone, moeda, idioma
- **Configurações de Simulação:** Taxas de juros para diferentes tipos de financiamento
- **Branding:** Logo, cores da empresa, favicon

**Checklist Mínimo:**
- [ ] Preencher dados básicos da empresa
- [ ] Configurar taxas de simulação de consórcio
- [ ] Definir configurações regionais (moeda brasileira)
- [ ] Upload do logo da empresa

### 2. Estrutura Organizacional

#### 2.1 Escritórios (`/escritorios`)
**Prioridade:** ALTA

- **Matriz:** Sempre deve ser criado primeiro
- **Filiais:** Configurar conforme necessário
- **Dados Necessários:** Nome, endereço, CNPJ, responsável, horário de funcionamento

**Checklist:**
- [ ] Criar escritório matriz
- [ ] Configurar dados de contato
- [ ] Definir horários de atendimento
- [ ] Associar responsável pelo escritório

#### 2.2 Departamentos (`/departamentos`)
**Prioridade:** ALTA

**Templates Disponíveis:**
- Vendas (essencial para sistema de consórcio)
- Marketing
- Financeiro
- Recursos Humanos
- Tecnologia da Informação
- Jurídico
- Atendimento ao Cliente
- Administrativo

**Checklist:**
- [ ] Criar departamento de Vendas (obrigatório)
- [ ] Criar departamento Financeiro (recomendado)
- [ ] Configurar outros departamentos conforme estrutura

#### 2.3 Equipes (`/equipes`)
**Prioridade:** MÉDIA

- Organizar vendedores em equipes
- Definir líderes de equipe
- Estabelecer metas por equipe

### 3. Gestão de Pessoas

#### 3.1 Vendedores (`/vendedores`)
**Prioridade:** CRÍTICA

**Dados Essenciais:**
- Informações pessoais (nome, CPF, contatos)
- Dados profissionais (cargo, departamento, escritório)
- Configurações de comissão
- Metas de vendas

**Checklist:**
- [ ] Cadastrar pelo menos um vendedor
- [ ] Definir taxas de comissão por vendedor
- [ ] Associar vendedores aos escritórios corretos
- [ ] Configurar metas mensais

#### 3.2 Permissões (`/permissoes`)
**Prioridade:** ALTA

**Perfis Padrão:**
- Owner (proprietário)
- Admin (administrador)
- Manager (gerente)
- User (usuário comum)

**Checklist:**
- [ ] Revisar permissões padrão
- [ ] Criar perfis customizados se necessário
- [ ] Associar usuários aos perfis corretos

### 4. Produtos e Serviços

#### 4.1 Consórcios (`/consorcios`)
**Prioridade:** CRÍTICA

**Configurações Essenciais:**
- Tipos de consórcio (veículos, imóveis, etc.)
- Valores de crédito disponíveis
- Prazos de pagamento
- Taxas de administração
- Comissões por produto

**Checklist:**
- [ ] Cadastrar produtos de consórcio principais
- [ ] Configurar tabelas de preços
- [ ] Definir comissões por produto
- [ ] Ativar simulador de consórcio

### 5. Gestão Comercial

#### 5.1 Clientes (`/clientes`)
**Prioridade:** MÉDIA

**Preparação Inicial:**
- Configurar campos obrigatórios
- Definir classificações de cliente
- Estabelecer sources de leads

#### 5.2 Vendas (`/vendas`)
**Prioridade:** ALTA

**Fluxo de Aprovação:**
- Definir status de venda
- Configurar processo de aprovação
- Estabelecer regras de comissão

### 6. Controles Financeiros

#### 6.1 Comissões (`/comissoes`)
**Prioridade:** ALTA

**Configurações:**
- Regras de cálculo automático
- Prazos de pagamento
- Aprovação de comissões
- Relatórios de comissão

### 7. Relatórios e Análises

#### 7.1 Dashboard (`/dashboard`)
**Prioridade:** MÉDIA

- Configurar widgets principais
- Definir KPIs importantes
- Personalizar visualizações

#### 7.2 Relatórios (`/relatorios`)
**Prioridade:** BAIXA

- Configurar relatórios automáticos
- Definir periodicidade de envio
- Personalizar formatos

### 8. Segurança e Auditoria

#### 8.1 Auditoria (`/auditoria`)
**Prioridade:** BAIXA

- Ativar logs de auditoria
- Configurar alertas de segurança
- Definir políticas de retenção

## Fluxo de Onboard Recomendado

### Fase 1: Configuração Básica (Dia 1)
1. Dados da empresa em Configurações
2. Criar escritório matriz
3. Configurar taxas de simulação
4. Cadastrar primeiro vendedor

### Fase 2: Estrutura Organizacional (Dia 2-3)
1. Criar departamentos essenciais (usar templates)
2. Configurar permissões de usuários
3. Cadastrar produtos de consórcio principais
4. Testar simulador de consórcio

### Fase 3: Operação Inicial (Dia 4-5)
1. Cadastrar clientes de teste
2. Registrar vendas de exemplo
3. Configurar processo de comissões
4. Personalizar dashboard

### Fase 4: Refinamento (Semana 2)
1. Criar equipes de vendas
2. Configurar relatórios
3. Ajustar permissões
4. Ativar auditoria

## Indicadores de Sucesso do Onboard

### Configuração Mínima Concluída:
- [ ] Empresa configurada com dados básicos
- [ ] Pelo menos 1 escritório criado
- [ ] Pelo menos 1 vendedor cadastrado
- [ ] Pelo menos 1 produto de consórcio ativo
- [ ] Simulador funcionando
- [ ] Primeira venda registrada

### Configuração Completa:
- [ ] Todos os departamentos necessários criados
- [ ] Equipes organizadas
- [ ] Permissões configuradas
- [ ] Relatórios personalizados
- [ ] Dashboard configurado
- [ ] Processo de comissões automatizado

## Próximos Passos Após Onboard

1. **Treinamento da Equipe:** Capacitação dos usuários nas funcionalidades
2. **Importação de Dados:** Migração de dados de sistemas anteriores
3. **Integrações:** Conectar com outros sistemas (CRM, ERP, etc.)
4. **Personalização Avançada:** Ajustes específicos para o negócio
5. **Monitoramento:** Acompanhamento de métricas e performance

## Suporte e Recursos

- **Documentação Técnica:** `/documentacao/`
- **Templates Prontos:** Usar sempre que possível para agilizar setup
- **Simulador de Consórcio:** Ferramenta principal para demonstrações
- **Dashboard Executivo:** Para acompanhamento de resultados

## Checklist Final de Onboard

### Essencial (Deve estar 100% completo):
- [ ] Dados da empresa configurados
- [ ] Escritório matriz criado
- [ ] Primeiro vendedor cadastrado
- [ ] Produto de consórcio ativo
- [ ] Simulador testado e funcionando
- [ ] Primeira venda registrada
- [ ] Comissões calculadas corretamente

### Recomendado (Deve estar 80% completo):
- [ ] Departamentos principais criados
- [ ] Permissões configuradas
- [ ] Dashboard personalizado
- [ ] Relatórios básicos configurados
- [ ] Processo de aprovação definido

### Opcional (Pode ser feito posteriormente):
- [ ] Todas as equipes organizadas
- [ ] Relatórios avançados
- [ ] Integrações externas
- [ ] Auditoria ativada
- [ ] Personalização visual completa

---

**Tempo Estimado de Onboard Completo:** 5-7 dias úteis
**Tempo Mínimo para Operação:** 1-2 dias úteis
