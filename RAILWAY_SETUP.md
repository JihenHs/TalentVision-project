# 🚂 Configuration Railway - Déploiement Automatique depuis GitHub

Ce guide explique comment configurer Railway pour déployer automatiquement votre application à chaque push sur GitHub.

## 📋 Vue d'ensemble

Railway offre deux méthodes de déploiement :
1. **Intégration GitHub native** (recommandé) - Déploie automatiquement depuis votre code GitHub
2. **Docker Hub** - Utilise les images Docker que vous poussez

Ce guide se concentre sur l'intégration GitHub native pour un déploiement automatique.

## 🚀 Configuration Étape par Étape

### Étape 1 : Créer un compte Railway

1. Allez sur [railway.app](https://railway.app)
2. Cliquez sur "Start a New Project"
3. Connectez-vous avec votre compte GitHub

### Étape 2 : Créer un nouveau projet

1. Dans Railway, cliquez sur "New Project"
2. Sélectionnez "Deploy from GitHub repo"
3. Autorisez Railway à accéder à vos dépôts GitHub
4. Sélectionnez votre dépôt : `tekup-5/Django/projet` (ou le nom de votre dépôt)

### Étape 3 : Configurer le service Backend

1. Railway détectera automatiquement votre projet
2. Cliquez sur "Add Service" ou "New Service"
3. Sélectionnez "GitHub Repo"
4. Choisissez votre dépôt GitHub
5. **Configuration importante** :
   - **Root Directory** : `Backend/TalentVision_Back`
   - Railway détectera automatiquement le `Dockerfile`
6. Cliquez sur "Deploy"

### Étape 4 : Configurer le service Frontend

1. Dans le même projet Railway, cliquez à nouveau sur "Add Service"
2. Sélectionnez "GitHub Repo"
3. Choisissez le même dépôt GitHub
4. **Configuration importante** :
   - **Root Directory** : `Frontend/TalentVision_front`
   - Railway détectera automatiquement le `Dockerfile`
5. Cliquez sur "Deploy"

### Étape 5 : Configurer la base de données PostgreSQL

1. Dans votre projet Railway, cliquez sur "New" > "Database" > "PostgreSQL"
2. Railway créera automatiquement une base de données PostgreSQL
3. Copiez l'URL de connexion (elle ressemble à : `postgresql://postgres:password@hostname:5432/railway`)

### Étape 6 : Configurer les variables d'environnement

#### Pour le service Backend :

1. Cliquez sur votre service Backend
2. Allez dans l'onglet "Variables"
3. Ajoutez les variables suivantes :

```
DATABASE_URL=<url_postgresql_copiée_à_l_étape_5>
SECRET_KEY=<générez_une_clé_secrète_aléatoire>
DEBUG=False
CORS_ALLOWED_ORIGINS=https://votre-frontend.railway.app
ALLOWED_HOSTS=*
```

**Note** : Remplacez `https://votre-frontend.railway.app` par l'URL réelle de votre service frontend Railway (vous la trouverez après le déploiement).

#### Pour le service Frontend :

1. Cliquez sur votre service Frontend
2. Allez dans l'onglet "Variables"
3. Ajoutez les variables suivantes :

```
VITE_API_URL=https://votre-backend.railway.app
```

**Note** : Remplacez `https://votre-backend.railway.app` par l'URL réelle de votre service backend Railway.

### Étape 7 : Déploiement automatique

Une fois configuré, Railway déploiera automatiquement :
- ✅ À chaque push sur la branche `main` (ou la branche configurée)
- ✅ À chaque merge de pull request
- ✅ Vous pouvez aussi déclencher un déploiement manuel depuis le dashboard

## 🔧 Configuration des branches

Par défaut, Railway déploie depuis la branche `main`. Pour changer :

1. Cliquez sur votre service
2. Allez dans "Settings" > "Source"
3. Changez la branche si nécessaire

## 📝 Vérification du déploiement

### Vérifier les logs

1. Dans Railway, cliquez sur votre service
2. Allez dans l'onglet "Deployments"
3. Cliquez sur le dernier déploiement pour voir les logs

### Vérifier que l'application fonctionne

1. Railway génère automatiquement des domaines pour vos services
2. Vous trouverez l'URL dans l'onglet "Settings" > "Networking"
3. Testez l'URL dans votre navigateur

## 🔄 Workflow complet

Voici ce qui se passe à chaque push sur GitHub :

1. **GitHub Actions** :
   - ✅ Exécute les tests
   - ✅ Construit les images Docker
   - ✅ Pousse les images sur Docker Hub

2. **Railway** (automatique) :
   - ✅ Détecte le push sur GitHub
   - ✅ Construit et déploie le backend depuis `Backend/TalentVision_Back`
   - ✅ Construit et déploie le frontend depuis `Frontend/TalentVision_front`
   - ✅ Tout est automatique !

## 🎯 Avantages de cette configuration

- ✅ **Déploiement automatique** : Pas besoin d'intervention manuelle
- ✅ **Double sécurité** : Images Docker sur Docker Hub + déploiement Railway depuis GitHub
- ✅ **Logs en temps réel** : Suivez le déploiement en direct
- ✅ **Rollback facile** : Revenez à une version précédente en un clic
- ✅ **Gratuit** : Railway offre un plan gratuit généreux

## 🐛 Dépannage

### Le déploiement échoue

1. Vérifiez les logs dans Railway
2. Vérifiez que les Dockerfiles sont corrects
3. Vérifiez que toutes les variables d'environnement sont configurées

### Les services ne communiquent pas

1. Vérifiez que `CORS_ALLOWED_ORIGINS` dans le backend contient l'URL du frontend
2. Vérifiez que `VITE_API_URL` dans le frontend pointe vers l'URL du backend
3. Les URLs Railway sont au format : `https://votre-service.up.railway.app`

### La base de données n'est pas accessible

1. Vérifiez que `DATABASE_URL` est correctement configurée
2. Vérifiez que le service PostgreSQL est démarré dans Railway
3. Les migrations Django doivent être exécutées (Railway le fait automatiquement si configuré)

## 📚 Ressources

- [Documentation Railway](https://docs.railway.app)
- [Railway GitHub Integration](https://docs.railway.app/deploy/builds)
- [Railway Environment Variables](https://docs.railway.app/develop/variables)

## ✅ Checklist de configuration

- [ ] Compte Railway créé et connecté à GitHub
- [ ] Projet Railway créé et lié au dépôt GitHub
- [ ] Service Backend créé avec Root Directory = `Backend/TalentVision_Back`
- [ ] Service Frontend créé avec Root Directory = `Frontend/TalentVision_front`
- [ ] Base de données PostgreSQL créée
- [ ] Variables d'environnement Backend configurées
- [ ] Variables d'environnement Frontend configurées
- [ ] Premier déploiement réussi
- [ ] Test d'un push sur GitHub pour vérifier le déploiement automatique

Une fois tout configuré, chaque push sur GitHub déclenchera automatiquement un nouveau déploiement sur Railway ! 🎉

