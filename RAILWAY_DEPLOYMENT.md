# 🚂 Guide de Déploiement Railway

Ce guide explique comment déployer TalentVision sur Railway en utilisant l'intégration GitHub native.

## 📋 Prérequis

- Un compte [Railway](https://railway.app)
- Un dépôt GitHub avec votre code
- Les Dockerfiles configurés (déjà présents dans le projet)

## 🚀 Option 1 : Intégration GitHub Native (Recommandé)

Cette méthode permet à Railway de déployer automatiquement à chaque push sur votre dépôt GitHub.

### Étapes de Configuration

1. **Connectez-vous à Railway**
   - Allez sur [railway.app](https://railway.app)
   - Connectez-vous avec votre compte GitHub

2. **Créez un nouveau projet**
   - Cliquez sur "New Project"
   - Sélectionnez "Deploy from GitHub repo"
   - Autorisez Railway à accéder à votre dépôt GitHub
   - Sélectionnez votre dépôt `tekup-5/Django/projet` (ou le nom de votre dépôt)

3. **Configurez le service Backend**
   - Railway détectera automatiquement votre projet
   - Cliquez sur "Add Service" > "GitHub Repo"
   - Sélectionnez votre dépôt
   - Dans "Root Directory", entrez : `Backend/TalentVision_Back`
   - Railway détectera automatiquement le Dockerfile

4. **Configurez le service Frontend**
   - Cliquez à nouveau sur "Add Service" > "GitHub Repo"
   - Sélectionnez le même dépôt
   - Dans "Root Directory", entrez : `Frontend/TalentVision_front`
   - Railway détectera automatiquement le Dockerfile

5. **Configurez les variables d'environnement**
   
   **Pour le Backend :**
   ```
   DATABASE_URL=<votre_url_postgresql>
   SECRET_KEY=<votre_secret_key>
   DEBUG=False
   CORS_ALLOWED_ORIGINS=https://votre-frontend.railway.app
   ```
   
   **Pour le Frontend :**
   ```
   VITE_API_URL=https://votre-backend.railway.app
   ```

6. **Ajoutez une base de données PostgreSQL**
   - Dans votre projet Railway, cliquez sur "New" > "Database" > "PostgreSQL"
   - Railway créera automatiquement une base de données
   - Copiez l'URL de connexion et ajoutez-la comme variable `DATABASE_URL` dans votre service Backend

7. **Déploiement automatique**
   - Railway déploiera automatiquement à chaque push sur la branche `main` (ou la branche configurée)
   - Vous pouvez voir les logs de déploiement dans le dashboard Railway

## 🐳 Option 2 : Utiliser les Images Docker Hub

Si vous préférez utiliser les images Docker Hub (construites par GitHub Actions) :

1. **Dans Railway, créez deux services**
   - Service Backend
   - Service Frontend

2. **Configurez chaque service pour utiliser Docker Hub**
   - Dans les paramètres du service, allez dans "Settings" > "Source"
   - Sélectionnez "Docker Hub"
   - Entrez l'image : `votre-username/talentvision-backend:latest`
   - Faites de même pour le frontend : `votre-username/talentvision-frontend:latest`

3. **Les services se mettront à jour automatiquement**
   - Quand GitHub Actions pousse une nouvelle image sur Docker Hub
   - Railway détectera la nouvelle image et redéploiera automatiquement

## 📝 Notes Importantes

- **Branches** : Par défaut, Railway déploie depuis la branche `main`. Vous pouvez changer cela dans les paramètres du service.
- **Variables d'environnement** : Assurez-vous de configurer toutes les variables nécessaires dans Railway
- **Domains** : Railway génère automatiquement des domaines pour vos services. Vous pouvez aussi ajouter des domaines personnalisés.
- **Logs** : Consultez les logs dans le dashboard Railway pour déboguer les problèmes de déploiement

## 🔧 Dépannage

### Le déploiement échoue
- Vérifiez les logs dans Railway
- Assurez-vous que les Dockerfiles sont corrects
- Vérifiez que toutes les variables d'environnement sont configurées

### Les services ne communiquent pas
- Vérifiez les variables `CORS_ALLOWED_ORIGINS` dans le backend
- Vérifiez que `VITE_API_URL` pointe vers l'URL correcte du backend

### La base de données n'est pas accessible
- Vérifiez que `DATABASE_URL` est correctement configurée
- Assurez-vous que le service PostgreSQL est démarré dans Railway

## 📚 Ressources

- [Documentation Railway](https://docs.railway.app)
- [Railway GitHub Integration](https://docs.railway.app/deploy/builds)

