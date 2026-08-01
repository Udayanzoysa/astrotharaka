# ---- build ----
FROM node:20-bookworm-slim AS build
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10.33.0 --activate

ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_ALLOW_DEV_PAYMENTS=false
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_ALLOW_DEV_PAYMENTS=$NEXT_PUBLIC_ALLOW_DEV_PAYMENTS

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/web/package.json apps/web/tsconfig.json ./apps/web/

RUN pnpm install --filter @astro/web... --frozen-lockfile

COPY apps/web ./apps/web
RUN pnpm --filter @astro/web build

# ---- runtime ----
FROM node:20-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3001
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=build /app/apps/web/public ./apps/web/public
COPY --from=build --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static

USER nextjs
EXPOSE 3001
CMD ["node", "apps/web/server.js"]
