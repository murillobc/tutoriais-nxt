-- SCRIPT DE DIAGNÓSTICO PARA BANCO DE PRODUÇÃO
-- Execute estas consultas no seu banco de produção para verificar

-- 1. Verificar se as tabelas existem
SELECT table_name, table_schema 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'verification_codes', 'tutorials', 'tutorial_releases')
ORDER BY table_name;

-- 2. Verificar estrutura da tabela tutorial_releases
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'tutorial_releases' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Verificar se a coluna expiration_date existe
SELECT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'tutorial_releases' 
    AND column_name = 'expiration_date'
    AND table_schema = 'public'
) AS coluna_expiration_date_existe;

-- 4. Verificar dados existentes na tabela tutorial_releases
SELECT 
    COUNT(*) as total_releases,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
    COUNT(CASE WHEN status = 'success' THEN 1 END) as success,
    COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed,
    COUNT(CASE WHEN status = 'expired' THEN 1 END) as expired
FROM tutorial_releases;

-- 5. Verificar se existem tutoriais cadastrados
SELECT COUNT(*) as total_tutorials FROM tutorials;

-- 6. Verificar últimos releases criados
SELECT 
    id, 
    client_name, 
    status, 
    created_at,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'tutorial_releases' 
            AND column_name = 'expiration_date'
        ) THEN 'Coluna existe' 
        ELSE 'Coluna NÃO existe' 
    END as status_coluna_expiracao
FROM tutorial_releases 
ORDER BY created_at DESC 
LIMIT 5;

-- 7. Se a coluna expiration_date não existir, este comando a criará:
-- DESCOMENTE A LINHA ABAIXO APENAS SE A CONSULTA #3 RETORNAR FALSE
-- ALTER TABLE tutorial_releases ADD COLUMN expiration_date TIMESTAMP;

-- 8. Verificar se a função gen_random_uuid() está disponível
SELECT gen_random_uuid() as teste_uuid;