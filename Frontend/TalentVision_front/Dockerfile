# Étape 1 : Build de l'application React
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Étape 2 : Nginx pour servir l'application
FROM nginx:alpine


# Copier les fichiers buildés (React ou Vite)
COPY --from=builder /app/dist /usr/share/nginx/html
# Copier la configuration personnalisée
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copier les fichiers buildés (React ou Vite)
COPY --from=builder /app/dist /usr/share/nginx/html

# Copier le script d'entrypoint pour DNS dynamique
COPY docker-entrypoint.sh /docker-entrypoint.d/99-configure-dns.sh
RUN chmod +x /docker-entrypoint.d/99-configure-dns.sh

# Exposer le port standard Nginx
EXPOSE 80

# Lancer Nginx en mode foreground
CMD ["nginx", "-g", "daemon off;"]
