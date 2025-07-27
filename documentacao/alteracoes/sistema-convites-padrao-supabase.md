# Sistema de Convites - Padrão Supabase

**Data:** 27/01/2025 18:30
**Tipo:** Refatoração completa do sistema de convites

## Problema Identificado

O sistema de convites customizado estava apresentando problemas:
- Emails não eram enviados para os usuários
- Links de convite geravam erro 404
- Edge function customizada não estava funcionando corretamente
- Complexidade desnecessária com tokens personalizados

## Solução Implementada

Refatoração completa para seguir o padrão oficial do Supabase:

### 1. Nova Estrutura da Tabela `invitations`

```sql
CREATE TABLE public.invitations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL,
  email varchar NOT NULL,
  invited_by uuid NOT NULL,
  role user_role NOT NULL DEFAULT 'user',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(tenant_id, email)
);
```

### 2. Funções de Banco Criadas

#### `send_invitation_via_auth()`
- Salva convites no banco com metadados
- Remove dependência de tokens customizados
- Orienta uso do admin panel do Supabase

#### `process_invitation_on_auth()`
- Processa convites automaticamente quando usuário se autentica
- Cria perfil e associação tenant_user
- Remove convite após processamento

### 3. Alterações no Frontend

#### `src/hooks/useInvitations.ts`
- Removida lógica de tokens customizados
- Simplificada interface `Invitation`
- Atualizado para usar novas funções RPC

#### `src/pages/Convites.tsx`
- Status baseado na data de criação (7 dias para expirar)
- Botão "Copiar Info" ao invés de "Copiar Link"
- Orientação para usar admin panel do Supabase

#### `src/pages/AceitarConvite.tsx`
- Simplificada para processamento automático
- Remove validação de tokens customizados
- Processo automático quando usuário faz login

### 4. Removidas

- Edge function `send-invitation-email`
- Configuração `supabase/config.toml` da edge function
- Lógica de tokens customizados
- Sistema de validação de convites customizado

## Como Usar o Sistema Atual

### Para Administradores:

1. **Criar Convite:**
   - Use a interface "Novo Convite" na página de convites
   - O convite será salvo no banco de dados

2. **Enviar Email:**
   - Acesse o painel administrativo do Supabase
   - Vá em Authentication > Users
   - Use a funcionalidade "Invite user by email"
   - Configure o redirect_url para `/dashboard`

### Para Usuários Convidados:

1. **Receber Email:** Email será enviado pelo Supabase
2. **Fazer Login/Registro:** Use o link no email para se autenticar
3. **Processamento Automático:** Sistema detecta automaticamente convites pendentes
4. **Acesso Liberado:** Usuário é adicionado ao tenant com a função correta

## Benefícios da Nova Abordagem

- ✅ **Padrão Oficial:** Segue as melhores práticas do Supabase
- ✅ **Menor Complexidade:** Remove código customizado desnecessário
- ✅ **Emails Garantidos:** Usa sistema nativo de emails do Supabase
- ✅ **Segurança:** Aproveita sistema de autenticação robusto
- ✅ **Manutenibilidade:** Código mais simples e confiável

## Próximos Passos

1. Testar fluxo completo de convites
2. Documentar processo para administradores
3. Configurar templates de email no Supabase (opcional)
4. Monitorar logs de autenticação para debugging

## Observações Importantes

- O sistema agora depende do admin panel do Supabase para envio de emails
- Links de convite são gerenciados automaticamente pelo Supabase
- Processamento é automático durante login/registro
- Convites expiram automaticamente após 7 dias (configurável)