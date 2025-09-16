-- Instalar extensão pgcrypto para funções de criptografia
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Verificar se a função crypt está disponível
SELECT 'pgcrypto extension installed successfully' as status;