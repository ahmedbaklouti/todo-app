# Todo App

[![CI](https://github.com/ahmedbaklouti/todo-app/actions/workflows/ci.yml/badge.svg)](https://github.com/ahmedbaklouti/todo-app/actions/workflows/ci.yml)

Application de gestion de tâches réalisée dans le cadre du test technique **Lead Developer** pour **Libheros**.

L'objectif est de livrer une application type Wunderlist / Google Tasks avec :

- authentification sécurisée par JWT,
- isolation stricte des données par utilisateur,
- gestion de listes et de tâches,
- synchronisation temps réel via WebSocket,
- architecture claire, testable et facilement déployable.

## Stack technique

### Front-end

- `Nuxt 3`
- `Vue 3` avec Composition API
- `Pinia`
- `Tailwind CSS`
- `socket.io-client`

### Back-end

- `NestJS`
- `Prisma` avec `PostgreSQL`
- `JWT` access token + refresh token
- `Socket.IO`
- `class-validator`
- `Swagger`
- `Jest`

### Outillage

- `pnpm` en monorepo
- `Docker` / `docker compose`
- `GitHub Actions` pour la CI

## Lancement rapide

Le projet doit pouvoir se lancer en **3 commandes maximum** :

```bash
git clone https://github.com/ahmedbaklouti/todo-app.git
cp .env.example .env
docker compose up --build
```

Sous Windows PowerShell, la deuxieme commande peut etre remplacee par :

```powershell
Copy-Item .env.example .env
```

## Architecture

Le projet est pensé comme un **monorepo pnpm** afin de centraliser les conventions, les scripts, le typage partagé et la qualité de code.

```text
todo-app/
├── apps/
│   ├── api/                 # NestJS
│   │   ├── src/
│   │   │   ├── auth/
│   │   │   ├── users/
│   │   │   ├── lists/
│   │   │   ├── tasks/
│   │   │   ├── common/
│   │   │   └── main.ts
│   │   ├── test/
│   │   └── Dockerfile
│   └── web/                 # Nuxt 4
│       ├── app/
│       │   ├── components/
│       │   ├── pages/
│       │   ├── middleware/
│       │   ├── stores/
│       │   ├── composables/
│       │   └── plugins/
│       └── Dockerfile
├── packages/
│   ├── config/              # config ESLint / TS / shared tooling
│   └── shared-types/        # types partages entre front et back
├── docker-compose.yml
├── pnpm-workspace.yaml
├── .env.example
└── README.md
```

## Organisation back-end

Le back-end suit une organisation modulaire par domaine :

- `auth`
- `users`
- `lists`
- `tasks`

Chaque domaine respecte une séparation nette des responsabilités :

- `Controller` : exposition HTTP
- `Service` : logique métier
- `Repository` : accès aux données
- `DTO` : validation et contrat d'entrée
- `Gateway` : temps réel Socket.IO

Cette organisation permet de conserver un code lisible, testable et évolutif.

## Organisation front-end

Le front-end repose sur `Nuxt` avec la Composition API et des composants UI reutilisables.

Exemples de composants attendus :

- `Sidebar`
- `TaskCard`
- `TaskForm`
- `TaskDetail`
- `ConfirmationModal`

L'état global est géré avec `Pinia` via des stores dédiés :

- `auth`
- `lists`
- `tasks`

Les routes protégées passent par un middleware Nuxt afin d'empêcher l'accès aux pages authentifiées sans session valide.

## Pourquoi Nuxt plutot qu'une SPA Vue

Le choix de `Nuxt` est volontaire, même sans besoin SSR fort au départ :

- structure de projet plus robuste qu'une SPA Vue "nue",
- routing, middleware et plugins intégrés,
- meilleure scalabilité pour un test évalué sur la qualité d'architecture,
- conventions plus fortes pour accélérer le développement,
- bonne base si le produit évolue ensuite vers SEO, rendering hybride ou pages publiques.

## Pourquoi Pinia

`Pinia` est retenu car il s'intègre naturellement avec Vue/Nuxt :

- API simple et typable,
- excellente compatibilité Composition API,
- stores découplés par domaine,
- mise à jour locale facile après événements WebSocket,
- moins de complexité qu'une solution plus lourde pour ce périmètre.

## Authentification et sécurité

L'authentification repose sur un couple `access token` / `refresh token`.

### Access token

- durée de vie courte : `15 minutes`,
- stocké côté client en mémoire,
- transmis via l'en-tête `Authorization: Bearer`.

### Refresh token

- durée de vie longue : `7 jours`,
- stocké dans un cookie `httpOnly`,
- utilisé pour rafraîchir la session de façon transparente.

### Comportement attendu

- le refresh est géré automatiquement côté Nuxt via un intercepteur,
- aucune déconnexion intempestive tant que le refresh token est valide,
- retour d'une `401` claire si la session est réellement expirée,
- redirection vers la page de connexion si le renouvellement échoue.

### Isolation des données

La sécurité métier ne repose pas uniquement sur le front :

- chaque requête NestJS est filtrée par `userId`,
- un utilisateur ne peut lire, modifier ou supprimer que ses propres listes et tâches,
- le handshake WebSocket vérifie aussi le JWT avant toute connexion,
- aucune connexion socket anonyme n'est acceptée.

## Temps réel et WebSocket

Toutes les opérations sur les tâches doivent être propagées sans rechargement de page.

### Organisation

- `NestJS Gateway` avec `@WebSocketGateway`
- `Socket.IO` côté serveur et client
- rooms par liste : `list:{listId}`
- join / leave dynamiques lors du changement de liste active

### Événements serveur

- `task:created`
- `task:updated`
- `task:deleted`
- `task:completed`

### Stratégie côté front

Le client s'abonne aux événements de la room active et met à jour `Pinia` directement, sans re-fetch HTTP systématique. Cela permet :

- une UI plus réactive,
- moins d'appels réseau inutiles,
- une cohérence immédiate entre plusieurs onglets ou clients connectés à la même liste.

## Fonctionnalites actuellement implementees

- authentification `register / login / refresh / logout / me`,
- access token court et refresh token `httpOnly`,
- isolation stricte des donnees par `userId`,
- CRUD listes,
- CRUD taches,
- changement de statut des taches,
- edition d'une tache depuis le panneau de detail,
- synchronisation temps reel des evenements taches via WebSocket,
- middleware Nuxt de protection des routes,
- stores Pinia synchronises avec l'API et le socket.

## Documentation API

La documentation HTTP est générée automatiquement avec `Swagger`.

URL attendue :

```text
http://localhost:3001/api
```

## Tests

### Exigences minimales

- tests unitaires sur `AuthService`,
- tests unitaires sur `TaskService`,
- un test `e2e` couvrant le flux complet :
  `connexion -> création d'une liste -> création d'une tâche -> suppression`.

### Commandes attendues

```bash
pnpm --filter @todo-app/api test -- --runInBand
pnpm --filter @todo-app/api test:e2e -- --runInBand
```

## Docker

Le dépôt doit fournir :

- un `Dockerfile` pour le back-end,
- un `Dockerfile` pour le front-end,
- un `docker-compose.yml` lançant toute la stack,
- un `.env.example` sans secret.

L'objectif est un demarrage simple et reproductible pour le reviewer.

Points importants de l'implementation Docker actuelle :

- l'API est construite en multi-stage,
- le conteneur API applique automatiquement `prisma db push` au demarrage,
- le front est servi a partir du build Nuxt de production,
- `docker compose` attend que PostgreSQL soit pret avant de lancer l'API.

## CI

Un pipeline `GitHub Actions` est configure sur chaque `push` et `pull request` :

- installation des dépendances,
- lint API,
- tests unitaires API,
- test e2e API,
- build API et front.

## Ce que je ferais différemment avec plus de temps

- mettre en place une rotation stricte des refresh tokens,
- ajouter davantage de tests d'intégration repository + base de données,
- renforcer la stratégie de reconnexion WebSocket,
- ajouter de l'observabilité (logs structurés, métriques, tracing),
- améliorer l'accessibilité et les états d'erreur UI,
- préparer un système de partage de types et de contrats API plus poussé.

## Ce que je testerais en priorité avec plus de temps

- cas limites d'authentification et d'expiration JWT,
- autorisation fine sur toutes les routes métier,
- propagation temps réel sur plusieurs onglets / clients,
- robustesse des suppressions en cascade listes -> tâches,
- tests composants front critiques,
- scénarios e2e multi-utilisateurs.

## Auteur

Projet réalisé dans le cadre d'un test technique pour **Libheros**.
