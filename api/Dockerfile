# syntax=docker/dockerfile:1

FROM node:24-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM deps AS build
COPY . .
RUN npm run build

FROM node:24-slim AS prod-deps
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

FROM node:24-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
# Necessários para o `drizzle-kit migrate` no startup
COPY package.json drizzle.config.ts ./
COPY src/shared/database/migrations ./src/shared/database/migrations
COPY src/shared/database/drizzle ./src/shared/database/drizzle

USER node
EXPOSE 3333
CMD ["sh", "-c", "npx drizzle-kit migrate && node dist/main"]
