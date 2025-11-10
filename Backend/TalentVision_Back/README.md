# TalentVision Backend

Plateforme de recrutement prédictif et gestion de talents - Backend Django REST

## Installation

1. Créer un environnement virtuel :
```bash
python -m venv env
source env/bin/activate  # Sur Windows: env\Scripts\activate
```

2. Installer les dépendances :
```bash
pip install -r requirements.txt
```

3. Installer le modèle spaCy (optionnel mais recommandé) :
```bash
python -m spacy download fr_core_news_sm
# ou
python -m spacy download en_core_web_sm
```

4. Configurer la base de données PostgreSQL :
   - Créer une base de données nommée `talentvision`
   - Copier `.env.example` vers `.env` et configurer les variables

5. Effectuer les migrations :
```bash
python manage.py makemigrations
python manage.py migrate
```

6. Créer un superutilisateur :
```bash
python manage.py createsuperuser
```

## Configuration

Copier `.env.example` vers `.env` et configurer :
- `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`
- `SECRET_KEY`
- `CELERY_BROKER_URL`, `CELERY_RESULT_BACKEND`

## Lancer le serveur

```bash
python manage.py runserver
```

## Lancer Celery (dans un terminal séparé)

```bash
celery -A TalentVision_Back worker -l info
```

## Lancer Celery Beat (pour les tâches périodiques)

```bash
celery -A TalentVision_Back beat -l info
```

## API Endpoints

- `/api/auth/register/` - Inscription
- `/api/auth/login/` - Connexion
- `/api/auth/token/refresh/` - Rafraîchir le token
- `/api/job-posts/` - Gestion des offres
- `/api/applications/` - Gestion des candidatures
- `/api/dashboard/stats/` - Statistiques du dashboard
- `/api/alerts/` - Alertes

## Structure

- `accounts/` - Gestion des utilisateurs et authentification
- `recruitment/` - Modèles et APIs pour le recrutement
- `ai_engine/` - Analyse de CV et calcul de scores de compatibilité

