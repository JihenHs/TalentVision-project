# Étape 1 : Build de l'application React
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Étape 2 : Nginx pour servir l'application
FROM nginx:alpine

# Copier les fichiers buildés
COPY --from=builder /app/dist /usr/share/nginx/html

# Copier la configuration personnalisée
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY docker-entrypoint.sh /docker-entrypoint.d/99-configure-dns.sh

# Rendre le script exécutable
RUN chmod +x /docker-entrypoint.d/99-configure-dns.sh

# Exposer le port 3000 (au lieu du 80 par défaut)
EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]
