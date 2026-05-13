FROM node:20-alpine
RUN apk add --no-cache openssl
WORKDIR /app
RUN npm install -g pnpm@10.33.0

# Workspace manifests (depuis la racine du monorepo)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/

RUN pnpm install --no-frozen-lockfile --filter api...

COPY apps/api/ ./apps/api/

RUN pnpm --filter api prisma:generate
RUN pnpm --filter api build

EXPOSE 3001
CMD ["node", "apps/api/dist/main"]
