# Étape 1 : Builder l'application React
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

# Étape 2 : Nginx pour servir l'application
FROM nginx:alpine

# Copier les fichiers buildés vers Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Copier la configuration Nginx personnalisée
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copier le script d'entrée pour configurer le DNS
COPY docker-entrypoint.sh /docker-entrypoint.d/99-configure-dns.sh

# Rendre le script exécutable
RUN chmod +x /docker-entrypoint.d/99-configure-dns.sh

# Exposer le port 3000 au lieu de 80
EXPOSE 3000

# Lancer Nginx
CMD ["nginx", "-g", "daemon off;"]
