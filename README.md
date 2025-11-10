# TalentVision - Plateforme de Recrutement Prédictif

Plateforme RH axée sur le recrutement et la rétention intelligente avec analyse IA des candidatures.

## 🚀 Fonctionnalités

- 📄 **Gestion des offres & candidatures** (CV + lettre + entretien)
- 🔍 **Moteur IA d'analyse de CV** (extraction automatique de compétences avec CNN + NLP)
- 🤝 **Score de compatibilité candidat/poste** (ML supervisé)
- 📊 **Dashboard recrutement** : délais moyens, taux d'acceptation, sources efficaces
- 💬 **Matching interne** : suggère des employés à promouvoir plutôt que recruter
- 🔔 **Alertes automatiques** : "ce collaborateur est un bon profil pour le poste X"

## 🛠️ Stack Technique

### Backend
- Django 5.2 + Django REST Framework
- PostgreSQL
- JWT Authentication
- Celery + Redis (tâches asynchrones)
- spaCy + scikit-learn + TensorFlow/Keras (IA/NLP)
- CNN pour l'analyse de CV

### Frontend
- React 19 + TypeScript
- Tailwind CSS
- Recharts (visualisations)
- React Query (state management)
- React Router

## 📦 Installation

### Prérequis
- Python 3.11+
- Node.js 18+
- PostgreSQL
- Redis

### Backend

1. Aller dans le dossier backend :
```bash
cd Backend/TalentVision_Back
```

2. Créer et activer l'environnement virtuel :
```bash
python -m venv env
# Windows
env\Scripts\activate
# Linux/Mac
source env/bin/activate
```

3. Installer les dépendances :
```bash
pip install -r requirements.txt
```

4. Installer le modèle spaCy :
```bash
python -m spacy download fr_core_news_sm
```

5. Configurer la base de données PostgreSQL et créer le fichier `.env` :
```bash
cp .env.example .env
# Éditer .env avec vos paramètres de base de données
```

6. Effectuer les migrations :
```bash
python manage.py makemigrations
python manage.py migrate
```

7. Créer un superutilisateur :
```bash
python manage.py createsuperuser
```

8. Lancer le serveur :
```bash
python manage.py runserver
```

9. Dans un autre terminal, lancer Celery :
```bash
celery -A TalentVision_Back worker -l info
```

### Frontend

1. Aller dans le dossier frontend :
```bash
cd Frontend/TalentVision_front
```

2. Installer les dépendances :
```bash
npm install
```

3. Configurer `.env` si nécessaire :
```bash
cp .env.example .env
```

4. Lancer le serveur de développement :
```bash
npm run dev
```

## 📚 Structure du Projet

```
projet/
├── Backend/
│   └── TalentVision_Back/
│       ├── accounts/          # Gestion utilisateurs & auth
│       ├── recruitment/      # Modèles & APIs recrutement
│       ├── ai_engine/        # Analyse CV & scoring
│       └── TalentVision_Back/ # Configuration Django
└── Frontend/
    └── TalentVision_front/    # Application React
```

## 🔐 Rôles Utilisateurs

- **CANDIDATE** : Peut candidater aux offres, voir ses candidatures
- **HR** : Gestion complète des offres, candidatures, alertes
- **MANAGER** : Accès aux candidatures et talents internes
- **ADMIN** : Accès administrateur complet

## 📡 API Endpoints Principaux

- `POST /api/auth/register/` - Inscription
- `POST /api/auth/login/` - Connexion
- `GET /api/job-posts/` - Liste des offres
- `POST /api/job-posts/{id}/apply/` - Candidater
- `GET /api/applications/` - Liste des candidatures
- `GET /api/dashboard/stats/` - Statistiques
- `GET /api/alerts/` - Alertes

## 🤖 IA & Machine Learning

Le système utilise :
- **spaCy** pour l'extraction NLP des compétences
- **CNN (TensorFlow/Keras)** pour l'analyse approfondie des CV
- **scikit-learn** pour le calcul de scores de compatibilité
- **Tâches asynchrones Celery** pour le traitement lourd

## 📝 Notes

- Les modèles CNN doivent être entraînés séparément et placés dans `Backend/TalentVision_Back/models/`
- Le système peut fonctionner sans CNN en utilisant uniquement NLP
- Redis est requis pour Celery

## 🚧 Développement Futur

- Analyse vidéo/audio des entretiens
- Prédiction du turnover
- Intégration LinkedIn/GitHub
- Simulation "what-if"

## 📄 Licence

Projet académique - TalentVision

