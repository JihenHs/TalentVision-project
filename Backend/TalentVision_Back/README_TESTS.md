# 🧪 Guide des Tests - TalentVision

## Backend (Django)

### Installation des dépendances de test

Les dépendances sont déjà dans `requirements.txt` :
- `pytest==8.3.4`
- `pytest-django==4.9.0`

### Structure des tests

```
Backend/TalentVision_Back/
├── tests/
│   ├── __init__.py
│   ├── conftest.py              # Fixtures pytest
│   ├── test_models.py           # Tests des modèles
│   ├── test_serializers.py      # Tests des serializers
│   ├── test_views.py             # Tests des vues/API
│   ├── test_cv_analyzer.py      # Tests de l'analyse de CV
│   └── test_alert_creation.py   # Tests de création d'alertes
└── pytest.ini                    # Configuration pytest
```

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
pytest --cov=recruitment --cov=accounts --cov=ai_engine

# Tests en mode watch (réexécution automatique)
pytest-watch
```

### Fixtures disponibles

Les fixtures dans `conftest.py` peuvent être utilisées dans tous les tests :
- `candidate_user` : Utilisateur avec rôle CANDIDATE
- `hr_user` : Utilisateur avec rôle HR
- `manager_user` : Utilisateur avec rôle MANAGER
- `skill_python`, `skill_django`, `skill_react` : Compétences
- `job_post` : Offre d'emploi avec compétences
- `candidate_profile` : Profil candidat avec CV analysé
- `application` : Candidature avec score

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

## Frontend (React)

### Installation des dépendances de test

```bash
cd Frontend/TalentVision_front
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

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
└── vitest.config.ts             # Configuration Vitest
```

### Exécuter les tests

```bash
cd Frontend/TalentVision_front

# Tous les tests
npm test

# Tests en mode watch
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

## CI/CD Integration

### GitHub Actions (exemple)

```yaml
name: Tests

on: [push, pull_request]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-python@v2
        with:
          python-version: '3.11'
      - run: |
          cd Backend/TalentVision_Back
          pip install -r requirements.txt
          pytest --cov --cov-report=xml
  
  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '20'
      - run: |
          cd Frontend/TalentVision_front
          npm install
          npm test -- --coverage
```

---

## Couverture de code

### Backend

```bash
pytest --cov=recruitment --cov=accounts --cov=ai_engine --cov-report=html
```

Ouvre `htmlcov/index.html` pour voir le rapport.

### Frontend

```bash
npm run test:coverage
```

Le rapport est généré dans `coverage/`.

---

## Bonnes pratiques

1. **Nommage** : `test_<nom_fonctionnalité>.py` ou `test_<composant>.test.tsx`
2. **Isolation** : Chaque test doit être indépendant
3. **Fixtures** : Réutiliser les fixtures pour éviter la duplication
4. **Assertions** : Utiliser des assertions claires et spécifiques
5. **Mocking** : Mocker les dépendances externes (API, services)
6. **Couverture** : Viser au moins 70% de couverture de code

---

## Tests à ajouter (suggestions)

### Backend
- [ ] Tests pour les permissions (HR peut créer des offres, candidat peut postuler)
- [ ] Tests pour les filtres et recherches
- [ ] Tests pour les tâches Celery
- [ ] Tests d'intégration end-to-end

### Frontend
- [ ] Tests pour tous les composants de pages
- [ ] Tests pour les formulaires (validation)
- [ ] Tests pour les hooks personnalisés
- [ ] Tests d'intégration avec React Router

