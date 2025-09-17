# Botão de Criação de Super Admin na Tela de Login

**Data:** 17/09/2025  
**Arquivo:** `src/pages/admin/AdminLogin.tsx`

## Alteração Realizada

Adicionado botão discreto "Criar Super Admin" na tela de login administrativo, permitindo a criação de novos super administradores diretamente na tela de login.

## Funcionalidades Implementadas

### Botão de Acesso
- Botão discreto posicionado abaixo do aviso de acesso restrito
- Estilo ghost com texto pequeno e ícone UserPlus
- Hover effect com cor vermelha para manter identidade visual

### Modal de Criação
- Formulário completo com validação
- Campos obrigatórios:
  - Nome Completo
  - Email
  - Senha (com botão de mostrar/ocultar)
  - PIN Secreto (mascarado)

### Integração com Edge Function
- Utiliza a edge function `create-super-admin` para validação do PIN
- PIN secreto armazenado criptografado no Supabase secrets
- Validação server-side antes da criação

## Segurança
- PIN não exposto no código frontend
- Validação realizada via edge function
- Senha oculta por padrão com opção de visualização
- Toast de feedback para sucesso/erro

## Posicionamento Visual
- Localizado no card de login administrativo
- Integrado de forma discreta na interface existente
- Mantém a identidade visual vermelha do portal admin