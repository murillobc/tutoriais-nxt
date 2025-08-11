# CHANGELOG - Versão 2.0.0

## 🚀 Principais Mudanças da Versão 2

### ✅ Sistema de Autenticação Simplificado
- **REMOVIDO**: Autenticação por código de verificação por email
- **ADICIONADO**: Login direto com email e senha
- **ADICIONADO**: Sistema "Esqueci minha senha" com envio de código por email para redefinição
- **MANTIDO**: Restrição de domínio @nextest.com.br

### 🔧 API de Status para Integração Externa
- **NOVO ENDPOINT**: `POST /api/tutorial-releases/:id/status`
- **Permite**: Sistemas externos atualizarem status de "pending" para "success" ou "failed"
- **Parâmetros aceitos**: 
  - `status`: "pending", "success", "failed"
  - `message`: mensagem opcional
- **Uso**: Integração com sistemas de liberação automática

### 📧 Configuração de Email Resend
- **Configuração otimizada** para usar smtp.resend.com
- **Baseado na configuração Chatwoot** que está funcionando na VPS
- **Variáveis de ambiente**:
  - `SMTP_ADDRESS`: smtp.resend.com
  - `SMTP_PORT`: 587
  - `SMTP_USERNAME`: resend
  - `SMTP_PASSWORD`: sua API key do Resend
  - `SMTP_FROM`: Portal Nextest <no-reply@educanextest.com.br>
  - `SMTP_DOMAIN`: educanextest.com.br

### 🐳 Docker e Deploy
- **Dockerfile** para produção com multi-stage build
- **docker-compose.prod.yml** para deploy na VPS com Traefik
- **docker-compose.backend.yml** para deploy apenas do backend
- **Configuração para** tutoriais.educanextest.com.br

### 🗄️ Banco de Dados
- **Mantido Neon PostgreSQL** com WebSocket support
- **Configuração drizzle.config.ts** atualizada para usar ./migrations
- **Suporte para produção** com pool de conexões

## 📁 Arquivos Principais Alterados

### Novos Arquivos
- `Dockerfile`
- `docker-compose.prod.yml`
- `docker-compose.backend.yml`
- `test_status_update.html` (página de teste da API)
- `tutorial_status_api.md` (documentação da API)

### Arquivos Modificados
- `server/services/emailService.ts` - Configuração Resend otimizada
- `server/routes.ts` - API de status e autenticação simplificada
- `client/src/pages/login.tsx` - Login direto sem códigos
- `client/src/hooks/use-auth.tsx` - Autenticação simplificada
- `drizzle.config.ts` - Output para ./migrations
- `.gitignore` - Adicionados arquivos de produção
- `replit.md` - Documentação atualizada

## 🔄 Como Fazer o Deploy da V2

### 1. Para Desenvolvimento Local
```bash
npm install
npm run dev
```

### 2. Para VPS com Docker
```bash
# Usar docker-compose.prod.yml
docker-compose -f docker-compose.prod.yml up -d
```

### 3. Variáveis de Ambiente Necessárias
```env
DATABASE_URL=sua_string_neon_postgresql
SESSION_SECRET=sua_chave_secreta
SMTP_ADDRESS=smtp.resend.com
SMTP_PORT=587
SMTP_USERNAME=resend
SMTP_PASSWORD=sua_api_key_resend
SMTP_FROM=Portal Nextest <no-reply@educanextest.com.br>
SMTP_DOMAIN=educanextest.com.br
WEBHOOK_URL=https://wfapi.automai.com.br/webhook/cadastro/cademi
```

## 🧪 Como Testar a API de Status

### Exemplo cURL
```bash
curl -X POST "https://tutoriais.educanextest.com.br/api/tutorial-releases/ID_DO_RELEASE/status" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "success",
    "message": "Tutorial liberado automaticamente"
  }'
```

### Exemplo JavaScript
```javascript
fetch('/api/tutorial-releases/ID_DO_RELEASE/status', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    status: 'success',
    message: 'Tutorial liberado'
  })
})
```

## 🎯 Benefícios da V2

1. **Experiência mais fluida** - Login direto sem códigos
2. **Integração externa** - API para automação de status
3. **Deploy simplificado** - Docker completo para VPS
4. **Email confiável** - Resend SMTP otimizado
5. **Produção ready** - Configurações para educanextest.com.br

## ⚠️ Breaking Changes

- **Autenticação**: Códigos de verificação removidos
- **API**: Novo endpoint de status requer integração
- **Deploy**: Agora usa Docker para produção

## 🔄 Migration da V1 para V2

1. Usuários existentes continuam funcionando
2. Não há mudanças no banco de dados
3. Apenas atualize as variáveis de ambiente do SMTP
4. Configure a API de status se necessário

---

## 📋 Checklist para Deploy V2

- [ ] Configurar variáveis SMTP_* no ambiente
- [ ] Testar login sem códigos
- [ ] Testar "Esqueci minha senha"
- [ ] Testar API de status `/api/tutorial-releases/:id/status`
- [ ] Verificar emails chegando via Resend
- [ ] Configurar Docker na VPS
- [ ] Apontar DNS para tutoriais.educanextest.com.br

---

**Versão 2.0.0** - Sistema de Tutorial Release Management Nextest
Data: 11 de Agosto de 2025