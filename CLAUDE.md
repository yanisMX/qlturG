# CLAUDE.md — Histoire de France Quiz

Guide de référence pour Claude Code. Lire en priorité — tout ce dont tu as besoin est ici.

## Démarrage rapide

```bash
brew services start postgresql@14   # PostgreSQL Homebrew
pnpm db:migrate                     # prisma migrate dev
pnpm db:seed                        # charge les JSON de apps/api/prisma/questions/
pnpm dev                            # API :3001 + front :5173
pnpm test                           # Jest (back) + Vitest (front)
pnpm build                          # tsc -p tsconfig.build.json + vite build
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

## Schéma Prisma (source de vérité)

```prisma
model Question {
  id          String     @id @default(cuid())
  text        String     @unique
  choices     String[]
  answerIndex Int
  explanation String
  period      Period
  difficulty  Difficulty
  topic       Topic      @default(HISTOIRE)
  createdAt   DateTime   @default(now())
}

model Game {
  id                   String     @id @default(cuid())
  code                 String     @unique
  hostId               String
  status               GameStatus @default(LOBBY)
  difficulty           Difficulty
  topic                Topic?           -- null = mixte (tous topics)
  gameMode             GameMode   @default(STANDARD)
  speedBonus           Boolean    @default(true)
  doublePointsBonus    Boolean    @default(false)
  totalQuestions       Int        @default(10)
  questionDuration     Int        @default(10)
  currentQuestionIndex Int        @default(0)
  players              Player[]
  rounds               Round[]
  createdAt            DateTime   @default(now())
}

model Player {
  id         String   @id @default(cuid())
  nickname   String
  score      Int      @default(0)
  socketId   String?
  lives      Int      @default(3)
  eliminated Boolean  @default(false)
  gameId     String
  game       Game     @relation(...)
  answers    Answer[]
}

model Round  { id, gameId, questionId, orderIndex, startedAt?, answers[] }
model Answer { id, playerId, roundId, choiceIndex, isCorrect, pointsEarned, responseTimeMs, answeredAt }
```

### Enums

```
Difficulty  : FACILE | MOYEN | DIFFICILE | VARIE
Topic       : HISTOIRE | GEOGRAPHIE | GEOPOLITIQUE | CINEMA | PHILOSOPHIE | LITTERATURE
GameMode    : STANDARD | SURVIVAL_SOLO | SURVIVAL_MULTI
GameStatus  : LOBBY | IN_PROGRESS | FINISHED
Period      : ANTIQUITE_GAULE | MOYEN_AGE | RENAISSANCE_ANCIEN_REGIME | REVOLUTION_EMPIRE
              XIXE_SIECLE | GUERRES_MONDIALES | GUERRE_FROIDE_DECOLONISATION | EPOQUE_CONTEMPORAINE
```

## Carte des fichiers clés

| Fichier | Rôle |
|---------|------|
| `apps/api/src/games/game.service.ts` | Logique métier pure : createGame, startGame, scoring, startGame filtre par topic si défini |
| `apps/api/src/games/game.gateway.ts` | WebSocket `/game` — orchestration des events, timers |
| `apps/api/src/games/games.controller.ts` | REST : POST /games, POST /games/join, GET /games/:code |
| `apps/api/src/questions/questions.service.ts` | getRandomByDifficulty(difficulty, count, topic?) · getAllByDifficulty(difficulty, excludeIds, topic?) |
| `apps/api/prisma/schema.prisma` | Source de vérité du schéma |
| `apps/api/prisma/questions/*.json` | Questions par topic (histoire.json, cinema.json, …) |
| `apps/web/src/store/gameStore.ts` | État global Zustand : gameId, code, topic, difficulty, players, … |
| `apps/web/src/lib/api.ts` | Fetch wrapper REST (createGame, getGame) |
| `apps/web/src/socket/socket.ts` | Singleton Socket.IO client |
| `apps/web/src/pages/CreatePage.tsx` | Formulaire de création (mode, pseudo, difficulté, thème, options) |
| `apps/web/src/pages/LobbyPage.tsx` | Lobby : code, joueurs, badge Thème·Difficulté·N questions |
| `apps/web/src/pages/PlayPage.tsx` | Jeu en cours : question, timer, réponse, révélation |

## Modes de jeu

| Mode | Comportement |
|------|-------------|
| `STANDARD` | N questions fixes, fin à l'épuisement des rounds |
| `SURVIVAL_MULTI` | Chaque joueur a 3 vies, perd une vie si mauvaise réponse, éliminé à 0 |
| `SURVIVAL_SOLO` | Solo uniquement (max 1 joueur), questions illimitées, part directement en jeu sans lobby |

En mode Survival : questions illimitées (getAllByDifficulty, pas de totalQuestions), extension auto via `extendSurvivalRounds`.

## Topics et libellés

| Enum | Label FR |
|------|----------|
| `null` | Mixte (tous) |
| `HISTOIRE` | Histoire |
| `GEOGRAPHIE` | Géographie |
| `GEOPOLITIQUE` | Géopolitique |
| `CINEMA` | Cinéma |
| `PHILOSOPHIE` | Philosophie |
| `LITTERATURE` | Littérature |

## Scoring (côté serveur uniquement)

```
Sans speedBonus : 1 000 pts si correcte
Avec speedBonus : floor(500 + 500 × (tempsRestant_s / questionDuration))
  → 1 000 pts (instantané) … 500 pts (dernière seconde)
doublePointsBonus : × 2 (appliqué aux 20 % dernières questions, géré dans le gateway)
Mauvaise réponse / absence : 0 pt
```

La bonne réponse (`answerIndex`) n'est JAMAIS transmise avant `game:reveal`.

## Événements WebSocket — namespace `/game`

### Client → Serveur

| Événement | Payload |
|-----------|---------|
| `game:join` | `{ code, nickname }` |
| `game:leave` | — |
| `game:start` | — (hôte uniquement) |
| `game:answer` | `{ choiceIndex }` |
| `game:next` | — (hôte, après révélation) |
| `game:kick` | `{ playerId }` (hôte uniquement) |

### Serveur → Client

| Événement | Payload |
|-----------|---------|
| `game:state` | `{ gameId, code, status, players[], yourPlayerId, isHost, difficulty, gameMode, speedBonus, … }` |
| `game:player-joined` | `{ playerId, nickname, score, lives? }` |
| `game:player-left` | `{ playerId }` |
| `game:kicked` | — (envoyé au joueur expulsé) |
| `game:loading` | — (chargement avant la 1re question) |
| `game:question` | `{ index, total, text, choices[], startsAt, endsAt, isDoublePoints? }` |
| `game:reveal` | `{ answerIndex, explanation, scores[] }` |
| `game:finished` | `{ ranking[] }` |
| `game:error` | `{ message }` |

## Flux d'une partie

```
POST /games            → crée la partie (hostId='pending', topic optionnel)
WS game:join           → crée le joueur ; si hostId='pending' → ce joueur devient host
WS game:join × N       → autres joueurs (max 12, 1 en SURVIVAL_SOLO)
WS game:start          → sélectionne les questions (filtrées par topic/difficulty), crée les Rounds
WS game:question       → envoyé à tous (SANS answerIndex), timer côté serveur
WS game:answer         → score calculé serveur (horodatage)
[fin timer ou tous ont répondu] → WS game:reveal
[4 s] → question suivante ou game:finished
```

## Points d'attention (gotchas)

- **Port PostgreSQL** : Docker écoute sur **5433**, Homebrew sur 5432. `DATABASE_URL` dev → 5432.
- **Build backend** : `tsc -p tsconfig.build.json`, PAS `nest build` (bug incremental).
- **Création de partie** : `POST /games` ne crée PAS de joueur. L'hôte rejoint via `game:join`.
- **topic null** = mixte = pas de filtre topic dans les requêtes Prisma.
- **migrations/** est gitignored — courir `pnpm db:migrate` localement après tout changement de schéma.
- **Test Scoreboard pré-existant** : `Scoreboard > met en surbrillance le joueur courant` échoue (`.bg-navy-50` absent) — bug pré-existant, ne pas corriger sans demande explicite.

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

## Docs

- [`docs/architecture.md`](docs/architecture.md) — Structure détaillée des modules, modèle complet
- [`docs/conventions.md`](docs/conventions.md) — Commits (`feat(api): …`), branches, PR format
- [`docs/user-stories/`](docs/user-stories/) — `US-<slug>.md` par fonctionnalité
