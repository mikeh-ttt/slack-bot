FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production

COPY --from=builder /app/dist ./dist

COPY --from=builder /app/drizzle ./drizzle

COPY --from=builder /app/drizzle.config.ts ./drizzle.config.ts

RUN npm run db:migrate || true

RUN npm run db:seed || true

CMD ["node", "--enable-source-maps", "dist/index.js"]
