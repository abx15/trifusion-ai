# TriFusion AI — NestJS API Dockerfile
# Multi-stage build: build stage + runtime stage

# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@8.15.0 --activate

# Copy workspace files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.base.json ./
COPY packages ./packages
COPY database ./database

# Install dependencies (frozen lockfile)
RUN pnpm install --frozen-lockfile

# Copy API source
COPY apps/api ./apps/api

# Build API
RUN pnpm --filter @trifusion/api build

# Generate Prisma client
RUN cd database/prisma && pnpm prisma generate

# Runtime stage
FROM node:20-alpine AS runner

WORKDIR /app

# Install pnpm for runtime (needed for prisma)
RUN corepack enable && corepack prepare pnpm@8.15.0 --activate

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs

# Copy built output from builder
COPY --from=builder --chown=nestjs:nodejs /app/apps/api/dist ./apps/api/dist
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/database/prisma ./database/prisma
COPY --from=builder --chown=nestjs:nodejs /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./

# Set environment
ENV NODE_ENV=production
ENV PORT=3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

USER nestjs

EXPOSE 3001

CMD ["node", "apps/api/dist/main"]
