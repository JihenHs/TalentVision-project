# TalentVision Frontend

Interface React pour la plateforme TalentVision

## Installation

1. Installer les dépendances :
```bash
npm install
```

2. Configurer les variables d'environnement :
   - Copier `.env.example` vers `.env`
   - Configurer `VITE_API_URL` si nécessaire

3. Lancer le serveur de développement :
```bash
npm run dev
```

## Structure

- `src/lib/` - Services API et authentification
- `src/components/` - Composants réutilisables
- `src/pages/` - Pages de l'application
- `src/App.tsx` - Composant principal avec routing

## Technologies

- React 19
- TypeScript
- React Router
- TanStack Query (React Query)
- Recharts pour les graphiques
- Tailwind CSS pour le styling
- Axios pour les requêtes HTTP
