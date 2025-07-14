
# Fluxo de Autenticação - Argus360

## Visão Geral

O sistema utiliza autenticação baseada em Supabase Auth com integração personalizada para o modelo multi-tenant (escritórios).

## Fluxo Principal de Login

```
INÍCIO Login
├── Usuário acessa página de login
├── Insere email e senha
├── Sistema valida credenciais via Supabase Auth
├── Se válido:
│   ├── Busca dados do usuário na tabela usuarios
│   ├── Verifica se usuário está ativo
│   ├── Verifica se escritório está ativo
│   ├── Registra último login e IP
│   ├── Carrega perfil de acesso e permissões
│   ├── Cria sessão autenticada
│   └── Redireciona para Dashboard
├── Se inválido:
│   ├── Incrementa tentativas de login
│   ├── Se > limite: bloqueia usuário temporariamente
│   ├── Exibe mensagem de erro
│   └── Mantém na tela de login
└── FIM
```

## Estados de Usuário

### 1. Usuário Ativo
- `ativo = true`
- `bloqueado_ate IS NULL`
- `email_verificado = true`
- Escritório com `status = 'ativo' OR 'trial'`

### 2. Usuário Bloqueado Temporariamente
- `tentativas_login >= max_tentativas_login`
- `bloqueado_ate > NOW()`
- Sistema impede login até expirar o bloqueio

### 3. Usuário Inativo
- `ativo = false`
- Login negado com mensagem específica

### 4. Primeiro Acesso
- `deve_trocar_senha = true`
- Forçar redefinição de senha após login

## Fluxo de Verificação de Permissões

```
INÍCIO Verificação Permissões
├── Usuário tenta acessar recurso
├── Sistema verifica se está autenticado
├── Se não autenticado:
│   └── Redireciona para login
├── Se autenticado:
│   ├── Carrega perfil de acesso do usuário
│   ├── Extrai permissões do JSONB
│   ├── Verifica permissão específica para o recurso
│   ├── Se permitido:
│   │   └── Libera acesso ao recurso
│   └── Se negado:
│       └── Exibe erro 403 (Acesso Negado)
└── FIM
```

## Estrutura de Permissões

### Formato das Permissões (JSONB)
```json
{
  "usuarios": {
    "create": true,
    "read": true, 
    "update": true,
    "delete": false
  },
  "clientes": {
    "create": true,
    "read": true,
    "update": true,
    "delete": true
  },
  "vendas": {
    "create": true,
    "read": true,
    "update": false,
    "delete": false
  },
  "relatorios": {
    "read": true
  },
  "configuracoes": {
    "read": true,
    "update": false
  }
}
```

### Verificação de Permissão
```javascript
// Exemplo de verificação no frontend
function hasPermission(module, action) {
  const permissions = user.perfil.permissoes;
  return permissions[module]?.[action] === true;
}

// Uso
if (hasPermission('usuarios', 'create')) {
  // Exibir botão "Novo Usuário"
}
```

## Fluxo de Logout

```
INÍCIO Logout
├── Usuário clica em "Sair"
├── Sistema registra logout na auditoria
├── Remove sessão do Supabase Auth
├── Limpa dados locais (localStorage, sessionStorage)
├── Redireciona para página de login
└── FIM
```

## Segurança Adicional

### Controle de Tentativas de Login
```sql
-- Função para verificar tentativas
CREATE OR REPLACE FUNCTION check_login_attempts(user_email TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  user_record usuarios%ROWTYPE;
  max_attempts INTEGER;
BEGIN
  SELECT * INTO user_record 
  FROM usuarios u
  JOIN escritorios e ON u.id_escritorio = e.id
  WHERE u.email = user_email;
  
  max_attempts := COALESCE(user_record.max_tentativas_login, 5);
  
  IF user_record.tentativas_login >= max_attempts THEN
    -- Bloquear por 30 minutos
    UPDATE usuarios 
    SET bloqueado_ate = NOW() + INTERVAL '30 minutes'
    WHERE email = user_email;
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;
```

### Two-Factor Authentication (2FA)
```
INÍCIO 2FA (Futuro)
├── Usuário faz login normal
├── Se 2FA ativado:
│   ├── Sistema gera código TOTP
│   ├── Envia por SMS/Email/App
│   ├── Usuário insere código
│   ├── Sistema valida código
│   ├── Se válido: completa login
│   └── Se inválido: bloqueia temporariamente
└── Prossegue com login normal
```

## Row Level Security (RLS)

### Políticas Principais
```sql
-- Usuários só veem dados do próprio escritório
CREATE POLICY usuarios_isolamento ON usuarios
  FOR ALL TO authenticated
  USING (id_escritorio = get_user_escritorio_id());

-- Perfis de acesso isolados por escritório  
CREATE POLICY perfis_isolamento ON perfis_acesso
  FOR ALL TO authenticated
  USING (id_escritorio = get_user_escritorio_id());

-- Auditoria isolada por escritório
CREATE POLICY auditoria_isolamento ON auditoria_sistema
  FOR SELECT TO authenticated
  USING (id_escritorio = get_user_escritorio_id());
```

## Controle de Sessão

### Timeout de Sessão
- Configurável por escritório (`timeout_sessao_minutos`)
- Padrão: 8 horas (480 minutos)
- Renovação automática a cada atividade

### Múltiplas Sessões
- Permitido por padrão
- Configurável por escritório
- Auditoria de todas as sessões

## Tratamento de Erros

### Tipos de Erro de Autenticação

1. **Credenciais Inválidas**
   - Mensagem: "Email ou senha incorretos"
   - Incrementa contador de tentativas

2. **Usuário Bloqueado**
   - Mensagem: "Conta temporariamente bloqueada. Tente novamente em X minutos"
   - Não incrementa tentativas

3. **Usuário Inativo**
   - Mensagem: "Conta desativada. Entre em contato com o administrador"
   - Login completamente negado

4. **Escritório Suspenso**
   - Mensagem: "Escritório suspenso. Entre em contato com o suporte"
   - Todos os usuários do escritório afetados

5. **Email Não Verificado**
   - Mensagem: "Verifique seu email antes de continuar"
   - Oferece opção de reenviar email

## Auditoria de Autenticação

### Eventos Registrados
```sql
-- Login bem-sucedido
INSERT INTO auditoria_sistema (
  id_escritorio, id_usuario, acao, 
  dados_novos, ip_origem, user_agent
) VALUES (
  escritorio_id, usuario_id, 'LOGIN',
  jsonb_build_object('sucesso', true),
  client_ip, client_user_agent
);

-- Tentativa de login falhada
INSERT INTO auditoria_sistema (
  id_escritorio, acao, 
  dados_novos, ip_origem
) VALUES (
  escritorio_id, 'LOGIN_FAILED',
  jsonb_build_object('email', email, 'motivo', 'credenciais_invalidas'),
  client_ip
);
```

## Integração com Frontend

### Context de Autenticação
```typescript
interface AuthContext {
  user: User | null;
  escritorio: Escritorio | null;
  permissions: Permissions;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (module: string, action: string) => boolean;
}
```

### Proteção de Rotas
```typescript
function ProtectedRoute({ children, requiredPermission }) {
  const { user, hasPermission } = useAuth();
  
  if (!user) {
    return <Redirect to="/login" />;
  }
  
  if (requiredPermission && !hasPermission(...requiredPermission)) {
    return <AccessDenied />;
  }
  
  return children;
}
```

## Melhorias Futuras

1. **Single Sign-On (SSO)**
   - Integração com Google, Microsoft
   - SAML/OAuth2 para empresas

2. **Biometria**
   - Login por impressão digital
   - Reconhecimento facial

3. **Audit Trail Avançado**
   - Geolocalização de logins
   - Detecção de anomalias
   - Alertas de segurança

4. **Session Management**
   - Controle de sessões ativas
   - Força logout remoto
   - Limite de dispositivos simultâneos
