FROM node:20-alpine AS builder
RUN apk add --no-cache openssl

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY prisma ./prisma/
RUN npx prisma generate

COPY . .

# Production stage
FROM node:20-alpine
RUN apk add --no-cache openssl dumb-init && npm install -g prisma@5.22.0

WORKDIR /app
COPY --from=builder /app .

ENV NODE_ENV=production

EXPOSE 4000

# Use dumb-init to properly handle signals in container
CMD ["dumb-init", "node", "src/index.js"]
