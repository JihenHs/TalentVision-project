# 🧪 Guide des Tests - TalentVision

## 📋 Vue d'ensemble

Ce projet inclut des tests unitaires pour le backend Django et le frontend React, configurés pour CI/CD.

---

## 🔧 Backend (Django + pytest)

### Structure des tests

```
Backend/TalentVision_Back/
├── tests/
│   ├── __init__.py
│   ├── conftest.py              # Fixtures pytest partagées
│   ├── test_models.py           # Tests des modèles (Skill, JobPost, Application, etc.)
│   ├── test_serializers.py      # Tests des serializers REST
│   ├── test_views.py            # Tests des vues/API endpoints
│   ├── test_cv_analyzer.py      # Tests de l'analyse de CV et scoring
│   └── test_alert_creation.py   # Tests de création automatique d'alertes
├── pytest.ini                   # Configuration pytest
└── README_TESTS.md              # Ce fichier
```

### Installation

Les dépendances sont déjà dans `requirements.txt` :
- `pytest==8.3.4`
- `pytest-django==4.9.0`

### Exécuter les tests

```bash
cd Backend/TalentVision_Back

# Tous les tests
pytest

# Tests avec verbose
pytest -v

# Tests d'un fichier spécifique
pytest tests/test_models.py

# Tests d'une classe spécifique
pytest tests/test_models.py::TestSkill

# Tests avec couverture de code
pytest --cov=recruitment --cov=accounts --cov=ai_engine --cov-report=html

# Tests en mode watch (réexécution automatique)
pytest-watch
```

### Fixtures disponibles

Les fixtures dans `conftest.py` peuvent être utilisées dans tous les tests :

- `candidate_user` : Utilisateur avec rôle CANDIDATE
- `hr_user` : Utilisateur avec rôle HR
- `manager_user` : Utilisateur avec rôle MANAGER
- `skill_python`, `skill_django`, `skill_react` : Compétences
- `job_post` : Offre d'emploi avec compétences associées
- `candidate_profile` : Profil candidat avec CV analysé
- `application` : Candidature avec score de compatibilité

### Exemples de tests

```python
def test_create_skill(db):
    """Test création d'une compétence"""
    skill = Skill.objects.create(name='Python', category='TECHNICAL')
    assert skill.name == 'Python'

def test_list_job_posts(api_client, hr_user, job_post):
    """Test liste des offres"""
    api_client.force_authenticate(user=hr_user)
    response = api_client.get('/api/job-posts/')
    assert response.status_code == 200
```

---

## ⚛️ Frontend (React + Vitest)

### Structure des tests

```
Frontend/TalentVision_front/
├── src/
│   ├── setupTests.ts            # Configuration des tests
│   ├── lib/
│   │   └── __tests__/
│   │       ├── api.test.ts      # Tests du module API
│   │       └── auth.test.ts     # Tests du service d'authentification
│   ├── pages/
│   │   └── __tests__/
│   │       ├── Dashboard.test.tsx
│   │       └── Applications.test.tsx
│   └── components/
│       └── __tests__/
│           └── ProtectedRoute.test.tsx
└── vite.config.ts               # Configuration Vite (inclut config test)
```

### Installation des dépendances

```bash
cd Frontend/TalentVision_front
npm install
```

Les dépendances de test sont dans `package.json` :
- `vitest`
- `@testing-library/react`
- `@testing-library/jest-dom`
- `@testing-library/user-event`
- `jsdom`

### Exécuter les tests

```bash
cd Frontend/TalentVision_front

# Tous les tests
npm test

# Tests en mode watch (réexécution automatique)
npm test -- --watch

# Tests avec interface UI
npm run test:ui

# Tests avec couverture de code
npm run test:coverage
```

### Exemples de tests

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

describe('Dashboard', () => {
  it('should render loading state', () => {
    render(<Dashboard />);
    expect(screen.getByText(/chargement/i)).toBeInTheDocument();
  });
});
```

---

## 🚀 CI/CD Integration

### GitHub Actions

Un workflow GitHub Actions est configuré dans `.github/workflows/tests.yml` qui :

1. **Backend** :
   - Configure PostgreSQL
   - Installe les dépendances Python
   - Exécute les migrations
   - Lance les tests pytest avec couverture

2. **Frontend** :
   - Configure Node.js
   - Installe les dépendances npm
   - Lance les tests Vitest avec couverture

### Exécution locale des tests CI

```bash
# Backend
cd Backend/TalentVision_Back
pytest --cov=recruitment --cov=accounts --cov=ai_engine

# Frontend
cd Frontend/TalentVision_front
npm test -- --coverage
```

---

## 📊 Couverture de code

### Backend

```bash
cd Backend/TalentVision_Back
pytest --cov=recruitment --cov=accounts --cov=ai_engine --cov-report=html
```

Ouvrez `htmlcov/index.html` dans votre navigateur pour voir le rapport détaillé.

### Frontend

```bash
cd Frontend/TalentVision_front
npm run test:coverage
```

Le rapport est généré dans `coverage/`.

---

## ✅ Tests implémentés

### Backend

- ✅ **Modèles** : Skill, JobPost, Application, CandidateProfile, Alert
- ✅ **Serializers** : Tous les serializers REST
- ✅ **Vues/API** : 
  - Liste et création d'offres
  - Liste et filtrage de candidatures
  - Tri par score
  - Alertes (liste, marquer comme lu, compteur)
  - Dashboard statistiques
- ✅ **Analyse CV** : Extraction de compétences, expérience, éducation
- ✅ **Scoring** : Calcul de compatibilité avec différents scénarios
- ✅ **Alertes automatiques** : Création lors de nouvelles candidatures

### Frontend

- ✅ **Services** : API client, authentification
- ✅ **Composants** : ProtectedRoute
- ✅ **Pages** : Dashboard, Applications (avec mocks)

---

## 📝 Bonnes pratiques

1. **Nommage** : 
   - Backend : `test_<nom_fonctionnalité>.py`
   - Frontend : `<composant>.test.tsx`

2. **Isolation** : Chaque test doit être indépendant et ne pas dépendre d'autres tests

3. **Fixtures** : Réutiliser les fixtures pour éviter la duplication de code

4. **Assertions** : Utiliser des assertions claires et spécifiques

5. **Mocking** : Mocker les dépendances externes (API, services, localStorage)

6. **Couverture** : Viser au moins 70% de couverture de code

---

## 🔮 Tests à ajouter (suggestions)

### Backend
- [ ] Tests pour les permissions (HR peut créer des offres, candidat peut postuler)
- [ ] Tests pour les tâches Celery (analyse CV asynchrone)
- [ ] Tests d'intégration end-to-end
- [ ] Tests de performance pour l'analyse de CV

### Frontend
- [ ] Tests pour tous les composants de pages (JobPostDetail, Alerts, etc.)
- [ ] Tests pour les formulaires (validation, soumission)
- [ ] Tests pour les hooks personnalisés
- [ ] Tests d'intégration avec React Router
- [ ] Tests E2E avec Playwright ou Cypress

---

## 🐛 Dépannage

### Backend

**Erreur : `django.core.exceptions.ImproperlyConfigured`**
- Vérifier que `DJANGO_SETTINGS_MODULE` est défini
- Vérifier que la base de données est configurée

**Erreur : `ModuleNotFoundError`**
- Vérifier que toutes les dépendances sont installées : `pip install -r requirements.txt`

### Frontend

**Erreur : `Cannot find module`**
- Installer les dépendances : `npm install`
- Vérifier que `vitest` est dans `devDependencies`

**Erreur : `process is not defined`**
- Vérifier que `"node"` est dans les types de `tsconfig.app.json`

---

## 📚 Ressources

- [pytest Documentation](https://docs.pytest.org/)
- [pytest-django Documentation](https://pytest-django.readthedocs.io/)
- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)

---

**Date de création** : Novembre 2025  
**Version** : 1.0.0

