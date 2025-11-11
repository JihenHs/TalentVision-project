# Étape 1 : builder l'application React
FROM node:20-alpine AS builder

WORKDIR /app

# Copier package.json et package-lock.json
COPY package*.json ./

# Installer les dépendances
RUN npm install

# Copier le reste des fichiers
COPY . .

# Build de l'application
RUN npm run build

# Étape 2 : serveur Nginx pour servir l'application
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY docker-entrypoint.sh /docker-entrypoint.d/99-configure-dns.sh

# Rendre le script exécutable
RUN chmod +x /docker-entrypoint.d/99-configure-dns.sh

# Exposer le port 80
EXPOSE 80
