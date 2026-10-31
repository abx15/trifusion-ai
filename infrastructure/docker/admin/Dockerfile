# TriFusion AI — Platform Admin Dockerfile

FROM node:20-alpine AS builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@8.15.0 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.base.json ./
COPY packages ./packages

RUN pnpm install --frozen-lockfile

COPY apps/platform-admin ./apps/platform-admin

ENV NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1

RUN pnpm --filter @trifusion/platform-admin build

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/apps/platform-admin/.next ./apps/platform-admin/.next
COPY --from=builder --chown=nextjs:nodejs /app/apps/platform-admin/public ./apps/platform-admin/public
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/package.json /app/pnpm-lock.yaml ./

USER nextjs

EXPOSE 3002

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3002/api/health || exit 1

CMD ["node", "apps/platform-admin/server.js"]
