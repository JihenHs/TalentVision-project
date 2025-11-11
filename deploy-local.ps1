# 1. Build backend image localement
docker build -t talentvision-backend:latest ./Backend/TalentVision_Back

# 2. Build frontend image localement
docker build -t talentvision-frontend:latest ./Frontend/TalentVision_front

# 3. Appliquer les manifests Kubernetes
kubectl apply -f kubernetes/deployment.yaml
kubectl apply -f kubernetes/service.yaml

# 4. Mettre à jour les images des déploiements
kubectl set image deployment/talentvision-backend backend=talentvision-backend:latest --namespace=default
kubectl set image deployment/talentvision-frontend frontend=talentvision-frontend:latest --namespace=default
