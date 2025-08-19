# backend/Dockerfile
FROM node:20-alpine

# Réduire la taille & forcer prod
ENV NODE_ENV=production

WORKDIR /app

# 1) Installer les deps à partir des manifests uniquement
COPY package.json package-lock.json* ./
# Utilise un cache npm *hors* node_modules pour éviter EBUSY
RUN --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev --cache /root/.npm --prefer-offline

# 2) Copier le reste du code
COPY . .

# 3) Exposer le port fourni par Railway (process.env.PORT)
EXPOSE 3000

# 4) Démarrer
CMD ["node", "server.js"]
