# backend/Dockerfile
FROM node:20-alpine

ENV NODE_ENV=production
WORKDIR /app

# 1) Manifests d’abord (meilleur cache)
COPY package.json package-lock.json* ./

# 2) Install avec cache BuildKit (id requis)
RUN --mount=type=cache,id=npm-cache,target=/root/.npm \
    npm ci --omit=dev --cache /root/.npm --prefer-offline

# 3) Code applicatif
COPY . .

EXPOSE 3000
CMD ["node", "server.js"]
