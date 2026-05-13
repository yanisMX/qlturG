# Architecture

## Structure des dossiers

```
qlturG/
├── apps/
│   ├── api/                        Backend NestJS
│   │   ├── src/
│   │   │   ├── prisma/             PrismaModule global (@Global)
│   │   │   │   ├── prisma.module.ts
│   │   │   │   └── prisma.service.ts
│   │   │   ├── questions/          CRUD questions (REST, protégé par x-admin-key)
│   │   │   │   ├── questions.controller.ts
│   │   │   │   ├── questions.service.ts
│   │   │   │   ├── questions.module.ts
│   │   │   │   └── questions.dto.ts
│   │   │   ├── games/              Logique de partie
│   │   │   │   ├── game.service.ts      Logique métier pure (scores, état)
│   │   │   │   ├── game.gateway.ts      WebSocket namespace /game
│   │   │   │   ├── games.controller.ts  REST create/join/get
│   │   │   │   ├── games.module.ts
│   │   │   │   └── game.types.ts
│   │   │   ├── app.module.ts
│   │   │   └── main.ts
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   └── seed.ts              60 questions historiques
│   │   └── dist/                    Build TypeScript (gitignored)
│   └── web/                         Frontend React + Vite
│       └── src/
│           ├── pages/
│           │   ├── HomePage.tsx
│           │   ├── CreatePage.tsx
│           │   ├── JoinPage.tsx
│           │   ├── LobbyPage.tsx
│           │   ├── PlayPage.tsx
│           │   └── ResultsPage.tsx
│           ├── components/
│           │   ├── Timer.tsx
│           │   ├── QuestionCard.tsx
│           │   ├── RevealCard.tsx
│           │   ├── Scoreboard.tsx
│           │   └── Podium.tsx
│           ├── store/
│           │   └── gameStore.ts     Zustand (état global de la partie)
│           ├── socket/
│           │   └── socket.ts        Singleton Socket.IO client
│           └── lib/
│               └── api.ts           Fetch wrapper REST
├── docs/                            Documentation projet
├── docker-compose.yml               Service postgres (+ api/web en profil full)
├── package.json                     Scripts racine pnpm
├── pnpm-workspace.yaml
└── CLAUDE.md
```

## Modèle de données (Prisma)

```
Question  — banque de questions (period, difficulty, topic, choices[4], answerIndex, explanation)
Game      — une partie (code 6 chars, status, difficulty, topic?, gameMode, speedBonus, doublePointsBonus, …)
Player    — un joueur dans une partie (nickname, score, socketId, lives, eliminated)
Round     — une question dans une partie (questionId, orderIndex, startedAt)
Answer    — réponse d'un joueur à un round (choiceIndex, isCorrect, pointsEarned, responseTimeMs)
```

Enums : `Difficulty` (FACILE|MOYEN|DIFFICILE|VARIE), `Topic` (HISTOIRE|GEOGRAPHIE|GEOPOLITIQUE|CINEMA|PHILOSOPHIE|LITTERATURE), `GameMode` (STANDARD|SURVIVAL_SOLO|SURVIVAL_MULTI), `GameStatus` (LOBBY|IN_PROGRESS|FINISHED).

## Flux d'une partie

```
1. POST /games          → crée la partie (hostId='pending', topic optionnel)
2. WS game:join         → crée le joueur ; si hostId='pending' → ce joueur devient host
3. WS game:join (x N)  → autres joueurs rejoignent (max 12 ; max 1 en SURVIVAL_SOLO)
4. WS game:start        → hôte, sélectionne les questions filtrées par topic/difficulty, crée les Rounds
5. WS game:question     → envoyé à tous (SANS answerIndex), timer côté serveur
6. WS game:answer       → calcul du score avec horodatage serveur
7. [après timer ou tous ont répondu] → WS game:reveal (answerIndex + explication + scores)
8. [après 4s] → question suivante (retour en 5) ou game:finished
```

Modes de jeu :
- `STANDARD` : N questions fixes, fin à l'épuisement des rounds.
- `SURVIVAL_MULTI` : 3 vies par joueur, perd 1 vie si mauvaise réponse, éliminé à 0.
- `SURVIVAL_SOLO` : solo (max 1 joueur), questions illimitées, lance automatiquement sans lobby.

## Événements WebSocket (namespace /game)

### Client → Serveur

| Événement | Payload | Règle |
|-----------|---------|-------|
| `game:join` | `{ code, nickname }` | Tout le monde |
| `game:leave` | — | Tout le monde |
| `game:start` | — | Hôte uniquement |
| `game:answer` | `{ choiceIndex }` | Pendant une question active |
| `game:next` | — | Hôte, pendant la phase de révélation |
| `game:kick` | `{ playerId }` | Hôte uniquement, pendant le lobby |
| `game:rematch` | — | Hôte uniquement, après `game:finished` |

### Serveur → Client

| Événement | Payload | Moment |
|-----------|---------|--------|
| `game:state` | `{ gameId, code, status, players[], yourPlayerId, isHost, … }` | À la connexion ou après un rematch |
| `game:player-joined` | `{ playerId, nickname, score }` | Quand un joueur arrive |
| `game:player-left` | `{ playerId }` | Quand un joueur se déconnecte |
| `game:question` | `{ index, total, text, choices[], startsAt, endsAt }` | Début de chaque question |
| `game:reveal` | `{ answerIndex, explanation, scores[] }` | Après 10s ou fin des réponses |
| `game:finished` | `{ ranking[] }` | Fin de partie |
| `game:error` | `{ message }` | En cas d'erreur |

## Calcul du score

Effectué côté serveur uniquement à réception de `game:answer`.

```
Sans bonus de rapidité : 1 000 pts si correcte, 0 sinon
Avec bonus de rapidité : floor(500 + 500 × (tempsRestant_ms / 10 000)) si correcte, 0 sinon
  → 1 000 pts si réponse instantanée
  → 500 pts si réponse à la dernière seconde
  → 0 pts en dehors de la fenêtre de 10s
```

La bonne réponse (`answerIndex`) n'est **jamais** transmise au client avant `game:reveal`.
