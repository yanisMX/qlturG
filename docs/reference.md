# Référence fonctionnelle

Index de toutes les fonctions, endpoints et événements du projet. Objectif : savoir en 5 secondes où se trouve le code qui gère un comportement donné.

---

## Backend — REST API

### `GamesController` · `apps/api/src/games/games.controller.ts`

| Méthode | Route | Description | Throttle |
|---------|-------|-------------|---------|
| `POST` | `/games` | Crée une partie (`CreateGameDto`) → retourne `Game` | 10 req/min |
| `POST` | `/games/join` | Rejoint une partie par code (`JoinGameDto`) → retourne `{ game, player }` | 5 req/min |
| `GET` | `/games/:code` | Récupère l'état d'une partie par code | — |

### `AuthController` · `apps/api/src/auth/auth.controller.ts`

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| `POST` | `/auth/register` | — | Crée un compte (pseudo + email) → `{ token, user }` |
| `GET` | `/auth/me` | JWT | Retourne l'utilisateur courant ; déclenche `recordDailyLogin` |
| `PATCH` | `/auth/profile` | JWT | Met à jour pseudo / email / avatarUrl |
| `POST` | `/auth/avatar` | JWT | Upload avatar vers disque local (2 MB max, jpg/png/webp) |
| `GET` | `/auth/providers` | — | Liste les providers OAuth configurés |
| `GET` | `/auth/google` | — | Redirige vers Google OAuth |
| `GET` | `/auth/google/callback` | Passport | Callback Google → redirige vers `FRONTEND_URL/auth/callback?token=…` |
| `GET` | `/auth/microsoft` | — | Redirige vers Microsoft OAuth |
| `GET` | `/auth/microsoft/callback` | Passport | Callback Microsoft |
| `GET` | `/auth/linkedin` | — | Redirige vers LinkedIn OAuth |
| `GET` | `/auth/linkedin/callback` | Passport | Callback LinkedIn |

### `LeaderboardController` · `apps/api/src/leaderboard/leaderboard.controller.ts`

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| `GET` | `/leaderboard` | — | Classement hebdomadaire paginé (`?page=1&limit=20`) |
| `GET` | `/leaderboard/me` | JWT | Position et points de l'utilisateur courant cette semaine |
| `GET` | `/leaderboard/badges` | JWT | Badges historiques de l'utilisateur (archives hebdomadaires) |
| `GET` | `/leaderboard/next-reset` | — | Date ISO du prochain reset hebdomadaire |

### `UploadController` · `apps/api/src/upload/upload.controller.ts`

| Méthode | Route | Description |
|---------|-------|-------------|
| `POST` | `/upload/avatar` | Upload avatar vers Cloudinary (5 MB max, images uniquement) → `{ url }` |

### `QuestionsController` · `apps/api/src/questions/questions.controller.ts`

CRUD protégé par `x-admin-key`. Usage interne uniquement.

---

## Backend — WebSocket

Namespace : `/game` · Tous les événements passent par `GameGateway` (`apps/api/src/games/game.gateway.ts`).

### État interne du gateway (Maps en mémoire)

| Map | Clé | Valeur | Rôle |
|-----|-----|--------|------|
| `sessions` | `socketId` | `{ playerId, gameId, isHost, userId? }` | Session de chaque socket connecté |
| `activeRounds` | `gameId` | `{ round, question, startedAt, allRounds, allQuestions, isDoublePoints }` | Question en cours par partie |
| `roundTimers` | `gameId` | `setTimeout` ref | Timer de fin de question |
| `answerStreaks` | `playerId` | `number` | Compteur de bonnes réponses consécutives |
| `answeredPlayers` | `roundId` | `Set<playerId>` | Joueurs ayant déjà répondu à ce round |

### Événements Client → Serveur

| Événement | Payload | Handler | Qui peut l'émettre |
|-----------|---------|---------|-------------------|
| `game:join` | `{ code, nickname, avatarUrl? }` | `handleJoin` | Tout le monde |
| `game:leave` | — | `handleLeave` | Tout le monde |
| `game:start` | — | `handleStart` | Hôte uniquement |
| `game:answer` | `{ choiceIndex: 0–3 }` | `handleAnswer` | Tout joueur non-éliminé, pendant question active |
| `game:next` | — | `handleNext` | Hôte, pendant la révélation |
| `game:kick` | `{ playerId }` | `handleKick` | Hôte, pendant le lobby |
| `game:rematch` | `{ topics?: Topic[] }` | `handleRematch` | Hôte, après `game:finished` |

### Événements Serveur → Client

| Événement | Payload | Moment |
|-----------|---------|--------|
| `game:state` | `{ gameId, code, status, players[], yourPlayerId, isHost, difficulty, gameMode, speedBonus, doublePointsBonus, totalQuestions, questionDuration, hostId, topics? }` | Après `game:join` ou `game:rematch` |
| `game:player-joined` | `{ playerId, nickname, avatarUrl?, score, lives, eliminated }` | Quand un joueur rejoint |
| `game:player-left` | `{ playerId }` | Quand un joueur quitte ou se déconnecte |
| `game:kicked` | `{ message }` | Envoyé uniquement au joueur expulsé |
| `game:loading` | `{ duration: ms }` | Juste avant la 1ʳᵉ question (barre de chargement) |
| `game:question` | `{ index, total\|null, text, choices[], startsAt, endsAt, isDoublePoints? }` | Début de chaque question (`answerIndex` absent) |
| `game:reveal` | `{ answerIndex, explanation, scores[] }` | Fin du timer ou fin des réponses |
| `game:life-lost` | `{ lives, eliminated }` | Envoyé uniquement au joueur concerné (survival) |
| `game:finished` | `{ ranking[] }` | Fin de partie |
| `game:error` | `{ message }` | En cas d'erreur métier |

### Méthodes privées du gateway

| Méthode | Rôle |
|---------|------|
| `sendQuestion(game, allRounds, allQuestions, index)` | Envoie `game:question` à toute la salle, démarre le timer |
| `triggerReveal(gameId)` | Stoppe le timer, calcule les vies perdues (survival), envoie `game:reveal`, planifie `handleAfterReveal` |
| `handleAfterReveal(gameId, previousRound)` | Vérifie fin de partie, étend le pool survival si nécessaire, appelle `sendQuestion` pour la suite |
| `finishGame(gameId)` | Envoie `game:finished`, déclenche `creditWeeklyScores` (fire-and-forget) |
| `creditWeeklyScores(gameId)` | Crédite les points hebdomadaires pour tous les joueurs authentifiés de la partie |
| `handleDisconnect(client)` | Applique le malus d'abandon si auth + partie en cours, notifie la salle |

---

## Backend — Services

### `GameService` · `apps/api/src/games/game.service.ts`

| Méthode | Signature | Description |
|---------|-----------|-------------|
| `createGame` | `(params) → Game` | Crée une partie avec code unique généré en crypto-safe |
| `joinGame` | `({ code, nickname, userId?, avatarUrl? }) → { game, player }` | Valide le code, crée le `Player`, retourne l'état complet |
| `setHost` | `(gameId, playerId) → Game` | Désigne l'hôte d'une partie |
| `startGame` | `(gameId) → { rounds, questions }` | Sélectionne les questions (répartition équitable par topic), crée les `Round` |
| `extendSurvivalRounds` | `(gameId, usedIds, difficulty, startIndex) → { rounds, questions }` | Étend le pool survival quand les questions sont épuisées (interleave round-robin) |
| `recordAnswer` | `(params) → { answer, isFirstAnswer }` | Enregistre/met à jour une réponse, calcule et crédite le score |
| `calculateScore` | `(isCorrect, speedBonus, responseTimeMs, questionDuration, isDoublePoints) → ScoreResult` | Logique de scoring pure (sans DB) |
| `decrementLife` | `(playerId) → { lives, eliminated }` | Retirement d'une vie en mode survival |
| `getActivePlayers` | `(gameId) → Player[]` | Joueurs non-éliminés d'une partie |
| `advanceQuestion` | `(gameId) → { finished, nextIndex? }` | Incrémente `currentQuestionIndex`, détecte la fin en mode standard |
| `getRoundReveal` | `(roundId, gameId) → reveal` | Données de révélation : `answerIndex`, `explanation`, `scores[]` |
| `getFinalRanking` | `(gameId) → RankingEntry[]` | Classement final trié (non-éliminés > éliminés, puis par score) |
| `kickPlayer` | `(gameId, playerId) → Player` | Supprime un joueur (hôte uniquement via gateway) |
| `createPlayerForRematch` | `(params) → Player` | Crée un nouveau joueur pour une revanche |
| `getGameWithPlayers` | `(gameId) → Game & { players, rounds }` | Partie complète avec joueurs et rounds triés |
| `getGameByCode` | `(code) → Game & { players }` | Lookup par code (insensible à la casse) |
| `updatePlayerSocket` | `(playerId, socketId\|null) → Player` | Synchronise le `socketId` lors des connexions/déconnexions |
| `getPlayersWithUser` | `(gameId) → { id, score, userId, socketId }[]` | Joueurs avec leur `userId` (pour le leaderboard) |

### `QuestionsService` · `apps/api/src/questions/questions.service.ts`

| Méthode | Signature | Description |
|---------|-----------|-------------|
| `getRandomByDifficulty` | `(difficulty, count, topics[]) → Question[]` | Sélection aléatoire avec répartition équitable : si >1 topic, fetch `ceil(count/N)` par topic puis mélange final |
| `getAllByDifficulty` | `(difficulty, excludeIds[], topics[]) → Question[]` | Toutes les questions disponibles ; si >1 topic, interleave round-robin (H₁, C₁, H₂, C₂, …) pour alterner les topics |
| `findAll` | `({ difficulty?, period? }) → Question[]` | CRUD admin — liste filtrée |
| `findOne` | `(id) → Question` | CRUD admin — détail |
| `create` / `update` / `remove` | — | CRUD admin |

### `AuthService` · `apps/api/src/auth/auth.service.ts`

| Méthode | Description |
|---------|-------------|
| `register(dto)` | Crée un compte email/pseudo, retourne `{ user, token }` |
| `findOrCreateOAuthUser(params)` | Trouve ou crée un compte OAuth (Google / Microsoft / LinkedIn) — priorité : oauthId → email → création |
| `getMe(userId)` | Récupère l'utilisateur par ID |
| `updateProfile(userId, dto)` | Met à jour pseudo / email (vérifie unicité) |
| `updateAvatar(userId, avatarUrl)` | Met à jour l'URL d'avatar |
| `generateToken(user)` | Signe un JWT `{ sub, pseudo, email }` |
| `getConfiguredProviders()` | Liste les providers OAuth actifs selon les env vars |

### `LeaderboardService` · `apps/api/src/leaderboard/leaderboard.service.ts`

| Méthode | Description |
|---------|-------------|
| `getWeekStart(now?)` | Calcule le lundi 00:00 UTC de la semaine courante (fuseau Europe/Paris) |
| `getNextWeekStart(now?)` | Lundi suivant |
| `recordDailyLogin(userId)` | Incrémente le streak de connexion ; +500 pts à partir de 7 jours consécutifs (idempotent par jour) |
| `creditGamePoints(userId, gamePoints, abandoned)` | Crédite les points de fin de partie ; si `abandoned` : malus −100 pts (plancher 0) |
| `applyAnswerStreakBonus(userId)` | +200 pts tous les 5 bonnes réponses consécutives |
| `answerStreakThreshold` | Getter → `5` (seuil de la série) |
| `getWeeklyLeaderboard(page, limit)` | Classement paginé avec tier calculé dynamiquement |
| `getMyWeeklyPosition(userId)` | Position + points de l'utilisateur cette semaine |
| `getUserBadges(userId)` | Badges archivés (historique des semaines précédentes) |
| `weeklyReset()` | `@Cron` — chaque lundi 00:00 Europe/Paris : calcule les tiers, archive les badges, remet les scores à zéro |

**Calcul des tiers** (dynamique selon la semaine) :
- `PLATINUM` : ≥ 10 000 pts **ou** top 10 % (si pool ≥ 100 joueurs)
- `GOLD` : ≥ 5 000 pts ou top 25 %
- `SILVER` : ≥ 2 000 pts ou top 50 %
- `BRONZE` : tout le reste

---

## Frontend — Pages

| Page | Route | Fichier | Rôle |
|------|-------|---------|------|
| `HomePage` | `/` | `pages/HomePage.tsx` | Hero + CTAs + widget top 5 leaderboard + widget position utilisateur |
| `CreatePage` | `/create` | `pages/CreatePage.tsx` | Formulaire de création de partie (mode, pseudo, difficulté, topics, options) |
| `JoinPage` | `/join` | `pages/JoinPage.tsx` | Saisie du code + pseudo pour rejoindre |
| `LobbyPage` | `/lobby/:code` | `pages/LobbyPage.tsx` | Salle d'attente — joueurs, code, badges paramètres, bouton start (hôte) |
| `PlayPage` | `/play/:code` | `pages/PlayPage.tsx` | Jeu en cours — question, timer, réponses, scoreboard, bouton quitter |
| `ResultsPage` | `/results/:code` | `pages/ResultsPage.tsx` | Podium, classement complet, rematch (hôte) ou nouvelle partie |
| `LeaderboardPage` | `/leaderboard` | `pages/LeaderboardPage.tsx` | Classement hebdomadaire paginé + compte à rebours reset |
| `ProfilePage` | `/profile` | `pages/ProfilePage.tsx` | Profil utilisateur, avatar, badges historiques |
| `LoginPage` | `/login` | `pages/LoginPage.tsx` | Connexion OAuth + formulaire register |
| `AuthCallbackPage` | `/auth/callback` | `pages/AuthCallbackPage.tsx` | Réception du token OAuth, stockage, redirection |

---

## Frontend — Stores Zustand

### `useGameStore` · `apps/web/src/store/gameStore.ts`

**État :**

| Champ | Type | Description |
|-------|------|-------------|
| `gameId` | `string\|null` | ID de la partie en cours |
| `code` | `string\|null` | Code à 6 caractères |
| `status` | `GameStatus` | `LOBBY \| IN_PROGRESS \| FINISHED` |
| `difficulty` | `Difficulty\|null` | Difficulté sélectionnée |
| `topics` | `Topic[]` | Topics sélectionnés (vide = mixte) |
| `gameMode` | `GameMode` | `STANDARD \| SURVIVAL_SOLO \| SURVIVAL_MULTI` |
| `speedBonus` | `boolean` | Bonus de rapidité actif |
| `doublePointsBonus` | `boolean` | Points doubles actifs |
| `totalQuestions` | `number` | Nombre de questions configuré |
| `questionDuration` | `number` | Durée par question (secondes) |
| `players` | `PlayerInfo[]` | Joueurs avec score et vies |
| `myPlayerId` | `string\|null` | ID du joueur local |
| `isHost` | `boolean` | Ce client est-il l'hôte |
| `currentQuestion` | `Question\|null` | Question active |
| `myAnswer` | `number\|null` | Index de réponse choisie |
| `reveal` | `RevealData\|null` | Données de révélation |
| `myLives` | `number` | Vies restantes (survival) |
| `ranking` | `RankingEntry[]` | Classement final |

**Actions :**

| Action | Description |
|--------|-------------|
| `setGameState(partial)` | Merge partiel de l'état |
| `setPlayers(players)` | Remplace la liste complète |
| `addPlayer(player)` | Ajoute un joueur (idempotent) |
| `removePlayer(playerId)` | Retire un joueur |
| `setQuestion(q)` | Nouvelle question → reset `myAnswer` et `reveal` |
| `setMyAnswer(idx)` | Mémorise la réponse locale |
| `setReveal(r)` | Données de révélation + mise à jour des scores/vies des joueurs |
| `setRanking(r)` | Classement final + `status → FINISHED` |
| `setMyLives(lives)` | Met à jour les vies (survival) |
| `setError(msg)` | Erreur globale |
| `reset()` | Remet tout à l'état initial (utilisé sur `game:leave` et navigation vers `/`) |

### `useAuthStore` · `apps/web/src/store/authStore.ts`

| Action | Description |
|--------|-------------|
| `init()` | Lit le token depuis `localStorage`, appelle `fetchMe` — à appeler au démarrage de l'app |
| `fetchMe()` | `GET /auth/me` avec le token stocké → hydrate `user` |
| `setToken(token)` | Stocke le token en `localStorage` et dans le store |
| `logout()` | Efface le token et `user` |

---

## Frontend — Client API REST

Toutes les fonctions sont dans `apps/web/src/lib/api.ts`. Elles wrappent `fetch` avec `VITE_API_URL` comme base.

| Fonction | Endpoint | Description |
|----------|----------|-------------|
| `api.createGame(payload)` | `POST /games` | Crée une partie |
| `api.getGame(code)` | `GET /games/:code` | Récupère une partie |
| `api.uploadAvatar(file)` | `POST /upload/avatar` | Upload avatar → Cloudinary |
| `api.getLeaderboard(page, limit)` | `GET /leaderboard` | Classement hebdomadaire paginé |
| `api.getMyPosition(token)` | `GET /leaderboard/me` | Ma position cette semaine |
| `api.getMyBadges(token)` | `GET /leaderboard/badges` | Mes badges historiques |
| `api.getNextReset()` | `GET /leaderboard/next-reset` | Date du prochain reset |

---

## Frontend — Composants clés

| Composant | Fichier | Props principales | Rôle |
|-----------|---------|-------------------|------|
| `Timer` | `components/Timer.tsx` | `endsAt, totalSeconds, onExpire, onAlert` | Barre de progression du timer ; `onAlert` déclenché à 30 % restant |
| `QuestionCard` | `components/QuestionCard.tsx` | `text, choices[], selectedIndex, disabled, onSelect` | Affiche la question et les 4 choix |
| `RevealCard` | `components/RevealCard.tsx` | `reveal, choices[], myAnswer, myPlayerId` | Affiche la bonne réponse + explication + deltas de score |
| `Scoreboard` | `components/Scoreboard.tsx` | `players, myPlayerId, compact, revealScores?, showLives?` | Classement en temps réel ; met en surbrillance le joueur courant |
| `Podium` | `components/Podium.tsx` | `ranking` | Podium des 3 premiers (résultats) |
| `UserAvatar` | `components/UserAvatar.tsx` | `user, size` | Avatar avec initiale de fallback |
| `PageTransition` | `components/PageTransition.tsx` | `children` | Enveloppe Framer Motion pour transitions entre pages |

---

## Frontend — Socket

| Fonction | Fichier | Description |
|----------|---------|-------------|
| `getSocket()` | `socket/socket.ts` | Singleton Socket.IO connecté sur `VITE_WS_URL/game` avec `auth.token` depuis `localStorage` |

Le socket est créé à la première connexion et réutilisé. Pour forcer une reconnexion avec un nouveau token, appeler `socket.disconnect()` puis `socket.connect()`.

---

## Index rapide — "Je cherche où est…"

| Question | Réponse |
|----------|---------|
| Calcul du score d'une réponse | `GameService.calculateScore` · `game.service.ts:17` |
| Sélection des questions avec répartition par topic | `QuestionsService.getRandomByDifficulty` · `questions.service.ts:36` |
| Timer de fin de question | `GameGateway.sendQuestion` → `setTimeout → triggerReveal` · `game.gateway.ts:489` |
| Logique de révélation (vies survival, reveal) | `GameGateway.triggerReveal` · `game.gateway.ts:540` |
| Fin de partie et classement | `GameGateway.finishGame` · `game.gateway.ts:483` |
| Créditer les points hebdomadaires | `LeaderboardService.creditGamePoints` · `leaderboard.service.ts:83` |
| Bonus série de réponses | `LeaderboardService.applyAnswerStreakBonus` · `leaderboard.service.ts:113` |
| Reset hebdomadaire du classement | `LeaderboardService.weeklyReset` (Cron lundi 00:00 Paris) · `leaderboard.service.ts` |
| Création d'un compte OAuth | `AuthService.findOrCreateOAuthUser` · `auth.service.ts:44` |
| Rematch avec nouveaux topics | `GameGateway.handleRematch` · `game.gateway.ts:270` |
| Quitter une partie en cours | `GameGateway.handleLeave` · `game.gateway.ts:198` + bouton dans `PlayPage.tsx` |
| State global de la partie (front) | `useGameStore` · `store/gameStore.ts` |
| Authentification persistante (front) | `useAuthStore.init()` · `store/authStore.ts:61` |
