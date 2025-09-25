# Frontend One Way - README

## Aperçu

Application React (MUI + React Router) pour gérer:
- Authentification (login/register) avec le backend Django.
- Espace recruteur: Dashboard, Campagnes, Sessions, Candidats, Analytics.
- Espace candidat: Dashboard, Détails d’entretien (questions/réponses/évaluations).

Structure clé:
- `src/pages/` pages par rôle (`recruiter/`, `candidate/`).
- `src/components/` composants UI (formulaires, modales, etc.).
- `src/services/` appels API (Axios instance `api.js`).
- `src/contexts/` contextes (Auth, Theme).

## Prérequis

- Node 18+
- npm ou yarn
- Backend lancé sur `http://localhost:8000` (modifiable via env Axios)

## Installation

```bash
npm install
# ou
yarn
```

## Scripts

- `npm start` démarre en mode dev (sur `http://localhost:3000` ou `http://localhost:5173`).
- `npm run build` build production.

## Configuration API

Axios est configuré dans `src/services/api.js` (baseURL relative `'/api/'` si reverse-proxy, sinon `http://localhost:8000/api/`).
Assurez-vous que le CORS côté backend autorise l’origin du frontend.

## Routage principal (`src/App.js`)

- `/auth/login`, `/auth/register` alias.
- `/recruiter/*` (protégé, rôle hiring_manager):
  - `/recruiter/dashboard` Dashboard recruteur
  - `/recruiter/campaigns` Liste des campagnes
  - `/recruiter/campaigns/create` Création de campagne
  - `/recruiter/campaigns/:id` Détails campagne
  - `/recruiter/sessions` Sessions
  - `/recruiter/sessions/:id` Détail session
  - `/recruiter/candidates` Pool de talents (candidats invités par le recruteur connecté)
  - `/recruiter/analytics` Analytics
- `/candidate/*` (protégé, rôle candidate):
  - `/candidate/dashboard`
  - `/candidate/interviews/:id`
- `/session/:accessToken` Landing interview candidat (lien d’invitation)

## Pages clés

- `pages/recruiter/CreateCampaign.jsx` + `components/CampaignForm.jsx`:
  - Date de début par défaut = maintenant, `min` imposé sur inputs, validation frontend + backend.
- `pages/recruiter/Candidates.jsx`:
  - Liste des candidats filtrée par les campagnes du recruteur.
  - Recherche, stats (sessions/réponses/dernière invitation), ré-invitation, export CSV.
- `components/InviteModal.jsx`:
  - Ouverture Gmail Web compose forcée via AccountChooser + `continue`.

## Auth / Register

`contexts/AuthContext.jsx` gère les appels `login`, `register`, et stocke l’utilisateur/tokens.
Le register côté candidat envoie: `{ role: 'candidate', email, password, first_name, last_name, phone, linkedin_url }`.
Le backend accepte `role` ou `user_type`.

## Développement

- Thème: `contexts/ThemeContext`, styles globaux dans `src/styles/`.
- Composants MUI: respect de la dark mode et glass UI.
- Pour ajouter une page:
  1. Créez `src/pages/...`
  2. Ajoutez la route dans `src/App.js`
  3. Ajoutez services si nécessaire dans `src/services/`

## Dépannage

- CORS: configurez `CORS_ALLOWED_ORIGINS` côté backend.
- 401: vérifiez les tokens dans le `AuthContext` et le header Authorization.
- Gmail compose: autoriser les popups si bloqués par le navigateur.
