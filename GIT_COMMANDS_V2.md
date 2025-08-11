# 🚀 Comandos Git para Atualizar Versão 2.0.0

## 📋 Passo a Passo para Subir V2 no GitHub

### 1. Resolver Conflitos e Limpar Estado
```bash
# Remover lock do git (se existir)
rm -f .git/index.lock

# Verificar estado atual
git status

# Resolver conflitos no emailService.ts
git add server/services/emailService.ts

# Abortar merge se necessário e limpar
git merge --abort
git reset --hard HEAD
```

### 2. Fazer Backup da Versão Atual (V1)
```bash
# Criar tag da versão 1 antes de atualizar
git tag -a v1.0.0 -m "Versão 1 - Sistema com códigos de verificação"
git push origin v1.0.0
```

### 3. Adicionar Todas as Mudanças da V2
```bash
# Adicionar todos os arquivos novos e modificados
git add .

# Verificar o que será commitado
git status

# Commit com mensagem detalhada
git commit -m "🚀 Versão 2.0.0 - Sistema de Login Simplificado e API de Status

✅ PRINCIPAIS MUDANÇAS:
- Removido sistema de códigos de verificação
- Adicionado login direto email/senha
- Sistema 'Esqueci minha senha' implementado
- API de status para integração externa
- Configuração Resend SMTP otimizada
- Docker e docker-compose para VPS
- Deploy para educanextest.com.br

🔧 NOVOS ARQUIVOS:
- Dockerfile
- docker-compose.prod.yml
- docker-compose.backend.yml
- test_status_update.html
- tutorial_status_api.md
- CHANGELOG_V2.md
- GIT_COMMANDS_V2.md

📡 NOVA API:
POST /api/tutorial-releases/:id/status
- Permite sistemas externos alterarem status
- Aceita: pending, success, failed

🐳 DOCKER:
- Multi-stage build para produção
- Traefik reverse proxy
- SSL/TLS automático

Breaking Changes: Autenticação por códigos removida"
```

### 4. Fazer Push para GitHub
```bash
# Push da branch main
git push origin main

# Criar e fazer push da tag V2
git tag -a v2.0.0 -m "🚀 Versão 2.0.0 - Login Simplificado e API Status

Sistema completo com:
- Login direto email/senha
- API de status para integração externa
- Docker para deploy VPS
- Configuração Resend SMTP
- Deploy educanextest.com.br

Endpoint: POST /api/tutorial-releases/:id/status"

git push origin v2.0.0
```

### 5. Criar Release no GitHub (Via Interface Web)
1. Vá para: `https://github.com/murillobc/tutoriais-nxt/releases/new`
2. Escolha tag: `v2.0.0`
3. Título: `🚀 V2.0.0 - Sistema de Login Simplificado e API de Status`
4. Descrição: (copie o conteúdo do CHANGELOG_V2.md)
5. Marque como "Latest release"
6. Clique "Publish release"

## 🔄 Deploy na VPS com V2

### 1. Fazer Pull na VPS
```bash
# Na sua VPS, entre na pasta do projeto
cd /caminho/do/projeto

# Fazer backup da versão atual (opcional)
cp docker-compose.prod.yml docker-compose.prod.v1.backup.yml

# Fazer pull da V2
git pull origin main

# Verificar se pegou a V2
git log --oneline -5
```

### 2. Atualizar Docker Compose
```bash
# Parar containers atuais
docker-compose -f docker-compose.prod.yml down

# Rebuildar com V2
docker-compose -f docker-compose.prod.yml up -d --build

# Verificar logs
docker-compose -f docker-compose.prod.yml logs -f nextest-app
```

### 3. Testar V2 na VPS
```bash
# Testar API de tutoriais
curl https://tutoriais.educanextest.com.br/api/tutorials

# Testar API de status (substitua ID_REAL)
curl -X POST "https://tutoriais.educanextest.com.br/api/tutorial-releases/ID_REAL/status" \
  -H "Content-Type: application/json" \
  -d '{"status": "success", "message": "Teste V2"}'

# Verificar logs
docker logs $(docker ps -q --filter name=nextest)
```

## ⚠️ Troubleshooting

### Se houver conflitos no Git:
```bash
# Ver arquivos em conflito
git status

# Resolver manualmente cada arquivo em conflito
# Depois:
git add arquivo-resolvido.ts
git commit -m "Resolve conflict in arquivo-resolvido.ts"
```

### Se o Docker não buildar:
```bash
# Limpar containers e imagens antigas
docker system prune -a

# Rebuildar do zero
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d
```

### Se emails não funcionarem:
```bash
# Verificar variáveis SMTP na VPS
echo $SMTP_ADDRESS
echo $SMTP_FROM
echo $SMTP_DOMAIN

# Verificar se API Key do Resend está correta
curl -X POST "https://api.resend.com/domains" \
  -H "Authorization: Bearer $SMTP_PASSWORD"
```

## 📊 Verificação Pós-Deploy

- [ ] Site carrega: https://tutoriais.educanextest.com.br
- [ ] Login funciona sem códigos
- [ ] "Esqueci senha" envia email
- [ ] Dashboard exibe dados
- [ ] API de status responde
- [ ] Logs sem erros
- [ ] SSL/TLS funcionando

---

**Execute estes comandos em ordem para atualizar para a Versão 2.0.0**
Data: 11 de Agosto de 2025