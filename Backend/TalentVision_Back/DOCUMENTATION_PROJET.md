# 📋 Documentation du Projet TalentVision

## 🎯 Vue d'ensemble

**TalentVision** est une plateforme de recrutement prédictif et de gestion de talents qui utilise l'intelligence artificielle pour analyser les CV, calculer des scores de compatibilité candidat/poste, et générer des alertes automatiques pour les équipes RH.

---

## 📚 Table des matières

1. [Architecture générale](#architecture-générale)
2. [Fonctionnalités implémentées](#fonctionnalités-implémentées)
3. [Technologies utilisées](#technologies-utilisées)
4. [Structure du projet](#structure-du-projet)
5. [Décisions techniques importantes](#décisions-techniques-importantes)
6. [Problèmes résolus](#problèmes-résolus)
7. [Fonctionnalités détaillées](#fonctionnalités-détaillées)
8. [Guide d'utilisation](#guide-dutilisation)

---

## 🏗️ Architecture générale

### Backend (Django REST Framework)

- **Framework** : Django 5.2.8 avec Django REST Framework 3.15.2
- **Base de données** : PostgreSQL (avec fallback SQLite pour le développement)
- **Authentification** : JWT (JSON Web Tokens) via `djangorestframework-simplejwt`
- **Traitement asynchrone** : Celery + Redis (pour l'analyse de CV et le calcul de scores)
- **IA/NLP** : spaCy 3.7.5 + scikit-learn 1.5.2 pour l'extraction de compétences et le matching
- **Traitement de fichiers** : pdfplumber (PDF) + python-docx (DOCX)

### Frontend (React + TypeScript)

- **Framework** : React avec TypeScript
- **Build tool** : Vite
- **State management** : React Query (TanStack Query)
- **Routing** : React Router v6
- **Styling** : Tailwind CSS
- **HTTP Client** : Axios

### Communication Frontend/Backend

- **CORS** : Configuré pour permettre les requêtes cross-origin
- **Proxy Vite** : Utilisé en développement pour bypasser CORS et servir les fichiers média
- **API RESTful** : Endpoints standardisés suivant les conventions REST

---

## ✨ Fonctionnalités implémentées

### 1. Gestion des utilisateurs et authentification

- ✅ Système d'authentification JWT
- ✅ Rôles utilisateurs : CANDIDATE, HR, MANAGER, ADMIN
- ✅ Inscription et connexion
- ✅ Protection des routes par rôle

**Pourquoi** : Nécessaire pour sécuriser l'application et gérer les permissions selon les rôles.

**Comment** : Utilisation de `djangorestframework-simplejwt` pour les tokens JWT, avec des permissions personnalisées basées sur les rôles.

### 2. Gestion des offres d'emploi

- ✅ Création, modification, suppression d'offres
- ✅ Statuts : DRAFT, PUBLISHED, CLOSED
- ✅ Association de compétences requises
- ✅ Filtrage et recherche
- ✅ Affichage dynamique des offres

**Pourquoi** : Cœur de la plateforme, permet aux RH de publier des postes et aux candidats de les consulter.

**Comment** : Modèle `JobPost` avec relations Many-to-Many vers `Skill`, ViewSet REST avec permissions.

### 3. Analyse automatique de CV (IA)

- ✅ Extraction de texte depuis PDF et DOCX
- ✅ Extraction de compétences techniques (117 compétences supportées)
- ✅ Extraction d'expérience (années, postes occupés)
- ✅ Extraction d'éducation/formation
- ✅ Extraction d'informations personnelles (email, téléphone)
- ✅ Support multilingue (Français, Anglais, Arabe)
- ✅ Analyse synchrone et asynchrone (Celery)

**Pourquoi** : Automatiser l'extraction d'informations structurées depuis des CV non structurés, gagner du temps pour les RH.

**Comment** : 
- Utilisation de `pdfplumber` et `python-docx` pour l'extraction de texte
- Regex patterns multilingues pour identifier les sections
- spaCy pour le NLP et l'extraction de compétences
- Stockage des résultats dans `CandidateProfile.cv_analysis_result` (JSONField)

**Fichier détaillé** : `DOCUMENTATION_ANALYSE_CV.md`

### 4. Calcul de score de compatibilité

- ✅ Score basé sur 3 critères :
  - **Compétences (50%)** : TF-IDF + cosine similarity + matching exact
  - **Expérience (30%)** : Comparaison années d'expérience
  - **Description (20%)** : Présence de mots-clés techniques dans le CV
- ✅ Score détaillé avec breakdown par critère
- ✅ Calcul synchrone lors de la candidature

**Pourquoi** : Aider les RH à identifier rapidement les meilleurs candidats pour un poste.

**Comment** : Classe `CompatibilityScorer` utilisant scikit-learn pour le TF-IDF et la similarité cosinus.

### 5. Système de candidatures

- ✅ Soumission de candidature avec CV et lettre de motivation
- ✅ Stockage du CV dans `CandidateProfile`
- ✅ Calcul automatique du score de compatibilité
- ✅ Statuts : PENDING, REVIEWED, SHORTLISTED, INTERVIEW, ACCEPTED, REJECTED
- ✅ Filtrage par offre d'emploi
- ✅ Tri par score de compatibilité ou date
- ✅ Affichage des informations extraites du CV

**Pourquoi** : Centraliser toutes les candidatures et permettre aux RH de les gérer efficacement.

**Comment** : Modèle `Application` lié à `User` (candidat) et `JobPost`, avec ViewSet REST.

### 6. Système d'alertes automatiques

- ✅ Création automatique d'alertes lors de nouvelles candidatures
- ✅ Types d'alertes :
  - `NEW_APPLICATION` : Nouvelle candidature (toujours créée)
  - `HIGH_SCORE` : Score ≥ 80% (priorité HIGH si ≥ 90%)
  - `CANDIDATE_MATCH` : Score ≥ 70%
  - `INTERNAL_MATCH` : Matching interne (futur)
  - `TURNOVER_RISK` : Risque de départ (futur)
- ✅ Alertes envoyées à tous les HR/Manager/Admin
- ✅ Interface de visualisation et gestion des alertes
- ✅ Marquer comme lu / Tout marquer comme lu
- ✅ Compteur d'alertes non lues

**Pourquoi** : Notifier automatiquement les RH des candidatures importantes, surtout celles avec un score élevé.

**Comment** : 
- Création automatique dans `JobPostViewSet.apply()` après chaque candidature
- Vérification des scores pour créer des alertes conditionnelles
- Modèle `Alert` avec relations vers `Application` et `JobPost`

### 7. Dashboard dynamique

- ✅ Statistiques en temps réel :
  - Total de candidatures
  - Candidatures par statut
  - Score de compatibilité moyen
  - Temps moyen de recrutement
  - Candidatures par source
  - Top compétences demandées
- ✅ Graphiques avec Recharts
- ✅ Données filtrées selon le rôle utilisateur

**Pourquoi** : Donner une vue d'ensemble aux RH pour prendre des décisions basées sur les données.

**Comment** : Endpoint `/api/dashboard/stats/` qui agrège les données depuis les modèles.

### 8. Matching de candidats

- ✅ Page "Meilleurs matches" pour chaque offre
- ✅ Tri automatique par score de compatibilité (décroissant)
- ✅ Affichage des compétences correspondantes
- ✅ Statistiques (total, avec score calculé)

**Pourquoi** : Permettre aux RH de rapidement identifier les meilleurs candidats pour un poste.

**Comment** : Endpoint `/api/job-posts/{id}/best_matches/` qui retourne les candidatures triées.

### 9. Gestion des compétences

- ✅ Base de données de compétences (techniques, soft skills, langues, certifications)
- ✅ Association automatique depuis l'analyse de CV
- ✅ Association manuelle aux offres d'emploi

**Pourquoi** : Standardiser les compétences pour faciliter le matching.

**Comment** : Modèle `Skill` avec catégories, relations Many-to-Many avec `JobPost` et `CandidateProfile`.

---

## 🛠️ Technologies utilisées

### Backend

| Technologie | Version | Usage |
|------------|---------|-------|
| Django | 5.2.8 | Framework web principal |
| Django REST Framework | 3.15.2 | API REST |
| djangorestframework-simplejwt | 5.3.1 | Authentification JWT |
| django-cors-headers | 4.6.0 | Gestion CORS |
| psycopg2-binary | 2.9.9 | Driver PostgreSQL |
| Celery | 5.4.0 | Tâches asynchrones |
| Redis | 5.2.0 | Broker Celery |
| spaCy | 3.7.5 | NLP pour extraction de compétences |
| scikit-learn | 1.5.2 | TF-IDF et similarité cosinus |
| pdfplumber | 0.11.4 | Extraction texte PDF |
| python-docx | 1.1.2 | Extraction texte DOCX |
| Pillow | 11.0.0 | Traitement d'images |
| python-dotenv | 1.0.1 | Gestion variables d'environnement |

### Frontend

| Technologie | Version | Usage |
|------------|---------|-------|
| React | Latest | Framework UI |
| TypeScript | Latest | Typage statique |
| Vite | Latest | Build tool |
| React Router | v6 | Routing |
| TanStack Query | Latest | State management |
| Axios | Latest | HTTP client |
| Tailwind CSS | Latest | Styling |

---

## 📁 Structure du projet

```
projet/
├── Backend/
│   └── TalentVision_Back/
│       ├── TalentVision_Back/        # Configuration Django
│       │   ├── settings.py           # Configuration principale
│       │   ├── urls.py               # URLs principales
│       │   ├── middleware.py         # Middleware CORS personnalisé
│       │   └── db_patch.py           # Patch PostgreSQL version
│       ├── accounts/                  # App authentification
│       │   ├── models.py             # Modèle User avec rôles
│       │   ├── serializers.py        # Serializers User
│       │   └── views.py              # Vues authentification
│       ├── recruitment/              # App principale recrutement
│       │   ├── models.py             # JobPost, Application, Alert, etc.
│       │   ├── serializers.py       # Serializers REST
│       │   ├── views.py              # ViewSets API
│       │   ├── urls.py               # Routes API
│       │   └── management/
│       │       └── commands/
│       │           └── create_test_alerts.py  # Commande test
│       ├── ai_engine/                # App IA
│       │   ├── cv_analyzer.py        # Analyse CV + CompatibilityScorer
│       │   └── tasks.py              # Tâches Celery
│       ├── requirements.txt          # Dépendances Python
│       ├── DOCUMENTATION_ANALYSE_CV.md  # Doc analyse CV
│       └── DOCUMENTATION_PROJET.md   # Ce fichier
│
└── Frontend/
    └── TalentVision_front/
        ├── src/
        │   ├── pages/                # Pages React
        │   │   ├── Dashboard.tsx
        │   │   ├── JobPosts.tsx
        │   │   ├── JobPostDetail.tsx
        │   │   ├── Applications.tsx
        │   │   ├── ApplicationDetail.tsx
        │   │   ├── Alerts.tsx
        │   │   └── ...
        │   ├── components/           # Composants réutilisables
        │   ├── lib/                  # Utilitaires
        │   │   ├── api.ts            # Instance Axios
        │   │   └── auth.ts           # Service authentification
        │   └── App.tsx               # Routes principales
        ├── vite.config.ts            # Configuration Vite + proxy
        └── package.json              # Dépendances npm
```

---

## 🔧 Décisions techniques importantes

### 1. Analyse synchrone du CV

**Décision** : L'analyse du CV est effectuée de manière synchrone lors de la soumission de candidature.

**Pourquoi** :
- Garantir que le score de compatibilité est calculé immédiatement
- Éviter les problèmes de timing où l'utilisateur verrait une candidature sans score
- Simplifier le code frontend (pas besoin de polling)

**Comment** : Dans `JobPostViewSet.apply()`, l'analyse est faite directement avec `CVAnalyzer().analyze_cv()`.

### 2. Proxy Vite pour les fichiers média

**Décision** : Utilisation d'un proxy Vite pour servir les fichiers média en développement.

**Pourquoi** :
- Éviter les problèmes CORS complexes
- Permettre de servir les fichiers depuis Django sans configuration CORS supplémentaire
- Solution simple et efficace pour le développement

**Comment** : Configuration dans `vite.config.ts` :
```typescript
server: {
  proxy: {
    '/api': 'http://localhost:8000',
    '/media': 'http://localhost:8000'
  }
}
```

### 3. Fallback SQLite si PostgreSQL échoue

**Décision** : Si la connexion PostgreSQL échoue, utiliser SQLite automatiquement.

**Pourquoi** :
- Permettre le développement même si PostgreSQL n'est pas configuré
- Éviter les erreurs de connexion qui bloquent le démarrage
- Faciliter le setup pour les nouveaux développeurs

**Comment** : Dans `settings.py`, try/except autour de la configuration PostgreSQL.

### 4. Patch PostgreSQL version 12

**Décision** : Création d'un patch pour supporter PostgreSQL 12 (Django 5.2 requiert 14+).

**Pourquoi** :
- L'utilisateur avait PostgreSQL 12.4 installé
- Éviter de forcer une mise à jour de PostgreSQL
- Solution temporaire pour le développement

**Comment** : Fichier `db_patch.py` qui modifie `DatabaseFeatures.minimum_database_version`.

### 5. SerializerMethodField pour les relations complexes

**Décision** : Utilisation de `SerializerMethodField` pour les relations complexes (ex: `candidate_profile` dans `ApplicationSerializer`).

**Pourquoi** :
- Contrôler exactement quelles données sont retournées
- Éviter les problèmes de récursion infinie
- Optimiser les requêtes avec `select_related` et `prefetch_related`

**Comment** : Méthode `get_candidate_profile()` qui construit manuellement le dictionnaire de données.

### 6. Alertes automatiques multiples par candidature

**Décision** : Créer plusieurs alertes pour une même candidature selon le score (nouvelle candidature + score élevé + candidat correspondant).

**Pourquoi** :
- Permettre aux RH de filtrer par type d'alerte
- Donner plus de contexte (une alerte pour la nouveauté, une pour le score)
- Faciliter le tri et la priorisation

**Comment** : Méthode `_create_application_alerts()` qui crée conditionnellement plusieurs alertes.

---

## 🐛 Problèmes résolus

### 1. Module psycopg2 manquant

**Problème** : `ModuleNotFoundError: No module named 'psycopg2'`

**Solution** : Ajout de `psycopg2-binary==2.9.9` dans `requirements.txt` et installation.

**Pourquoi** : Driver nécessaire pour se connecter à PostgreSQL.

### 2. Conflit de dépendances (keras, numpy)

**Problème** : Conflits entre TensorFlow, Keras et NumPy.

**Solution** :
- Suppression de `keras` (inclus dans TensorFlow 2.16.1)
- Ajustement de `numpy` à `<2.0.0,>=1.23.5` pour compatibilité TensorFlow

**Pourquoi** : TensorFlow 2.16.1 inclut Keras, et nécessite NumPy < 2.0.

### 3. Erreur UnicodeDecodeError PostgreSQL

**Problème** : `UnicodeDecodeError: 'utf-8' codec can't decode byte 0xe9`

**Solution** :
- Fonction `get_env_safe()` pour décoder les variables d'environnement
- `load_dotenv(encoding='utf-8')`
- `OPTIONS: {'client_encoding': 'UTF8'}` dans la config PostgreSQL

**Pourquoi** : Les variables d'environnement contenaient des caractères non-ASCII.

### 4. Version PostgreSQL incompatible

**Problème** : `PostgreSQL 14 or later is required (found 12.4)`

**Solution** : Patch dans `db_patch.py` qui modifie `minimum_database_version` de `(14,)` à `(12,)`.

**Pourquoi** : Solution temporaire pour permettre le développement avec PostgreSQL 12.

### 5. Erreurs CORS

**Problème** : `No 'Access-Control-Allow-Origin' header is present`

**Solution** :
- Configuration CORS dans `settings.py`
- Middleware personnalisé `DisableCSRFForAPI`
- **Solution finale** : Proxy Vite pour bypasser CORS en développement

**Pourquoi** : Le navigateur bloque les requêtes cross-origin par défaut pour la sécurité.

### 6. Module docx/spacy/sklearn manquants

**Problème** : Modules listés dans `requirements.txt` mais non installés.

**Solution** : Installation manuelle avec `pip install python-docx spacy scikit-learn`.

**Pourquoi** : Les dépendances doivent être installées explicitement dans l'environnement virtuel.

### 7. Page Applications vide

**Problème** : Les candidatures ne s'affichaient pas correctement.

**Solution** :
- Correction du serializer pour retourner toujours un objet `candidate_profile` (même vide)
- Ajout de `select_related` et `prefetch_related` pour optimiser les requêtes
- Gestion des cas où le profil n'existe pas

**Pourquoi** : Le frontend s'attendait à un objet structuré, pas à `None`.

---

## 📖 Fonctionnalités détaillées

### Analyse de CV

**Fichier** : `ai_engine/cv_analyzer.py`

**Fonctionnalités** :
1. **Extraction de texte** : PDF (pdfplumber) et DOCX (python-docx), y compris les tableaux
2. **Extraction de compétences** : 
   - Liste de 117 compétences techniques
   - Regex patterns multilingues
   - Nettoyage et déduplication
   - Limite de 50 compétences
3. **Extraction d'expérience** :
   - Années d'expérience (regex multilingue)
   - Postes occupés (détection automatique)
   - Limite de 10 postes
4. **Extraction d'éducation** :
   - Diplômes et formations
   - Nettoyage des dates et universités
5. **Extraction d'informations personnelles** :
   - Email (regex)
   - Téléphone (regex)

**Résultat** : JSON stocké dans `CandidateProfile.cv_analysis_result` avec toutes les informations extraites.

### Calcul de score de compatibilité

**Fichier** : `ai_engine/cv_analyzer.py` (classe `CompatibilityScorer`)

**Méthode** : `calculate_score()`

**Critères** :
1. **Compétences (50%)** :
   - TF-IDF vectorization des compétences candidat vs. poste
   - Cosine similarity
   - Fallback sur matching exact si TF-IDF échoue
2. **Expérience (30%)** :
   - Comparaison années d'expérience candidat vs. minimum requis
   - Points proportionnels si expérience suffisante
3. **Description (20%)** :
   - Extraction mots-clés techniques de la description du poste
   - Vérification présence dans compétences candidat ou texte CV

**Résultat** : Score total (0-100) + breakdown par critère.

### Système d'alertes

**Création automatique** :
- Lors de chaque nouvelle candidature
- Selon le score de compatibilité
- Pour tous les HR/Manager/Admin

**Types** :
- `NEW_APPLICATION` : Toujours créée
- `HIGH_SCORE` : Si score ≥ 80%
- `CANDIDATE_MATCH` : Si score ≥ 70%

**Interface** :
- Liste des alertes avec filtres
- Marquer comme lu / Tout marquer comme lu
- Liens vers candidature et offre
- Compteur d'alertes non lues

---

## 🚀 Guide d'utilisation

### Installation

#### Backend

```bash
cd Backend/TalentVision_Back
python -m venv env
source env/bin/activate  # Sur Windows: env\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

#### Frontend

```bash
cd Frontend/TalentVision_front
npm install
npm run dev
```

### Création d'alertes de test

```bash
cd Backend/TalentVision_Back
python manage.py create_test_alerts
```

Ou via l'interface : Cliquer sur "🧪 Créer des alertes de test" dans la page `/alerts`.

### Workflow typique

1. **HR crée une offre** : `/job-posts/new`
2. **Candidat postule** : `/job-posts/{id}` → "Postuler maintenant"
3. **CV analysé automatiquement** : Extraction compétences, expérience, etc.
4. **Score calculé** : Compatibilité candidat/poste
5. **Alertes créées** : Pour les HR/Managers
6. **RH consulte les alertes** : `/alerts`
7. **RH consulte les candidatures** : `/applications` (filtrées/triées)
8. **RH voit les meilleurs matches** : `/job-posts/{id}/best-matches`

---

## 📝 Notes importantes

### Variables d'environnement

Créer un fichier `.env` dans `Backend/TalentVision_Back/` :

```env
SECRET_KEY=your-secret-key
DEBUG=True
USE_POSTGRES=False  # True pour utiliser PostgreSQL
DB_NAME=talentvision
DB_USER=postgres
DB_PASSWORD=password
DB_HOST=localhost
DB_PORT=5432
```

### Modèles de données clés

- **User** : Utilisateurs avec rôles (CANDIDATE, HR, MANAGER, ADMIN)
- **JobPost** : Offres d'emploi avec compétences requises
- **CandidateProfile** : Profil candidat avec CV et résultats d'analyse
- **Application** : Candidatures avec score de compatibilité
- **Alert** : Alertes automatiques pour les RH
- **Skill** : Base de données de compétences

### Endpoints API principaux

- `POST /api/auth/register/` : Inscription
- `POST /api/auth/login/` : Connexion
- `GET /api/job-posts/` : Liste des offres
- `POST /api/job-posts/{id}/apply/` : Postuler à une offre
- `GET /api/applications/` : Liste des candidatures
- `GET /api/applications/{id}/` : Détails d'une candidature
- `GET /api/job-posts/{id}/best_matches/` : Meilleurs candidats
- `GET /api/alerts/` : Liste des alertes
- `GET /api/dashboard/stats/` : Statistiques dashboard

---

## 🔮 Améliorations futures possibles

1. **Matching interne** : Suggérer des employés internes pour promotion
2. **Analyse vidéo/audio** : Analyser les entretiens
3. **Prédiction de turnover** : ML pour prédire les départs
4. **Intégrations externes** : LinkedIn, GitHub, etc.
5. **Notifications en temps réel** : WebSockets pour les alertes
6. **Export de données** : PDF/Excel pour les rapports
7. **Workflow d'entretien** : Planification et suivi
8. **Feedback candidat** : Système de notation et commentaires

---

## 📞 Support

Pour toute question ou problème :
1. Consulter `DOCUMENTATION_ANALYSE_CV.md` pour les détails sur l'analyse de CV
2. Vérifier les logs Django pour les erreurs backend
3. Vérifier la console navigateur pour les erreurs frontend
4. Vérifier que toutes les dépendances sont installées

---

**Date de création** : Novembre 2025  
**Version** : 1.0.0  
**Auteur** : Équipe TalentVision

