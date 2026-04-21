ARG NODE_VERSION=24
FROM node:${NODE_VERSION}-slim AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS prepare
WORKDIR /app
RUN pnpm add -g turbo
COPY . .
RUN turbo prune @smartdine/web --docker

FROM base AS builder
WORKDIR /app

ARG NODE_ENV
ENV NODE_ENV=${NODE_ENV}

ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

ARG VITE_API_BASE_PATH
ENV VITE_API_BASE_PATH=${VITE_API_BASE_PATH}

ARG VITE_API_AUTH_PATH
ENV VITE_API_AUTH_PATH=${VITE_API_AUTH_PATH}

COPY --from=prepare /app/out/json/ .
COPY --from=prepare /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=prepare /app/out/pnpm-workspace.yaml ./pnpm-workspace.yaml

RUN pnpm install --frozen-lockfile

COPY --from=prepare /app/out/full/ .
COPY turbo.json turbo.json
RUN pnpm turbo build --filter=@smartdine/web --env-mode loose

FROM node:${NODE_VERSION}-alpine AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 tanstaskstart
RUN adduser --system --uid 1001 tanstaskstart
USER tanstaskstart
COPY --from=builder /app .

CMD ["node", "apps/web/.output/server/index.mjs"]