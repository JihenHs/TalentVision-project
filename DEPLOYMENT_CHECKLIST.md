# ✅ Checklist de Déploiement

## 🔍 Vérifications à faire

### 1. Secrets GitHub Actions

Vérifiez que tous ces secrets sont configurés dans GitHub :
- **Settings** > **Secrets and variables** > **Actions**

#### Secrets requis :

**Docker Hub :**
- `DOCKERHUB_USERNAME` : Votre nom d'utilisateur Docker Hub
- `DOCKERHUB_TOKEN` : Token d'accès Docker Hub (pas votre mot de passe)

**Railway (optionnel si vous utilisez l'intégration GitHub) :**
- `RAILWAY_TOKEN` : Token Railway (obtenu via `railway login` puis `railway whoami`)
- `RAILWAY_BACKEND_ID` : ID du service backend Railway
- `RAILWAY_FRONTEND_ID` : ID du service frontend Railway

### 2. Vérifier que les images Docker sont poussées

Après un push, vérifiez dans les logs GitHub Actions :
- ✅ "Build and push backend image" - doit réussir
- ✅ "Build and push frontend image" - doit réussir
- ✅ "Verify backend image pushed" - doit afficher un message de succès
- ✅ "Verify frontend image pushed" - doit afficher un message de succès

Vérifiez aussi sur Docker Hub :
- Allez sur https://hub.docker.com
- Vérifiez que les images `votre-username/talentvision-backend:latest` et `votre-username/talentvision-frontend:latest` existent

### 3. Configuration Railway

#### Option A : Intégration GitHub Native (Recommandé)

1. Allez sur https://railway.app
2. Créez un projet
3. Cliquez sur "New Service" > "GitHub Repo"
4. Sélectionnez votre dépôt
5. Pour le backend : Root Directory = `Backend/TalentVision_Back`
6. Pour le frontend : Root Directory = `Frontend/TalentVision_front`
7. Railway déploiera automatiquement à chaque push

#### Option B : Utiliser Docker Hub

1. Dans Railway, créez deux services
2. Pour chaque service, allez dans "Settings" > "Source"
3. Sélectionnez "Docker Hub"
4. Entrez l'image : `votre-username/talentvision-backend:latest` (ou frontend)
5. Railway utilisera automatiquement les images Docker Hub

### 4. Vérifier les logs GitHub Actions

Si le déploiement ne fonctionne pas :

1. Allez dans votre dépôt GitHub
2. Cliquez sur "Actions"
3. Ouvrez le dernier workflow
4. Vérifiez les logs de chaque étape :
   - Les tests passent-ils ?
   - Les images Docker sont-elles construites ?
   - Les images sont-elles poussées sur Docker Hub ?
   - Railway CLI est-il installé ?
   - Les commandes Railway fonctionnent-elles ?

### 5. Problèmes courants

#### Les images ne sont pas poussées sur Docker Hub
- Vérifiez que `DOCKERHUB_USERNAME` et `DOCKERHUB_TOKEN` sont corrects
- Vérifiez que le token Docker Hub a les permissions nécessaires

#### Railway ne redéploie pas
- Vérifiez que `RAILWAY_TOKEN` est valide
- Vérifiez que `RAILWAY_BACKEND_ID` et `RAILWAY_FRONTEND_ID` sont corrects
- Si vous utilisez l'intégration GitHub native, vous n'avez pas besoin de ces secrets

#### Les tests échouent et bloquent le déploiement
- Le workflow est configuré pour continuer même si les tests échouent (`if: always()`)
- Mais vérifiez quand même pourquoi les tests échouent

### 6. Commandes utiles

#### Obtenir le token Railway
```bash
railway login
railway whoami
# Le token est dans ~/.railway/config.json
```

#### Obtenir les IDs des services Railway
1. Allez sur railway.app
2. Ouvrez votre projet
3. Cliquez sur un service
4. L'ID est dans l'URL ou dans les paramètres du service

#### Tester localement
```bash
# Backend
cd Backend/TalentVision_Back
docker build -t talentvision-backend .
docker run -p 8000:8000 talentvision-backend

# Frontend
cd Frontend/TalentVision_front
docker build -t talentvision-frontend .
docker run -p 3000:80 talentvision-frontend
```

### 7. Workflow actuel

Le workflow actuel :
1. ✅ Exécute les tests (backend et frontend)
2. ✅ Construit les images Docker
3. ✅ Pousse les images sur Docker Hub
4. ✅ Vérifie que les images sont poussées
5. ✅ Redéploie sur Railway (si configuré)

Si une étape échoue, vérifiez les logs pour identifier le problème.

