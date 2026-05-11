# Histoire de France — Quiz Multijoueur

Quiz multijoueur en temps réel sur l'histoire de France, style Kahoot. Un joueur crée une partie et partage un code à 6 caractères ; les autres rejoignent, et l'hôte lance la partie. Questions QCM, chronomètre 10 secondes, bonus de rapidité optionnel, classement animé en direct.

## Stack technique

| Couche | Technologies |
|--------|-------------|
| Monorepo | pnpm workspaces |
| Backend | NestJS 10 · TypeScript strict · Socket.IO (namespace `/game`) |
| Base de données | PostgreSQL 16 · Prisma 5 |
| Frontend | React 18 · Vite · TypeScript strict · Tailwind CSS · Zustand · Framer Motion |
| Validation | class-validator (API) · Zod (formulaires front) |
| Tests | Jest (back) · Vitest + Testing Library (front) |
| Docker | docker-compose pour Postgres en dev, Dockerfiles pour déploiement |

## Prérequis

- Node.js >= 20
- pnpm >= 9 (`npm install -g pnpm`)
- Docker (pour la base de données)

## Installation pas à pas

```bash
# 1. Cloner et installer les dépendances
git clone <repo>
cd histoire-france-quiz
pnpm install

# 2. Copier les fichiers d'environnement
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

# 3. Démarrer PostgreSQL via Docker
pnpm db:up

# 4. Appliquer les migrations Prisma
pnpm db:migrate

# 5. Peupler la base avec 60+ questions
pnpm db:seed

# 6. Lancer le projet en dev
pnpm dev
```

L'API tourne sur http://localhost:3001, le front sur http://localhost:5173.

## Commandes de développement

```bash
pnpm dev            # Lance api (NestJS watch) + web (Vite) en parallèle
pnpm db:up          # Démarre le conteneur PostgreSQL
pnpm db:migrate     # Applique les migrations Prisma
pnpm db:seed        # Insère les questions initiales
pnpm db:reset       # Reset complet + migrate + seed
pnpm build          # Build production des deux apps
pnpm test           # Lance tous les tests (Jest + Vitest)
```

## Architecture des dossiers

```
/
├── apps/
│   ├── api/                    Backend NestJS
│   │   ├── src/
│   │   │   ├── prisma/         PrismaModule global
│   │   │   ├── questions/      CRUD questions (REST, header x-admin-key)
│   │   │   └── games/
│   │   │       ├── game.service.ts     Logique métier (scores, états)
│   │   │       ├── game.gateway.ts     WebSocket namespace /game
│   │   │       └── games.controller.ts REST create/join/get
│   │   └── prisma/
│   │       ├── schema.prisma
│   │       └── seed.ts         60+ questions historiques
│   └── web/                    Frontend React + Vite
│       └── src/
│           ├── pages/          HomePage CreatePage JoinPage LobbyPage PlayPage ResultsPage
│           ├── components/     Timer QuestionCard RevealCard Scoreboard Podium
│           ├── store/          gameStore.ts (Zustand)
│           ├── socket/         socket.ts (singleton Socket.IO client)
│           └── lib/            api.ts (fetch wrapper)
├── docker-compose.yml
└── package.json                Scripts racine (pnpm workspaces)
```

## Événements WebSocket

Namespace : `/game`

### Client → Serveur

| Événement | Payload | Description |
|-----------|---------|-------------|
| `game:join` | `{ code, nickname }` | Rejoindre une room |
| `game:leave` | — | Quitter la room |
| `game:start` | — | Lancer la partie (hôte uniquement) |
| `game:answer` | `{ choiceIndex }` | Soumettre une réponse |
| `game:next` | — | Passer à la question suivante après révélation (hôte) |

### Serveur → Client

| Événement | Payload | Description |
|-----------|---------|-------------|
| `game:state` | `{ gameId, code, status, players, yourPlayerId, isHost, … }` | Snapshot complet à la connexion |
| `game:player-joined` | `{ playerId, nickname, score }` | Nouveau joueur arrivé |
| `game:player-left` | `{ playerId }` | Joueur déconnecté |
| `game:question` | `{ index, total, text, choices, startsAt, endsAt }` | Nouvelle question (sans la réponse) |
| `game:reveal` | `{ answerIndex, explanation, scores[] }` | Révélation après 10 s |
| `game:finished` | `{ ranking[] }` | Classement final |
| `game:error` | `{ message }` | Erreur |

## Règles de scoring

- Sans bonus de rapidité : **1 000 pts** par bonne réponse
- Avec bonus : `floor(500 + 500 × (tempsRestant / 10))` — de 1 000 pts (instantané) à 500 pts (dernière seconde)
- Mauvaise réponse ou absence de réponse : **0 pt**
- Calcul réalisé côté serveur ; la bonne réponse n'est jamais transmise avant la révélation

## Variables d'environnement

**apps/api/.env**
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/histoire_france
PORT=3001
ADMIN_KEY=change-me-in-production
CORS_ORIGIN=http://localhost:5173
```

**apps/web/.env**
```
VITE_API_URL=http://localhost:3001
VITE_WS_URL=http://localhost:3001
```
