# ---- build ----
FROM node:20-bookworm-slim AS build
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10.33.0 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/tsconfig.json ./packages/shared/
COPY apps/api/package.json apps/api/tsconfig.json ./apps/api/

RUN pnpm install --filter @astro/api... --frozen-lockfile

COPY packages/shared ./packages/shared
COPY apps/api ./apps/api

RUN pnpm --filter @astro/shared build \
  && pnpm --filter @astro/api exec prisma generate \
  && pnpm --filter @astro/api build

# ---- runtime ----
FROM node:20-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
RUN corepack enable && corepack prepare pnpm@10.33.0 --activate \
  && apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json ./apps/api/
COPY apps/api/prisma ./apps/api/prisma

# Install deps + generate Prisma engine for this image (debian-openssl-3.0.x)
RUN pnpm install --filter @astro/api... --frozen-lockfile \
  && pnpm --filter @astro/api exec prisma generate

COPY --from=build /app/packages/shared/dist ./packages/shared/dist
COPY --from=build /app/packages/shared/package.json ./packages/shared/package.json
COPY --from=build /app/apps/api/dist ./apps/api/dist

WORKDIR /app/apps/api
RUN mkdir -p uploads/reports uploads/notifications uploads/bank-slips

EXPOSE 3000
CMD ["sh", "-c", "pnpm exec prisma migrate deploy && node dist/main.js"]
