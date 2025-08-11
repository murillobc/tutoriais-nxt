-- SCRIPT DE CORREÇÃO PARA BANCO DE PRODUÇÃO
-- Execute APENAS os comandos necessários baseados no diagnóstico

-- 1. CRIAR COLUNA DE EXPIRAÇÃO (se não existir)
-- Execute APENAS se a verificação mostrar que a coluna não existe
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tutorial_releases' 
        AND column_name = 'expiration_date'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE tutorial_releases ADD COLUMN expiration_date TIMESTAMP;
        RAISE NOTICE 'Coluna expiration_date criada com sucesso';
    ELSE
        RAISE NOTICE 'Coluna expiration_date já existe';
    END IF;
END $$;

-- 2. INSERIR TUTORIAIS BÁSICOS (se tabela estiver vazia)
-- Execute APENAS se não houver tutoriais cadastrados
INSERT INTO tutorials (name, description, tag, id_cademi) 
SELECT * FROM (VALUES
    ('SmartOTDR 100B', 'MOD. SMARTOTDR 100B, REFLECTOMETRO ÓPTICO NO DOMÍNIO DO TEMPO PARA FIBRAS OPTICAS', 'OTDR, VIAVI', 393942),
    ('Sumtomo T402s', 'MOD. T-402S, MAQUINA DE FUSAO PARA EMENDA DE FIBRA OPTICA C/ ALINHAMENTO ATIVO PELA CASCA', 'Máquina de fusão, Sumitomo', 414077),
    ('Tutorial Básico', 'Introdução ao sistema', 'basico', 1),
    ('Tutorial Avançado', 'Funcionalidades avançadas', 'avancado', 2)
) AS t(name, description, tag, id_cademi)
WHERE NOT EXISTS (SELECT 1 FROM tutorials LIMIT 1);

-- 3. ATUALIZAR RELEASES EXISTENTES COM STATUS SUCCESS PARA TER DATA DE EXPIRAÇÃO
-- Execute APENAS se quiser definir expiração para releases já existentes com status success
UPDATE tutorial_releases 
SET expiration_date = created_at + INTERVAL '90 days'
WHERE status = 'success' 
AND expiration_date IS NULL;

-- 4. CRIAR FUNÇÃO DE VERIFICAÇÃO DE EXPIRAÇÃO (se não existir)
CREATE OR REPLACE FUNCTION check_and_update_expired_releases()
RETURNS void AS $$
BEGIN
    UPDATE tutorial_releases 
    SET status = 'expired'
    WHERE status = 'success' 
    AND expiration_date IS NOT NULL 
    AND expiration_date <= NOW();
    
    GET DIAGNOSTICS rowcount = ROW_COUNT;
    RAISE NOTICE 'Atualizados % releases para status expired', rowcount;
END;
$$ LANGUAGE plpgsql;

-- 5. EXECUTAR VERIFICAÇÃO DE EXPIRAÇÃO IMEDIATAMENTE
SELECT check_and_update_expired_releases();

-- 6. VERIFICAR RESULTADO FINAL
SELECT 
    'Estrutura atualizada com sucesso!' as status,
    COUNT(*) as total_releases,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
    COUNT(CASE WHEN status = 'success' THEN 1 END) as success,
    COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed,
    COUNT(CASE WHEN status = 'expired' THEN 1 END) as expired,
    COUNT(CASE WHEN expiration_date IS NOT NULL THEN 1 END) as com_data_expiracao
FROM tutorial_releases;

COMMIT;