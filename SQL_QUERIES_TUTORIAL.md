# 📊 Consultas SQL - Tutorial Releases

## 🔍 Consultas Básicas de Status

### 1. **Ver todos os tutoriais pendentes**
```sql
SELECT id, client_name, client_email, status, created_at 
FROM tutorial_releases 
WHERE status = 'pending' 
ORDER BY created_at DESC;
```

### 2. **Contar tutoriais por status**
```sql
SELECT status, COUNT(*) as total 
FROM tutorial_releases 
GROUP BY status;
```

### 3. **Ver tutoriais com sucesso**
```sql
SELECT id, client_name, client_email, status, created_at 
FROM tutorial_releases 
WHERE status = 'success' 
ORDER BY created_at DESC;
```

### 4. **Ver tutoriais com falha**
```sql
SELECT id, client_name, client_email, status, created_at 
FROM tutorial_releases 
WHERE status = 'failed' 
ORDER BY created_at DESC;
```

## 📈 Consultas de Monitoramento

### 5. **Tutoriais criados hoje**
```sql
SELECT id, client_name, status, created_at 
FROM tutorial_releases 
WHERE DATE(created_at) = CURRENT_DATE 
ORDER BY created_at DESC;
```

### 6. **Tutoriais criados nos últimos 7 dias**
```sql
SELECT id, client_name, status, created_at 
FROM tutorial_releases 
WHERE created_at >= NOW() - INTERVAL '7 days' 
ORDER BY created_at DESC;
```

### 7. **Tutoriais por mês**
```sql
SELECT 
    EXTRACT(YEAR FROM created_at) as ano,
    EXTRACT(MONTH FROM created_at) as mes,
    status,
    COUNT(*) as total
FROM tutorial_releases 
GROUP BY EXTRACT(YEAR FROM created_at), EXTRACT(MONTH FROM created_at), status
ORDER BY ano DESC, mes DESC;
```

## 🎯 Consultas para n8n/Automação

### 8. **IDs dos tutoriais pendentes (para automação)**
```sql
SELECT id 
FROM tutorial_releases 
WHERE status = 'pending';
```

### 9. **Tutoriais pendentes com detalhes completos**
```sql
SELECT 
    tr.id,
    tr.client_name,
    tr.client_email,
    tr.client_cpf,
    tr.client_company,
    tr.status,
    tr.created_at,
    array_agg(t.name) as tutorials
FROM tutorial_releases tr
LEFT JOIN tutorial_releases_tutorials trt ON tr.id = trt.release_id
LEFT JOIN tutorials t ON trt.tutorial_id = t.id
WHERE tr.status = 'pending'
GROUP BY tr.id, tr.client_name, tr.client_email, tr.client_cpf, tr.client_company, tr.status, tr.created_at
ORDER BY tr.created_at DESC;
```

### 10. **Tutoriais pendentes antigos (mais de 1 dia)**
```sql
SELECT id, client_name, client_email, status, created_at,
       NOW() - created_at as tempo_pendente
FROM tutorial_releases 
WHERE status = 'pending' 
  AND created_at < NOW() - INTERVAL '1 day'
ORDER BY created_at ASC;
```

## 📊 Relatórios Executivos

### 11. **Resumo geral**
```sql
SELECT 
    COUNT(*) as total_releases,
    SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pendentes,
    SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as sucesso,
    SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as falhas,
    ROUND(
        (SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END)::float / COUNT(*)) * 100, 
        2
    ) as taxa_sucesso_pct
FROM tutorial_releases;
```

### 12. **Performance por empresa**
```sql
SELECT 
    client_company,
    COUNT(*) as total,
    SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as sucessos,
    SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pendentes
FROM tutorial_releases 
WHERE client_company IS NOT NULL
GROUP BY client_company
ORDER BY total DESC;
```

## 🔧 Consultas de Manutenção

### 13. **Ver estrutura da tabela**
```sql
\d tutorial_releases;
```

### 14. **Últimas atividades (últimos 10 registros)**
```sql
SELECT id, client_name, status, created_at 
FROM tutorial_releases 
ORDER BY created_at DESC 
LIMIT 10;
```

### 15. **Procurar por cliente específico**
```sql
SELECT * 
FROM tutorial_releases 
WHERE client_name ILIKE '%João%' 
   OR client_email ILIKE '%joao%';
```

## 🚀 Consultas para API/Integração

### 16. **Tutorial release específico (para API)**
```sql
SELECT 
    tr.*,
    array_agg(
        json_build_object(
            'id', t.id,
            'name', t.name,
            'description', t.description
        )
    ) as tutorials
FROM tutorial_releases tr
LEFT JOIN tutorial_releases_tutorials trt ON tr.id = trt.release_id
LEFT JOIN tutorials t ON trt.tutorial_id = t.id
WHERE tr.id = 'SEU_ID_AQUI'
GROUP BY tr.id;
```

### 17. **Validar se ID existe antes de atualizar status**
```sql
SELECT EXISTS(
    SELECT 1 FROM tutorial_releases 
    WHERE id = 'SEU_ID_AQUI'
) as existe;
```

## 📱 Uso no Terminal/Scripts

### Para usar no terminal da VPS:
```bash
# Conectar ao banco
psql $DATABASE_URL

# Executar consulta
\x  # Formato expandido para melhor visualização
SELECT * FROM tutorial_releases WHERE status = 'pending';
```

### Para usar em scripts:
```bash
# Contar pendentes
psql $DATABASE_URL -t -c "SELECT COUNT(*) FROM tutorial_releases WHERE status = 'pending';"

# Listar IDs pendentes
psql $DATABASE_URL -t -c "SELECT id FROM tutorial_releases WHERE status = 'pending';"
```

## 🎯 Exemplos de Automação n8n

### Consulta para buscar pendentes no n8n:
```javascript
// Database Node no n8n
const query = `
    SELECT id, client_name, client_email, created_at 
    FROM tutorial_releases 
    WHERE status = 'pending' 
      AND created_at < NOW() - INTERVAL '1 hour'
    ORDER BY created_at ASC
`;
```

### Atualizar múltiplos de uma vez:
```sql
UPDATE tutorial_releases 
SET status = 'success' 
WHERE id IN ('id1', 'id2', 'id3')
RETURNING id, client_name, status;
```

---

**Use essas consultas para monitorar e gerenciar os tutorial releases!**
Data: 11 de Agosto de 2025