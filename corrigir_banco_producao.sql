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

-- 2. CRIAR TABELA JOB_ROLES (cargos/departamentos)
CREATE TABLE IF NOT EXISTS job_roles (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    value TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('department', 'client_role')),
    active BOOLEAN DEFAULT TRUE NOT NULL,
    sort_order INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Inserir departamentos e cargos
INSERT INTO job_roles (name, value, type, sort_order) VALUES 
('Engenharia', 'engineering', 'department', 1),
('Vendas', 'sales', 'department', 2),
('Suporte', 'support', 'department', 3),
('Gerência', 'management', 'department', 4),
('Outro', 'other', 'department', 5),
('Desenvolvedor', 'Desenvolvedor', 'client_role', 1),
('Gerente', 'Gerente', 'client_role', 2),
('Analista', 'Analista', 'client_role', 3),
('Coordenador', 'Coordenador', 'client_role', 4),
('Diretor', 'Diretor', 'client_role', 5),
('Técnico', 'Técnico', 'client_role', 6),
('Outro', 'Outro', 'client_role', 9)
ON CONFLICT DO NOTHING;

-- 3. INSERIR TUTORIAIS BÁSICOS (se tabela estiver vazia)
-- Execute APENAS se não houver tutoriais cadastrados
INSERT INTO tutorials (name, description, tag, id_cademi) 
SELECT * FROM (VALUES
    ('SmartOTDR 100B', 'MOD. SMARTOTDR 100B, REFLECTOMETRO ÓPTICO NO DOMÍNIO DO TEMPO PARA FIBRAS OPTICAS', 'OTDR, VIAVI', 393942),
    ('Sumtomo T402s', 'MOD. T-402S, MAQUINA DE FUSAO PARA EMENDA DE FIBRA OPTICA C/ ALINHAMENTO ATIVO PELA CASCA', 'Máquina de fusão, Sumitomo', 414077),
    ('Tutorial Básico', 'Introdução ao sistema', 'basico', 1),
    ('Tutorial Avançado', 'Funcionalidades avançadas', 'avancado', 2)
) AS t(name, description, tag, id_cademi)
WHERE NOT EXISTS (SELECT 1 FROM tutorials LIMIT 1);

-- 4. ATUALIZAR RELEASES EXISTENTES PARA TER DATA DE EXPIRAÇÃO (90 dias a partir da criação)
-- Execute APENAS se quiser definir expiração para releases já existentes
UPDATE tutorial_releases 
SET expiration_date = created_at + INTERVAL '90 days'
WHERE expiration_date IS NULL;

-- 5. CRIAR FUNÇÃO DE VERIFICAÇÃO DE EXPIRAÇÃO (se não existir)
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

-- 6. EXECUTAR VERIFICAÇÃO DE EXPIRAÇÃO IMEDIATAMENTE
SELECT check_and_update_expired_releases();

-- 7. VERIFICAR RESULTADO FINAL
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