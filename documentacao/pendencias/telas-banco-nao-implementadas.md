# Telas do Banco de Dados Não Implementadas no Frontend

Este documento lista as entidades/tabelas presentes no banco de dados do Argus360 que ainda não possuem telas ou interfaces correspondentes no sistema frontend, com sugestões de prioridade e impacto para o roadmap.

---

## 🏢 Tabelas Principais Sem Tela

### 1. Equipes (teams)
- **Status:** ❌ **SEM TELA**
- **Descrição:** Gestão de equipes de trabalho
- **Impacto:** Limita organização hierárquica e atribuição de responsabilidades
- **Sugestão:** Criar tela de gestão de equipes e membros

### 2. Membros de Equipe (team_members)
- **Status:** ❌ **SEM TELA**
- **Descrição:** Associação de usuários às equipes
- **Impacto:** Não é possível visualizar ou gerenciar membros de equipes
- **Sugestão:** Integrar à tela de equipes

### 3. Permissões (permissions, user_permissions, role_permissions)
- **Status:** ❌ **SEM TELA**
- **Descrição:** Controle granular de acesso por usuário e papel
- **Impacto:** Segurança e controle de acesso limitados
- **Sugestão:** Criar tela de gestão de permissões e papéis

### 4. Departamentos (departments)
- **Status:** ❌ **SEM TELA**
- **Descrição:** Estrutura organizacional por departamento
- **Impacto:** Não é possível cadastrar ou editar departamentos
- **Sugestão:** Criar CRUD de departamentos

### 5. Cargos (positions)
- **Status:** ❌ **SEM TELA**
- **Descrição:** Cadastro de cargos/posições
- **Impacto:** Perfis de usuário sem vínculo formal a cargos
- **Sugestão:** Criar CRUD de cargos e integrar com perfis

### 6. Log de Auditoria (audit_log)
- **Status:** ❌ **SEM TELA**
- **Descrição:** Visualização de logs de ações críticas
- **Impacto:** Falta de rastreabilidade para administradores
- **Sugestão:** Criar tela de consulta e filtro de logs

---

## 📋 Observações
- Algumas tabelas de apoio (ex: settings, user_profiles) podem não demandar tela própria, mas devem ser consideradas para integrações futuras.
- Recomenda-se priorizar telas que impactam segurança, gestão e rastreabilidade.

---

## 📅 Roadmap Sugerido
1. Gestão de Equipes e Membros
2. Gestão de Permissões e Papéis
3. CRUD de Departamentos e Cargos
4. Tela de Log de Auditoria