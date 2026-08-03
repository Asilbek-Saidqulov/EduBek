# EduBek — Production Dockerfile
# Multi-stage build: install deps → build → runtime

# ---- Stage 1: Dependencies ----
FROM node:20-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci --include=dev && npx prisma generate

# ---- Stage 2: Build ----
FROM node:20-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ---- Stage 3: Runtime ----
FROM node:20-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Install only production deps
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci --only=production && npx prisma generate

# Copy build output + server
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/src/server ./src/server
COPY --from=builder /app/next.config.ts ./
COPY --from=builder /app/tsconfig.json ./

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:3000/api/health/live || exit 1

EXPOSE 3000

# Use the custom server (with Socket.IO attached)
CMD ["node", "--import", "tsx", "src/server/index.ts"]
