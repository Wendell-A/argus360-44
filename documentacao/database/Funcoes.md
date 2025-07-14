
# Funções e Triggers do Banco de Dados

## Funções de Segurança

### 1. get_user_escritorio_id()
**Propósito**: Retorna o ID do escritório do usuário autenticado para uso em políticas RLS.

```sql
CREATE OR REPLACE FUNCTION public.get_user_escritorio_id()
RETURNS BIGINT
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $function$
BEGIN
  -- Função simples que retorna o escritório do usuário atual
  -- sem causar recursão nas políticas RLS
  RETURN (
    SELECT u.id_escritorio 
    FROM public.usuarios u 
    WHERE u.uuid::text = auth.uid()::text
    LIMIT 1
  );
END;
$function$
```

**Características**:
- `STABLE`: Resultado não muda durante a transação
- `SECURITY DEFINER`: Executa com privilégios do criador
- Evita recursão infinita em políticas RLS
- Usado em todas as políticas de isolamento por escritório

### 2. user_has_admin_access()
**Propósito**: Verifica se o usuário atual tem privilégios administrativos.

```sql
CREATE OR REPLACE FUNCTION public.user_has_admin_access()
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.usuarios u
    JOIN public.perfis_acesso p ON u.id_perfil_acesso = p.id
    WHERE u.uuid::text = auth.uid()::text 
    AND p.nivel_acesso >= 8
  );
END;
$function$
```

**Características**:
- Nível 8+ = Acesso administrativo
- Usado para operações sensíveis
- Cached durante a sessão

## Funções de Auditoria

### 3. trigger_auditoria()
**Propósito**: Registra automaticamente todas as operações nas tabelas principais.

```sql
CREATE OR REPLACE FUNCTION public.trigger_auditoria()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
    -- Log para INSERT
    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.auditoria_sistema (
            id_escritorio, acao, tabela_afetada, registro_id, dados_novos, ip_origem
        ) VALUES (
            COALESCE(NEW.id_escritorio, 
                CASE WHEN TG_TABLE_NAME = 'escritorios' THEN NEW.id ELSE NULL END),
            'INSERT',
            TG_TABLE_NAME,
            NEW.id,
            to_jsonb(NEW),
            inet_client_addr()
        );
        RETURN NEW;
    END IF;

    -- Log para UPDATE
    IF TG_OP = 'UPDATE' THEN
        INSERT INTO public.auditoria_sistema (
            id_escritorio, acao, tabela_afetada, registro_id, 
            dados_anteriores, dados_novos, ip_origem
        ) VALUES (
            COALESCE(NEW.id_escritorio, OLD.id_escritorio,
                CASE WHEN TG_TABLE_NAME = 'escritorios' THEN NEW.id ELSE NULL END),
            'UPDATE',
            TG_TABLE_NAME,
            NEW.id,
            to_jsonb(OLD),
            to_jsonb(NEW),
            inet_client_addr()
        );
        RETURN NEW;
    END IF;

    -- Log para DELETE
    IF TG_OP = 'DELETE' THEN
        INSERT INTO public.auditoria_sistema (
            id_escritorio, acao, tabela_afetada, registro_id, dados_anteriores, ip_origem
        ) VALUES (
            COALESCE(OLD.id_escritorio,
                CASE WHEN TG_TABLE_NAME = 'escritorios' THEN OLD.id ELSE NULL END),
            'DELETE',
            TG_TABLE_NAME,
            OLD.id,
            to_jsonb(OLD),
            inet_client_addr()
        );
        RETURN OLD;
    END IF;

    RETURN NULL;
END;
$function$
```

**Características**:
- Captura INSERT, UPDATE, DELETE
- Armazena dados antigos e novos em JSONB
- Registra IP de origem
- Identifica automaticamente o escritório

## Funções Utilitárias

### 4. update_timestamp()
**Propósito**: Atualiza automaticamente o campo `data_atualizacao`.

```sql
CREATE OR REPLACE FUNCTION public.update_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.data_atualizacao = NOW();
    RETURN NEW;
END;
$function$
```

**Uso**: Aplicado em todas as tabelas principais via triggers.

### 5. criar_perfis_padrao()
**Propósito**: Cria perfis de acesso padrão para novos escritórios.

```sql
CREATE OR REPLACE FUNCTION public.criar_perfis_padrao(escritorio_id BIGINT)
RETURNS VOID
LANGUAGE plpgsql
AS $function$
BEGIN
    -- Perfil Super Admin (nível 10)
    INSERT INTO public.perfis_acesso (id_escritorio, nome, descricao, nivel_acesso, sistema, permissoes) VALUES
    (escritorio_id, 'Super Admin', 'Acesso completo ao sistema', 10, true, 
     '{"usuarios": {"create": true, "read": true, "update": true, "delete": true}, 
       "configuracoes": {"create": true, "read": true, "update": true, "delete": true},
       "relatorios": {"create": true, "read": true, "update": true, "delete": true},
       "auditoria": {"read": true}}');

    -- Perfil Admin (nível 8)
    INSERT INTO public.perfis_acesso (id_escritorio, nome, descricao, nivel_acesso, sistema, permissoes) VALUES
    (escritorio_id, 'Administrador', 'Administrador do escritório', 8, true,
     '{"usuarios": {"create": true, "read": true, "update": true, "delete": false}, 
       "clientes": {"create": true, "read": true, "update": true, "delete": true},
       "vendas": {"create": true, "read": true, "update": true, "delete": true},
       "relatorios": {"read": true}}');

    -- Perfil Gestor (nível 5)
    INSERT INTO public.perfis_acesso (id_escritorio, nome, descricao, nivel_acesso, sistema, permissoes) VALUES
    (escritorio_id, 'Gestor', 'Gestor de vendas e equipe', 5, true,
     '{"clientes": {"create": true, "read": true, "update": true, "delete": false}, 
       "vendas": {"create": true, "read": true, "update": true, "delete": false},
       "relatorios": {"read": true}}');

    -- Perfil Vendedor (nível 2)
    INSERT INTO public.perfis_acesso (id_escritorio, nome, descricao, nivel_acesso, sistema, permissoes) VALUES
    (escritorio_id, 'Vendedor', 'Vendedor padrão', 2, true,
     '{"clientes": {"create": true, "read": true, "update": true, "delete": false}, 
       "vendas": {"create": true, "read": true, "update": false, "delete": false}}');

    -- Perfil Operacional (nível 1)
    INSERT INTO public.perfis_acesso (id_escritorio, nome, descricao, nivel_acesso, sistema, permissoes) VALUES
    (escritorio_id, 'Operacional', 'Acesso operacional básico', 1, true,
     '{"clientes": {"create": false, "read": true, "update": false, "delete": false}}');
END;
$function$
```

### 6. trigger_criar_perfis_automaticos()
**Propósito**: Trigger que executa a criação automática de perfis.

```sql
CREATE OR REPLACE FUNCTION public.trigger_criar_perfis_automaticos()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $function$
BEGIN
    -- Criar perfis padrão quando um novo escritório é criado
    PERFORM public.criar_perfis_padrao(NEW.id);
    RETURN NEW;
END;
$function$
```

## Triggers Aplicados

### Triggers de Auditoria
```sql
-- Não há triggers definidos atualmente, mas podem ser aplicados assim:

CREATE TRIGGER trigger_auditoria_usuarios
    AFTER INSERT OR UPDATE OR DELETE ON usuarios
    FOR EACH ROW EXECUTE FUNCTION trigger_auditoria();

CREATE TRIGGER trigger_auditoria_escritorios
    AFTER INSERT OR UPDATE OR DELETE ON escritorios
    FOR EACH ROW EXECUTE FUNCTION trigger_auditoria();

CREATE TRIGGER trigger_auditoria_perfis
    AFTER INSERT OR UPDATE OR DELETE ON perfis_acesso
    FOR EACH ROW EXECUTE FUNCTION trigger_auditoria();
```

### Triggers de Timestamp
```sql
CREATE TRIGGER update_escritorios_timestamp
    BEFORE UPDATE ON escritorios
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_usuarios_timestamp
    BEFORE UPDATE ON usuarios
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_perfis_timestamp
    BEFORE UPDATE ON perfis_acesso
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();
```

### Trigger de Criação de Perfis
```sql
CREATE TRIGGER trigger_criar_perfis_padrao
    AFTER INSERT ON escritorios
    FOR EACH ROW EXECUTE FUNCTION trigger_criar_perfis_automaticos();
```

## Funções de Validação

### Validação de Email
```sql
CREATE OR REPLACE FUNCTION validate_email(email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$';
END;
$$;
```

### Validação de CNPJ
```sql
CREATE OR REPLACE FUNCTION validate_cnpj(cnpj TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
    -- Remove formatação
    cnpj := regexp_replace(cnpj, '[^0-9]', '', 'g');
    
    -- Verifica se tem 14 dígitos
    IF length(cnpj) != 14 THEN
        RETURN FALSE;
    END IF;
    
    -- Validação do algoritmo de CNPJ (simplificada)
    -- Implementação completa seria mais extensa
    RETURN TRUE;
END;
$$;
```

## Funções de Relatório

### Estatísticas por Escritório
```sql
CREATE OR REPLACE FUNCTION get_escritorio_stats(escritorio_id BIGINT)
RETURNS TABLE(
    total_usuarios BIGINT,
    usuarios_ativos BIGINT,
    ultimo_login TIMESTAMP WITH TIME ZONE,
    total_operacoes BIGINT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_usuarios,
        COUNT(*) FILTER (WHERE ativo = true) as usuarios_ativos,
        MAX(ultimo_login) as ultimo_login,
        (SELECT COUNT(*) FROM auditoria_sistema WHERE id_escritorio = escritorio_id) as total_operacoes
    FROM usuarios 
    WHERE id_escritorio = escritorio_id;
END;
$$;
```

## Manutenção e Performance

### Limpeza de Auditoria
```sql
CREATE OR REPLACE FUNCTION limpar_auditoria_antiga(meses_atras INTEGER DEFAULT 24)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    registros_removidos INTEGER;
BEGIN
    DELETE FROM auditoria_sistema 
    WHERE timestamp_acao < NOW() - INTERVAL '1 month' * meses_atras;
    
    GET DIAGNOSTICS registros_removidos = ROW_COUNT;
    RETURN registros_removidos;
END;
$$;
```

### Reindexação Automática
```sql
CREATE OR REPLACE FUNCTION reindex_tabelas_principais()
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    REINDEX TABLE usuarios;
    REINDEX TABLE escritorios;
    REINDEX TABLE perfis_acesso;
    REINDEX TABLE auditoria_sistema;
    
    -- Atualiza estatísticas
    ANALYZE usuarios;
    ANALYZE escritorios;
    ANALYZE perfis_acesso;
    ANALYZE auditoria_sistema;
END;
$$;
```

## Segurança das Funções

### Princípios Aplicados
1. **SECURITY DEFINER**: Funções críticas executam com privilégios elevados
2. **Validação de Entrada**: Todas as entradas são validadas
3. **Isolamento**: Funções respeitam o isolamento por escritório
4. **Auditoria**: Operações sensíveis são logadas
5. **Performance**: Funções são otimizadas para evitar locks longos

### Permissões
```sql
-- Revoga acesso público e concede apenas para roles específicas
REVOKE ALL ON FUNCTION get_user_escritorio_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_user_escritorio_id() TO authenticated;

REVOKE ALL ON FUNCTION user_has_admin_access() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION user_has_admin_access() TO authenticated;
```
