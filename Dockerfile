# Dockerfile
FROM node:18-alpine AS base

# Instalar dependências do sistema
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copiar package files
COPY package*.json ./
RUN npm ci --only=production

# Copiar código fonte
COPY . .

# Build do TypeScript
RUN npm run build

# Estágio de produção
FROM node:18-alpine AS production

WORKDIR /app

# Copiar aplicação buildada e dependências
COPY --from=base /app/dist ./dist
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/package.json ./package.json

# Copiar arquivos necessários para runtime
COPY --from=base /app/shared ./shared
COPY --from=base /app/drizzle.config.ts ./drizzle.config.ts

# Criar diretório de logs
RUN mkdir -p logs

# Usuário não-root para segurança
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001
RUN chown -R nextjs:nodejs /app
USER nextjs

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

CMD ["node", "dist/server/index.js"]

