# Mapa de Rotas e Telas – Argus360
**Fonte:** `src/App.tsx`  
**Data:** 03 de Outubro de 2025

---

## Rotas Públicas

- `/` → `Landing` – Apresentação do produto e navegação inicial.
- `/login` → `Login` – Autenticação de usuários.
- `/register` → `Register` – Registro de usuários.
- `/aceitar-convite/:token` → `AceitarConvite` – Aceite de convite para tenant.
- `/registrar-com-token/:token` → `RegistrarComToken` – Registro com token.

---

## Rotas Protegidas (requer usuário e tenants disponíveis)

- `/dashboard` → `Dashboard` – KPIs executivos e visão geral.
- `/crm` → `CRM` – Gestão de clientes, funil, tarefas e interações.
- `/clientes` → `Clientes` – Cadastro e listagem de clientes.
- `/vendas` → `Vendas` – Vendas com dados relacionados e filtros.
- `/inadimplentes` → `Inadimplentes` – Acompanhamento de inadimplência.
- `/vendedores` → `Vendedores` – Gestão e performance de vendedores.
- `/comissoes` → `Comissoes` – Consolidação de comissões.
- `/comissoes/escritorio` → `ComissoesEscritorio` – Comissões por escritório.
- `/comissoes/vendedores` → `ComissoesVendedores` – Comissões por vendedor.
- `/consorcios` → `Consorcios` – Produtos e ofertas de consórcio.
- `/simulacao-consorcio` → `SimulacaoConsorcio` – Simulação de propostas.
- `/proposals` → `Proposals` – Gestão de propostas comerciais.
- `/training` → `Training` – Conteúdos de treinamento e vídeos.
- `/suporte` → `Suporte` – Central de suporte.
- `/perfil` → `Profile` – Perfil do usuário e configurações pessoais.
- `/metas` → `Metas` – Metas e acompanhamento de progresso.
- `/relatorios` → `Relatorios` – Relatórios operacionais.
- `/escritorios` → `Escritorios` – Gestão de escritórios.
- `/departamentos` → `Departamentos` – Gestão de departamentos.
- `/cargos` → `Cargos` – Gestão de cargos.
- `/equipes` → `Equipes` – Gestão de equipes.
- `/usuarios` → `Usuarios` – Gestão de usuários (RBAC integrado).
- `/convites` → `Convites` – Convites para novos usuários.
- `/permissoes` → `Permissoes` – Permissões granulares e presets.
- `/configuracoes` → `Configuracoes` – Configurações do tenant.
- `/auditoria` → `Auditoria` – Logs e estatísticas de auditoria.
- `/auditoria-seguranca` → `AuditoriaSeguranca` – Monitoramento e configurações de segurança.

---

## Rotas de Administração

- `/admin-login` → `AdminLogin` – Login administrativo.
- `/admin/*` → `AdminLayout` – Layout de administração.
  - `index` → `AdminDashboard` – Painel administrativo.
  - `super-admins` → `SuperAdmins` – Gestão de super administradores.
  - `training` → `AdminTraining` – Treinamento administrativo.
  - `support` → `AdminSupport` – Suporte administrativo.
  - `tenants` → Placeholder – Gestão de tenants (em desenvolvimento).
  - `payments` → Placeholder – Gestão de pagamentos (em desenvolvimento).
  - `monitor` → Placeholder – Monitor do sistema (em desenvolvimento).
  - `settings` → Placeholder – Configurações admin (em desenvolvimento).

---

## Proteções e Fluxo de Autenticação

- `PublicRoute`: redireciona usuários autenticados para `/dashboard`, protege rotas públicas contra acesso redundante.
- `ProtectedRoute`: garante usuário autenticado e tenants carregados antes de renderizar as rotas protegidas.
- `ProtectedLayout`: provê layout e contexto seguro para as telas internas.

---

## Observações de Implementação

- Sidebar mapeia roles para nomes legíveis (Owner, Admin, Manager, User, Viewer).
- Páginas usam Design System (Shadcn/UI), skeletons, loaders e toasts.
- Telas como Vendas, CRM, Comissões e Dashboard fazem uso de hooks otimizados e/ou RPCs para performance.