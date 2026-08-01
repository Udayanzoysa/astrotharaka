# ---- build ----
FROM node:20-bookworm-slim AS build
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10.33.0 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/tsconfig.json ./packages/shared/
COPY apps/worker/package.json apps/worker/tsconfig.json ./apps/worker/
COPY apps/api/package.json ./apps/api/
COPY apps/api/prisma ./apps/api/prisma

RUN pnpm install --filter @astro/worker... --filter @astro/api... --frozen-lockfile

COPY packages/shared ./packages/shared
COPY apps/worker ./apps/worker

RUN pnpm --filter @astro/shared build \
  && pnpm --filter @astro/api exec prisma generate \
  && pnpm --filter @astro/worker build

# ---- runtime ----
FROM node:20-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PDF_ENGINE=pdfkit

RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl ca-certificates fonts-noto-core fonts-noto-ui-core \
  && rm -rf /var/lib/apt/lists/* \
  && corepack enable && corepack prepare pnpm@10.33.0 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/worker/package.json ./apps/worker/
COPY apps/api/package.json ./apps/api/
COPY apps/api/prisma ./apps/api/prisma

RUN pnpm install --filter @astro/worker... --filter @astro/api... --frozen-lockfile \
  && pnpm --filter @astro/api exec prisma generate

COPY --from=build /app/packages/shared/dist ./packages/shared/dist
COPY --from=build /app/apps/worker/dist ./apps/worker/dist

WORKDIR /app/apps/worker
RUN mkdir -p uploads/reports uploads/notifications

CMD ["node", "dist/main.js"]
