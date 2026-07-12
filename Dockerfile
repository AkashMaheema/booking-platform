# ─── Stage 1: Base ────────────────────────────────────────────────────────────
FROM node:22-alpine AS base
WORKDIR /app

RUN apk add --no-cache libc6-compat openssl

COPY package*.json ./
COPY prisma ./prisma/

# ─── Stage 2: Dependencies ───────────────────────────────────────────────────
FROM base AS deps
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

# ─── Stage 3: Development ────────────────────────────────────────────────────
FROM base AS development
RUN npm ci --ignore-scripts
RUN npx prisma generate
COPY . .
EXPOSE 3000
CMD ["npm", "run", "start:dev"]

# ─── Stage 4: Builder ─────────────────────────────────────────────────────────
FROM base AS builder
RUN npm ci --ignore-scripts
COPY . .
RUN npx prisma generate
RUN npm run build

# ─── Stage 5: Production ──────────────────────────────────────────────────────
FROM node:22-alpine AS production
WORKDIR /app

RUN apk add --no-cache libc6-compat openssl
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs

COPY --chown=nestjs:nodejs --from=deps /app/node_modules ./node_modules
COPY --chown=nestjs:nodejs --from=builder /app/dist ./dist
COPY --chown=nestjs:nodejs --from=builder /app/prisma ./prisma
COPY --chown=nestjs:nodejs --from=builder /app/package*.json ./
COPY --chown=nestjs:nodejs --from=builder /app/prisma.config.ts ./

# Copy startup script and make it executable
COPY --chown=nestjs:nodejs scripts/startup.sh ./scripts/startup.sh
RUN chmod +x ./scripts/startup.sh

USER nestjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

CMD ["./scripts/startup.sh"]
