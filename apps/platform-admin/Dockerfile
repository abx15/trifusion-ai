FROM node:24-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json pnpm-lock.yaml* ./
RUN corepack enable && pnpm install --frozen-lockfile

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED 1

RUN corepack enable && pnpm --filter @trifusion/platform-admin build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/apps/platform-admin/.next ./apps/platform-admin/.next
COPY --from=builder /app/apps/platform-admin/node_modules ./apps/platform-admin/node_modules
COPY --from=builder /app/apps/platform-admin/package.json ./apps/platform-admin/package.json
COPY --from=builder /app/apps/platform-admin/public ./apps/platform-admin/public
COPY --from=builder /app/node_modules/.pnpm ./node_modules/.pnpm
COPY --from=builder /app/node_modules/@trifusion ./node_modules/@trifusion

USER nextjs

EXPOSE 3002

ENV PORT 3002
ENV HOSTNAME "0.0.0.0"

CMD ["node_modules/.bin/next", "start", "-p", "3002", "-H", "0.0.0.0", "dir=apps/platform-admin"]
