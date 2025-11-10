# Script PowerShell pour nettoyer l'historique Git et retirer Backend/env/
# ATTENTION: Cette opération réécrit l'historique Git

Write-Host "Nettoyage de l'historique Git pour retirer Backend/env/..." -ForegroundColor Yellow

# Sauvegarder les modifications non commitées
Write-Host "Vérification des modifications non commitées..." -ForegroundColor Cyan
$uncommitted = git status --porcelain
if ($uncommitted) {
    Write-Host "ATTENTION: Il y a des modifications non commitées!" -ForegroundColor Red
    Write-Host "Veuillez les commiter ou les stash avant de continuer." -ForegroundColor Red
    exit 1
}

# Option 1: Utiliser git filter-repo (recommandé mais nécessite installation)
# git filter-repo --path Backend/env/ --invert-paths

# Option 2: Créer un nouveau dépôt sans historique (plus simple)
Write-Host "Création d'un nouveau dépôt sans historique..." -ForegroundColor Cyan

# Sauvegarder l'URL du remote
$remote_url = git remote get-url origin
Write-Host "Remote URL: $remote_url" -ForegroundColor Green

# Créer un nouveau dépôt orphelin
git checkout --orphan new-main

# Ajouter tous les fichiers (sauf ceux dans .gitignore)
git add .

# Faire le premier commit
git commit -m "Initial commit - Clean repository without env/"

# Supprimer l'ancienne branche main
git branch -D main

# Renommer la nouvelle branche en main
git branch -m main

# Forcer le push (ATTENTION: cela écrase l'historique sur GitHub)
Write-Host "`nPour pousser le nouveau dépôt propre:" -ForegroundColor Yellow
Write-Host "git push -f origin main" -ForegroundColor Green
Write-Host "`nATTENTION: Cela écrase complètement l'historique sur GitHub!" -ForegroundColor Red

