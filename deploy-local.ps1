$namespace = "default"
$dockerUser = "tonuser"

Write-Host "Pull latest images..."
docker pull "$dockerUser/talentvision-backend:latest"
docker pull "$dockerUser/talentvision-frontend:latest"

Write-Host " Apply Kubernetes manifests..."
kubectl apply -f kubernetes/deployment.yaml
kubectl apply -f kubernetes/service.yaml

Write-Host " Update deployments with latest images..."
kubectl set image deployment/talentvision-backend backend="$dockerUser/talentvision-backend:latest" --record
kubectl set image deployment/talentvision-frontend frontend="$dockerUser/talentvision-frontend:latest" --record

Write-Host " Wait for rollout..."
kubectl rollout status deployment/talentvision-backend
kubectl rollout status deployment/talentvision-frontend

Write-Host " Pods status:"
kubectl get pods
