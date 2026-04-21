ARG NODE_VERSION=24
FROM node:${NODE_VERSION}-slim AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS prepare
WORKDIR /app
RUN pnpm add -g turbo
COPY . .
RUN turbo prune @smartdine/api --docker

FROM base AS builder
WORKDIR /app

COPY --from=prepare /app/out/json/ .
COPY --from=prepare /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=prepare /app/out/pnpm-workspace.yaml ./pnpm-workspace.yaml

RUN pnpm install --frozen-lockfile

COPY --from=prepare /app/out/full/ .
COPY turbo.json turbo.json
RUN pnpm turbo build --filter=@smartdine/api

FROM node:${NODE_VERSION}-alpine AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nestjs
RUN adduser --system --uid 1001 nestjs
USER nestjs
COPY --from=builder /app .

CMD ["node", "apps/api/dist/main"]