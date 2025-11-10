# Étape 1 : Choisir une image Python
FROM python:3.11-slim

# Étape 2 : Installer les dépendances système nécessaires
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Étape 3 : Définir le répertoire de travail dans le conteneur
WORKDIR /app

# Étape 4 : Copier uniquement requirements.txt d'abord (pour cache Docker)
COPY requirements.txt /app/

# Étape 5 : Installer les dépendances Python
RUN pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt && \
    pip install --no-cache-dir gunicorn psycopg2-binary

# Étape 6 : Copier le reste des fichiers du projet
COPY . /app

# Étape 7 : Créer les répertoires nécessaires
RUN mkdir -p /app/media/cvs /app/media/cover_letters /app/static

# Étape 8 : Exposer le port 8000
EXPOSE 8000

# Étape 9 : Lancer le serveur Django avec Gunicorn
CMD ["gunicorn", "TalentVision_Back.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "3", "--timeout", "120"]
