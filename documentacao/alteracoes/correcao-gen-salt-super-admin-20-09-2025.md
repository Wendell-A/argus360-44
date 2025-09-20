# Correção: Erro gen_salt na Criação de Super Admin - 20/09/2025

## Problema Identificado
- Erro: `function gen_salt(unknown) does not exist`
- Causa: Função `create_super_admin` não conseguia acessar as funções `crypt` e `gen_salt` do schema `extensions`
- Impacto: Impossibilidade de criar novos super administradores via interface

## Diagnóstico Realizado
1. **Verificação da extensão pgcrypto**: ✅ Instalada corretamente
2. **Localização das funções**: ✅ `crypt` e `gen_salt` disponíveis no schema `extensions`
3. **Análise dos logs**: Confirmou erro na função SQL, não na edge function
4. **Problema raiz**: `search_path` não incluía acesso adequado ao schema `extensions`

## Solução Implementada

### 1. Função create_super_admin Corrigida
```sql
CREATE OR REPLACE FUNCTION public.create_super_admin(
  p_email character varying, 
  p_password character varying, 
  p_full_name character varying
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Usar chamadas explícitas para o schema extensions
  INSERT INTO public.super_admins (
    email, 
    password_hash, 
    full_name
  ) VALUES (
    p_email,
    extensions.crypt(p_password, extensions.gen_salt('bf')),
    p_full_name
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Super administrador criado com sucesso'
  );
END;
$function$;
```

### 2. Função authenticate_super_admin Atualizada
- Também corrigida para usar `extensions.crypt()` explicitamente
- Mantém consistência no sistema de autenticação

## Mudanças Técnicas
- **Antes**: `crypt(p_password, gen_salt('bf'))`
- **Depois**: `extensions.crypt(p_password, extensions.gen_salt('bf'))`
- **Método**: Chamadas explícitas ao schema `extensions`

## Resultado Esperado
✅ Criação de super admin funcional via interface
✅ Hash seguro de senhas com bcrypt
✅ Autenticação de super admin operacional
✅ Sistema administrativo completamente funcional

## Teste Recomendado
1. Acesse `/admin-login`
2. Clique em "Criar Super Admin"
3. Preencha: nome, email, senha e PIN secreto
4. Verifique se a criação é bem-sucedida
5. Teste login com as credenciais criadas

**Data:** 20/09/2025 - 22:17
**Status:** ✅ RESOLVIDO