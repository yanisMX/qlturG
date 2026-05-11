# CLAUDE.md — Histoire de France Quiz

Guide de référence pour Claude Code sur ce projet. Lire en priorité avant toute tâche.

## Démarrage rapide

```bash
# PostgreSQL (Homebrew, user: yanismohamed, sans mot de passe)
brew services start postgresql@14

# Migrations + seed
pnpm db:migrate
pnpm db:seed

# Dev (API :3001 + front :5173)
pnpm dev

# Tests
pnpm test

# Build production
pnpm build
```

## Stack

| Couche | Technologie |
|--------|-------------|
| Monorepo | pnpm workspaces |
| Backend | NestJS 10 · TypeScript strict |
| Temps réel | Socket.IO — namespace `/game` |
| Base de données | PostgreSQL 16 · Prisma 5 |
| Frontend | React 18 · Vite · TypeScript strict |
| Style | Tailwind CSS · Framer Motion |
| State | Zustand |
| Validation | class-validator (API) · Zod (formulaires front) |
| Tests back | Jest |
| Tests front | Vitest + Testing Library |

## Docs

- [`docs/architecture.md`](docs/architecture.md) — Structure des modules, flux WebSocket, modèle de données
- [`docs/conventions.md`](docs/conventions.md) — Conventions de code, nommage, règles de commit/PR
- [`docs/user-stories/`](docs/user-stories/) — Une US par fichier (`US-<slug>.md`)

## Points d'attention

- **Port PostgreSQL** : le Docker postgres écoute sur le port hôte **5433** (pas 5432) pour éviter le conflit avec PostgreSQL Homebrew. En dev Homebrew, `DATABASE_URL` utilise le port 5432 ; si tu utilises `pnpm db:up`, utilise le port 5433.
- **Build backend** : utiliser `tsc -p tsconfig.build.json`, PAS `nest build` (bug incremental).
- **Création de partie** : `POST /games` ne crée pas de joueur. L'hôte rejoint via WebSocket `game:join` et devient host si `hostId='pending'`.
- **Scoring** : calculé côté serveur uniquement. La bonne réponse n'est jamais envoyée avant `game:reveal`.
- **DB locale** : user Homebrew `yanismohamed`, base `histoire_france`. Le `.env` de l'API doit refléter cela en dev.
- **Variables d'env** : copier `.env.example` → `.env` dans `apps/api/` et `apps/web/` avant de démarrer.

## Variables d'environnement

**apps/api/.env**
```
DATABASE_URL=postgresql://yanismohamed@localhost:5432/histoire_france
PORT=3001
ADMIN_KEY=admin-dev-key
CORS_ORIGIN=http://localhost:5173
```

**apps/web/.env**
```
VITE_API_URL=http://localhost:3001
VITE_WS_URL=http://localhost:3001
```
