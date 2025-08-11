# Instruções para Configurar o Banco de Dados

## 1. Execute o Script SQL

Execute o arquivo `database_migration.sql` no seu banco PostgreSQL:

```bash
# Conecte ao seu banco e execute:
psql -h postgres_tuto_nxt_postgres -U postgres -d postgres -f database_migration.sql
```

Ou copie e cole o conteúdo do arquivo `database_migration.sql` diretamente no seu cliente PostgreSQL (pgAdmin, DBeaver, etc.).

## 2. Configuração da Aplicação

A aplicação já está configurada para conectar no seu banco com a URL:
```
postgresql://postgres:cQM6q7g505tP@postgres_tuto_nxt_postgres:5432/postgres
```

## 3. Novas Funcionalidades Implementadas

### ✅ Sistema de Expiração (90 dias)
- Quando um tutorial release recebe status "success", automaticamente recebe data de expiração de 90 dias
- A aplicação verifica automaticamente releases expirados e atualiza o status para "expired"

### ✅ Sistema de Relatórios
- **PDF**: Gera relatórios em PDF com todas as informações dos releases
- **Excel**: Exporta dados em planilha Excel com informações completas
- Filtros por status disponíveis nos relatórios

### ✅ Interface Atualizada
- Nova coluna "Data Expiração" na tabela de releases
- Botões de exportação PDF e Excel
- Status visual para releases expirados (vermelho)
- Filtro "Expirados" no dropdown de status

## 4. API Endpoints Novos

### Relatórios
```
GET /api/reports/tutorial-releases
GET /api/reports/tutorial-releases?status=success
GET /api/reports/tutorial-releases?status=expired
```

## 5. Funcionamento da Expiração

1. **Ao mudar status para "success"**: Sistema define automaticamente `expirationDate = hoje + 90 dias`
2. **Verificação automática**: A cada carregamento da página, sistema verifica releases expirados
3. **Status automático**: Releases com data vencida são automaticamente marcados como "expired"

## 6. Teste das Funcionalidades

1. Acesse o dashboard da aplicação
2. Verifique se a nova coluna "Data Expiração" aparece
3. Teste os botões "PDF" e "Excel" para gerar relatórios
4. Crie um novo release e mude o status para "success" via API para testar a expiração

## 7. Estrutura das Tabelas Após Migration

- `users` - Usuários do sistema
- `verification_codes` - Códigos de verificação de email
- `tutorials` - Catálogo de tutoriais
- `tutorial_releases` - Releases com **NOVA coluna `expiration_date`**

## 8. Status Disponíveis

- `pending` - Pendente
- `success` - Sucesso (com data de expiração definida)
- `failed` - Falha
- `expired` - Expirado (automaticamente definido)