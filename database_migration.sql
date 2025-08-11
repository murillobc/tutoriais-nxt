-- Migração para adicionar coluna de data de expiração e outras funcionalidades
-- Execute este script no seu banco PostgreSQL

-- 1. Criar tabela de usuários se não existir
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    department TEXT NOT NULL,
    password TEXT,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- 2. Criar tabela de códigos de verificação se não existir
CREATE TABLE IF NOT EXISTS verification_codes (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    code TEXT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- 3. Criar tabela de tutoriais se não existir
CREATE TABLE IF NOT EXISTS tutorials (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    tag TEXT NOT NULL,
    id_cademi INTEGER NOT NULL
);

-- 4. Criar tabela de tutorial releases se não existir, ou adicionar nova coluna
CREATE TABLE IF NOT EXISTS tutorial_releases (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR NOT NULL REFERENCES users(id),
    client_name TEXT NOT NULL,
    client_cpf TEXT NOT NULL,
    client_email TEXT NOT NULL,
    client_phone TEXT,
    company_name TEXT NOT NULL,
    company_document TEXT NOT NULL,
    company_role TEXT NOT NULL,
    tutorial_ids JSONB NOT NULL,
    status TEXT DEFAULT 'pending' NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- 5. Adicionar coluna de data de expiração se não existir
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tutorial_releases' 
                   AND column_name = 'expiration_date') THEN
        ALTER TABLE tutorial_releases ADD COLUMN expiration_date TIMESTAMP;
    END IF;
END $$;

-- 6. Inserir dados básicos de tutoriais se a tabela estiver vazia
INSERT INTO tutorials (name, description, tag, id_cademi) 
SELECT * FROM (VALUES
    ('Tutorial Básico', 'Introdução ao sistema', 'basico', 1),
    ('Tutorial Avançado', 'Funcionalidades avançadas', 'avancado', 2),
    ('Tutorial Administrativo', 'Funções administrativas', 'admin', 3)
) AS t(name, description, tag, id_cademi)
WHERE NOT EXISTS (SELECT 1 FROM tutorials);

-- 7. Criar função para verificar e atualizar releases expirados
CREATE OR REPLACE FUNCTION check_and_update_expired_releases()
RETURNS void AS $$
BEGIN
    UPDATE tutorial_releases 
    SET status = 'expired'
    WHERE status = 'success' 
    AND expiration_date IS NOT NULL 
    AND expiration_date <= NOW();
END;
$$ LANGUAGE plpgsql;

-- 8. Criar uma trigger para executar automaticamente a verificação de expiração
-- (Opcional - pode ser executado via cron job ou aplicação)
-- CREATE OR REPLACE FUNCTION trigger_check_expiration()
-- RETURNS trigger AS $$
-- BEGIN
--     PERFORM check_and_update_expired_releases();
--     RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;

-- CREATE TRIGGER trigger_update_expiration
--     AFTER INSERT OR UPDATE ON tutorial_releases
--     FOR EACH STATEMENT
--     EXECUTE FUNCTION trigger_check_expiration();

COMMIT;