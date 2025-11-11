#!/bin/bash
set -e  # Stop script if any command fails

# ---------------------------
# 0. Set DB environment variables
# ---------------------------
export DB_NAME=talentvision
export DB_USER=postgres
export DB_PASSWORD=secret
export DB_HOST=talentvision-db
export DB_PORT=5432

# ---------------------------
# 1. Build backend image locally
# ---------------------------
docker build -t talentvision-backend:latest ./Backend/TalentVision_Back

# ---------------------------
# 2. Run backend tests
# ---------------------------
echo "Running backend tests..."
cd ./Backend/TalentVision_Back

# Installer les dépendances pour les tests
python -m pip install --upgrade pip
pip install -r requirements.txt

# Lancer les migrations pour la base de test
python manage.py migrate
# Lancer les tests unitaires
pytest --cov=recruitment --cov=accounts --cov=ai_engine --cov-report=term

cd ../../  # revenir à la racine

# ---------------------------
# 3. Build frontend image locally
# ---------------------------
docker build -t talentvision-frontend:latest ./Frontend/TalentVision_front

# ---------------------------
# 4. Run frontend tests
# ---------------------------
echo "Running frontend tests..."
cd ./Frontend/TalentVision_front
npm ci
npm test -- --coverage --watchAll=false --reporter=verbose
cd ../../  # revenir à la racine

# ---------------------------
# 5. Apply Kubernetes manifests
# ---------------------------
kubectl apply -f kubernetes/deployment.yaml
kubectl apply -f kubernetes/service.yaml

# ---------------------------
# 6. Update deployment images
# ---------------------------
kubectl set image deployment/talentvision-backend backend=talentvision-backend:latest --namespace=default
kubectl set image deployment/talentvision-frontend frontend=talentvision-frontend:latest --namespace=default

echo "Deployment finished successfully!"
