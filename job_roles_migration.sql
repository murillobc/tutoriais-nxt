-- MIGRAÇÃO PARA TABELA DE CARGOS/DEPARTAMENTOS
-- Execute este script no seu banco de dados PostgreSQL

-- 1. Criar tabela job_roles
CREATE TABLE IF NOT EXISTS job_roles (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    value TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('department', 'client_role')),
    active BOOLEAN DEFAULT TRUE NOT NULL,
    sort_order INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- 2. Inserir departamentos (para funcionários Nextest)
INSERT INTO job_roles (name, value, type, sort_order) VALUES 
('Engenharia', 'engineering', 'department', 1),
('Vendas', 'sales', 'department', 2),
('Suporte', 'support', 'department', 3),
('Gerência', 'management', 'department', 4),
('Outro', 'other', 'department', 5)
ON CONFLICT DO NOTHING;

-- 3. Inserir cargos (para clientes)  
INSERT INTO job_roles (name, value, type, sort_order) VALUES 
('Desenvolvedor', 'Desenvolvedor', 'client_role', 1),
('Gerente', 'Gerente', 'client_role', 2),
('Analista', 'Analista', 'client_role', 3),
('Coordenador', 'Coordenador', 'client_role', 4),
('Diretor', 'Diretor', 'client_role', 5),
('Técnico', 'Técnico', 'client_role', 6),
('Consultor', 'Consultor', 'client_role', 7),
('Supervisor', 'Supervisor', 'client_role', 8),
('Outro', 'Outro', 'client_role', 9)
ON CONFLICT DO NOTHING;

-- 4. Verificar dados inseridos
SELECT 
    type,
    COUNT(*) as total,
    STRING_AGG(name, ', ') as roles
FROM job_roles 
WHERE active = true 
GROUP BY type 
ORDER BY type;

-- 5. Mostrar todos os cargos inseridos
SELECT id, name, value, type, sort_order, active, created_at 
FROM job_roles 
ORDER BY type, sort_order, name;

COMMIT;