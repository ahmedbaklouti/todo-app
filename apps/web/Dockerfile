FROM node:22-alpine AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="/app/node_modules/.bin:$PNPM_HOME:$PATH"

RUN corepack enable
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json apps/web/package.json
COPY packages/config/package.json packages/config/package.json
COPY packages/shared-types/package.json packages/shared-types/package.json

RUN pnpm install --frozen-lockfile --config.node-linker=hoisted

COPY apps/web apps/web
COPY packages packages

WORKDIR /app/apps/web
RUN nuxt build

FROM node:22-alpine AS runtime

ENV PNPM_HOME="/pnpm"
ENV PATH="/app/node_modules/.bin:$PNPM_HOME:$PATH"
ENV NODE_ENV=development

RUN corepack enable
WORKDIR /app/apps/web

COPY --from=base /app /app

EXPOSE 3000

CMD ["nuxt", "dev", "--host", "0.0.0.0", "--port", "3000"]
