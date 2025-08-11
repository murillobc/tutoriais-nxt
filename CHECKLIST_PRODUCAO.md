# Checklist para Produção - Tutorial Release System

## 🔍 Diagnóstico do Banco de Dados

Execute o arquivo `verificar_banco_producao.sql` no seu banco PostgreSQL de produção e verifique:

### 1. Estrutura das Tabelas
- [ ] Tabela `users` existe
- [ ] Tabela `verification_codes` existe  
- [ ] Tabela `tutorials` existe
- [ ] Tabela `tutorial_releases` existe

### 2. Coluna de Expiração
- [ ] Coluna `expiration_date` existe na tabela `tutorial_releases`
- [ ] Se NÃO existir, execute: `ALTER TABLE tutorial_releases ADD COLUMN expiration_date TIMESTAMP;`

### 3. Dados Básicos
- [ ] Existem tutoriais cadastrados na tabela `tutorials`
- [ ] Se vazia, execute o script `database_migration.sql` completo

### 4. Configuração da Aplicação
- [ ] Variável `DATABASE_URL` aponta para seu banco de produção
- [ ] Conexão PostgreSQL configurada (não Neon)
- [ ] SSL desabilitado para conexão local

## 🚨 Problemas Comuns

### Erro "column expiration_date does not exist"
**Solução**: Execute no banco:
```sql
ALTER TABLE tutorial_releases ADD COLUMN expiration_date TIMESTAMP;
```

### Erro de conexão com banco
**Verifique**:
1. URL de conexão correta
2. Banco PostgreSQL rodando
3. Permissões de acesso
4. Porta 5432 acessível

### Tabelas não existem
**Solução**: Execute o script completo `database_migration.sql`

### Aplicação não conecta
**Verifique**:
1. Arquivo `server/db.ts` configurado para PostgreSQL (não Neon)
2. Dependência `pg` instalada
3. SSL desabilitado se conexão local

## 🔧 Comandos de Correção

### Criar coluna de expiração
```sql
ALTER TABLE tutorial_releases ADD COLUMN expiration_date TIMESTAMP;
```

### Inserir tutoriais básicos (se tabela vazia)
```sql
INSERT INTO tutorials (name, description, tag, id_cademi) VALUES
('Tutorial Básico', 'Introdução ao sistema', 'basico', 1),
('Tutorial Avançado', 'Funcionalidades avançadas', 'avancado', 2),
('Tutorial Administrativo', 'Funções administrativas', 'admin', 3);
```

### Verificar últimos releases
```sql
SELECT id, client_name, status, created_at, expiration_date 
FROM tutorial_releases 
ORDER BY created_at DESC 
LIMIT 10;
```

## ✅ Teste Final

Após as correções:
1. Reinicie a aplicação
2. Tente criar um novo release
3. Verifique se a coluna "Data Expiração" aparece
4. Teste mudança de status via API
5. Verifique se botões de relatório funcionam

## 📞 Se Ainda Houver Problemas

Me envie o resultado das consultas do arquivo `verificar_banco_producao.sql` para diagnóstico específico.