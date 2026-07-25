FROM node:22-alpine AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="/app/node_modules/.bin:$PNPM_HOME:$PATH"

RUN corepack enable
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/package.json
COPY packages/config/package.json packages/config/package.json
COPY packages/shared-types/package.json packages/shared-types/package.json

RUN pnpm install --frozen-lockfile --config.node-linker=hoisted

COPY apps/api apps/api
COPY packages packages

WORKDIR /app/apps/api
RUN pnpm exec prisma generate --schema prisma/schema.prisma && nest build

FROM node:22-alpine AS runtime

ENV PNPM_HOME="/pnpm"
ENV PATH="/app/node_modules/.bin:$PNPM_HOME:$PATH"
ENV NODE_ENV=production

RUN corepack enable
WORKDIR /app/apps/api

COPY --from=base /app /app

EXPOSE 3001

CMD ["sh", "-c", "pnpm exec prisma db push --schema prisma/schema.prisma && node dist/main"]
