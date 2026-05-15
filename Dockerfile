# ── Build del frontend ──────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ── Imagen de producción ─────────────────────────────────────────────
FROM node:20-alpine

WORKDIR /app

# Solo dependencias de producción + tsx para correr el servidor
COPY package*.json ./
RUN npm ci --omit=dev && npm install tsx

# Frontend compilado
COPY --from=builder /app/dist ./dist

# Código del servidor
COPY server ./server
COPY tsconfig*.json ./

ENV NODE_ENV=production

EXPOSE 3001

CMD ["npx", "tsx", "server/index.ts"]
