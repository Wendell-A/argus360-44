-- Tarefa 1: Adicionar novas colunas à tabela sales para documentação
ALTER TABLE sales 
ADD COLUMN ata TEXT,
ADD COLUMN proposta TEXT,
ADD COLUMN cod_grupo INTEGER,
ADD COLUMN cota INTEGER;