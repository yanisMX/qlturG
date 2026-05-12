# Merge PR #2 — Paramétrage partie

**Branche** : `feat/parametrage-partie` → `master`  
**Date** : 2026-05-12  
**Commits** : 6  
**Diff** : +763 / −153 lignes

---

## Ce qui a été intégré

### 1. Nouveaux modes de jeu (Survival)

Deux modes survival ajoutés en plus du mode Standard :

- **SURVIVAL_SOLO** — partie solo, 3 vies, le jeu s'arrête quand le joueur perd toutes ses vies. Pas de lobby, la partie démarre immédiatement après création. Questions illimitées (toutes les questions disponibles sont chargées, avec extension automatique du pool si épuisé).
- **SURVIVAL_MULTI** — multijoueur 3 vies, dernier en vie gagne. Le jeu s'arrête dès qu'il reste ≤ 1 joueur actif. Questions illimitées selon le même mécanisme.

### 2. Schéma Prisma — migration `20260512131900_add_game_modes`

Champs ajoutés :
- `Game.gameMode` : enum `STANDARD | SURVIVAL_SOLO | SURVIVAL_MULTI` (défaut `STANDARD`)
- `Game.questionDuration` : `Int` entre 5 et 30 secondes (défaut 10)
- `Game.doublePointsBonus` : `Boolean` (défaut `false`)
- `Player.lives` : `Int` (défaut 3)
- `Player.eliminated` : `Boolean` (défaut `false`)
- Difficulté `VARIE` ajoutée à l'enum `Difficulty`

### 3. Backend — GameService

- `createGame` : accepte `gameMode`, `questionDuration`, `doublePointsBonus`
- `startGame` : en survival, charge **toutes** les questions disponibles au lieu de `totalQuestions`
- `advanceQuestion` : ne termine plus la partie sur le compteur en survival — seules les conditions de vie/joueurs déclenchent la fin
- `extendSurvivalRounds` : génère un nouveau batch de rounds quand le pool initial est épuisé (boucle sur tout le pool si toutes les questions ont déjà été posées)
- `joinGame` : bloque un 2e joueur en `SURVIVAL_SOLO`
- `kickPlayer` : supprime un joueur à la demande de l'hôte
- `decrementLife` : décrémente les vies, marque `eliminated` si 0
- `getActivePlayers` : joueurs non éliminés
- `calculateScore` : prend en compte `questionDuration` (durée dynamique) et `isDoublePoints` (×2)
- `getFinalRanking` : trie par `eliminated ASC, score DESC`

### 4. Backend — GameGateway

- `game:join` : retourne `lives` et `eliminated` par joueur dans `game:state`
- `game:kick` : handler hôte uniquement — retire le joueur et lui envoie `game:kicked`
- `game:start` : émet `game:loading { duration: 2000 }` avant la 1re question (barre de chargement)
- `game:answer` : en survival, décrémente les vies sur mauvaise réponse (`game:life-lost`) ; en solo, déclenche le reveal 900 ms après la réponse
- `sendQuestion` : calcule `isDoublePoints` (20 % finaux, standard uniquement) ; envoie `total: null` en survival
- `triggerReveal` : décrémente les vies des joueurs n'ayant pas répondu en survival
- `handleAfterReveal` : étend le pool de rounds à la volée si épuisé ; conditions de fin survival vérifiées avant chaque nouvelle question

### 5. Frontend — CreatePage

- Sélecteur de mode de jeu (3 boutons avec icône + description)
- Difficulté VARIE (grille 4 options)
- Slider `questionDuration` (5–30 s, pas 5)
- Slider `totalQuestions` masqué en survival (illimité)
- Toggle `doublePointsBonus` masqué en survival
- Toggle `speedBonus` masqué en solo
- En SURVIVAL_SOLO : skip du lobby, `game:start` émis directement, navigation vers `/play/`
- Correction erreurs : compteur `submitAttempt` comme `key` Framer Motion → re-animation garantie même si message identique
- Messages Zod : vide → "Veuillez renseigner votre pseudo", 1 char → "Pseudo de 2 caractères minimum"

### 6. Frontend — LobbyPage

- Bouton ✕ par joueur (hôte uniquement, pas sur soi-même) → `game:kick`
- Badge "💀 Survival Solo / Multi" avec nombre de vies
- Affichage des ❤️ en mode survival
- `game:loading` → navigation immédiate vers `/play/`
- `game:kicked` → reset store + redirect accueil

### 7. Frontend — PlayPage

- Barre de chargement animée (rAF) pendant les 2 s avant la 1re question
- Vies ❤️ en header, animation spring quand une vie est perdue
- Banner "✦ Points × 2 — Question bonus !" pour `isDoublePoints`
- Overlay "💀 Tu as été éliminé" si `eliminated`
- Timer masqué après réponse en solo (plus de "en attente des autres joueurs")
- `game:life-lost` → `setMyLives`, `setIsEliminated`
- Compteur "Question X" sans "/ Y" en survival
- `totalSeconds` passé au Timer (fix pct hardcodé à 10 s)

### 8. Frontend — Scoreboard

- Prop `showLives` : affiche les ❤️ avec opacité selon les vies restantes
- Prop `onKick` : bouton ✕ par ligne (actif seulement si fourni)
- Joueurs éliminés grisés (opacity 0.4) avec ✕ en rouge à la place du rang

### 9. UI — réponses

- Couleur correcte : `#4ADE80` (vert) sur la bordure, le fond, le checkmark ✓ et la box "+X points"  
  (était `#F5C76B` or/jaune)
- Transition boutons : 150 ms → 80 ms pour un retour visuel plus immédiat au clic

### 10. api.ts

- `CreateGamePayload` étendu : `gameMode`, `questionDuration`, `doublePointsBonus`
- `GameData` typé avec `Difficulty | GameMode | GameStatus` (plus `string` générique)
- `Question.total` : `number | null` (null en survival)

---

## Fichiers modifiés

| Fichier | Type |
|---|---|
| `apps/api/prisma/schema.prisma` | Migration schema |
| `apps/api/src/games/game.service.ts` | Backend service |
| `apps/api/src/games/game.gateway.ts` | WebSocket gateway |
| `apps/api/src/games/games.controller.ts` | REST controller |
| `apps/api/src/questions/questions.service.ts` | Questions service |
| `apps/web/src/store/gameStore.ts` | State management |
| `apps/web/src/lib/api.ts` | HTTP client |
| `apps/web/src/pages/CreatePage.tsx` | Page création |
| `apps/web/src/pages/LobbyPage.tsx` | Page lobby |
| `apps/web/src/pages/PlayPage.tsx` | Page jeu |
| `apps/web/src/components/Scoreboard.tsx` | Composant scoreboard |
| `apps/web/src/components/RevealCard.tsx` | Composant reveal |
| `apps/web/src/components/QuestionCard.tsx` | Composant question |
| `apps/web/src/components/Timer.tsx` | Composant timer |
| `apps/web/src/index.css` | Styles globaux |
