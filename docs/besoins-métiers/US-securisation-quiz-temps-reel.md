# User Story : Sécurisation du quiz temps réel

## Stack du projet
- Monorepo pnpm workspaces
- Backend : NestJS 10 + TypeScript strict + Socket.IO (namespace /game)
- BDD : PostgreSQL 16 + Prisma 5
- Frontend : React 18 + Vite + TypeScript strict + Tailwind + Zustand + Framer Motion
- Validation : class-validator (API) + Zod (front)
- Tests : Jest (back) + Vitest + Testing Library (front)
- Docker : docker-compose (dev) + Dockerfiles (prod)

## Contexte fonctionnel
Application type Kahoot : un hôte crée une partie, partage un code 6 caractères,
les joueurs rejoignent, l'hôte lance, questions QCM avec chrono 10s, bonus rapidité,
classement en direct.

## Objectifs de sécurité
1. Protéger PostgreSQL (injections, accès, fuites de questions/réponses)
2. Empêcher l'usurpation d'identité (joueur, hôte, sessions Socket.IO)
3. Empêcher la triche sur les réponses (lecture des bonnes réponses côté client,
   manipulation du timing, replay, multi-comptes, brute-force des codes de partie)

## Tâches

### 1. Audit initial
- Scanne la structure du monorepo, liste les apps/packages
- Identifie tous les `@SubscribeMessage` Socket.IO et les controllers REST
- Liste les modèles Prisma et repère les champs sensibles (correctAnswer, score, etc.)
- Exécute `pnpm audit` et génère `SECURITY_AUDIT.md` avec criticité

### 2. Protection PostgreSQL & Prisma
- Vérifie que toutes les requêtes passent par Prisma (pas de `$queryRawUnsafe`)
- Crée un user PostgreSQL applicatif avec droits restreints (pas de SUPERUSER)
- Hash des mots de passe hôte avec argon2id (si auth hôte existe)
- Vérifie `.env` dans `.gitignore`, fournis `.env.example` propre
- Active les logs Prisma uniquement en dev, jamais en prod
- Ajoute des contraintes DB : unique sur (gameId, userId), index sur les codes de partie

### 3. CRITIQUE : Anti-triche sur les réponses QCM
C'est le point le plus important pour un Kahoot-like.

- **JAMAIS envoyer `correctAnswer` au client** : le payload question envoyé via
  Socket.IO ne doit contenir QUE l'énoncé et les choix, jamais l'index de la bonne
  réponse. Crée un DTO `QuestionPublicDto` distinct du modèle Prisma.
- **Timing serveur autoritaire** : le serveur enregistre `questionStartedAt` au moment
  où il émet la question. Le score de rapidité est calculé serveur-side à partir de
  `serverReceivedAt - questionStartedAt`, JAMAIS à partir d'un timestamp envoyé par
  le client.
- **Validation de fenêtre** : rejette toute réponse arrivée après `startedAt + 10s +
  marge réseau (500ms)`. Rejette aussi les réponses avant `startedAt` (clock skew / triche).
- **Une seule réponse par question par joueur** : check en mémoire (Redis ou Map) ET
  contrainte DB unique (gameId, questionId, playerId).
- **Validation stricte du payload** avec class-validator sur les events Socket.IO
  (`answerIndex` doit être un entier entre 0 et nbChoices-1).
- **Score calculé exclusivement côté serveur**, jamais accepté depuis le client.
- **Empêche la lecture du bundle** : aucune question/réponse en dur dans le code
  front, tout vient du serveur au moment T.

### 4. Sécurisation Socket.IO (namespace /game)
- Mets en place un middleware d'authentification sur le namespace : chaque socket
  doit présenter un token signé (JWT court, 1h) obtenu via REST `/auth/join` après
  validation du code de partie.
- Le payload JWT contient `playerId`, `gameId`, `role` (host|player). Vérifie ces
  champs à chaque event.
- **Autorisation par event** : seul le host peut émettre `startGame`, `nextQuestion`,
  `endGame`. Crée un guard Nest dédié (`@WsHostOnly()`).
- **Empêche le rejoin frauduleux** : si un socket se déconnecte, son token de session
  reste lié à son `playerId`. Un autre socket ne peut pas réutiliser le même playerId.
- **Rate limiting Socket.IO** : max N events/seconde par socket (anti-flood). Utilise
  un interceptor Nest ou `@nestjs/throttler` adapté aux WS.
- **CORS strict** : whitelist l'origine du front, pas de `*`.

### 5. Sécurisation des codes de partie (6 caractères)
- Génère les codes avec `crypto.randomBytes`, charset sans ambigüité (pas de 0/O/1/I).
- **Rate limit fort sur `/game/join`** : max 5 tentatives/minute/IP (anti brute-force).
  Avec 6 caractères alphanumériques, un attaquant pourrait scanner sinon.
- Invalide le code dès que la partie démarre ou est terminée.
- TTL automatique : un code non utilisé expire après 30 minutes.

### 6. Anti-usurpation d'identité joueur
- Pseudo unique par partie (contrainte DB).
- Filtre les pseudos (anti-injection HTML, longueur max, blacklist optionnelle).
- Lie le `playerId` à un cookie `HttpOnly` `Secure` `SameSite=Strict` signé, pour
  qu'un joueur ne puisse pas se faire passer pour un autre en bidouillant localStorage.
- Sur reconnexion, vérifie le couple (cookie + JWT WS) pour autoriser le rejoin.

### 7. Hardening NestJS global
- `helmet()` activé avec CSP stricte
- `@nestjs/throttler` sur toutes les routes REST sensibles (/auth, /game/join, /game/create)
- ValidationPipe global avec `whitelist: true, forbidNonWhitelisted: true, transform: true`
- Headers : HSTS, X-Frame-Options DENY, Referrer-Policy strict-origin-when-cross-origin
- Logs structurés (pino) sans données sensibles (pas de JWT, pas de réponses correctes)
- Variables d'environnement validées au démarrage avec Zod ou Joi (fail fast)

### 8. Hardening Frontend
- Aucune logique de scoring côté React (Zustand stocke uniquement l'état affiché,
  rien d'autoritaire)
- Validation Zod sur tous les formulaires
- Pas de `dangerouslySetInnerHTML` sans sanitization (DOMPurify si besoin)
- CSP côté Vite/build qui interdit eval et inline scripts non-noncés
- Vérifie que le bundle prod ne contient pas de logs/secrets (`vite build` puis grep)

### 9. Docker & déploiement
- Dockerfiles multi-stage avec user non-root
- `docker-compose.yml` dev : Postgres avec password en variable d'env, port non exposé
  publiquement
- `.dockerignore` : exclut `.env`, `node_modules`, `.git`
- Healthchecks sur les services

### 10. Tests de sécurité (Jest + Vitest)
Écris des tests qui vérifient :
- Un client qui envoie `answerIndex` après les 10s reçoit un rejet
- Un client qui envoie un `score` directement est ignoré
- Un non-host qui émet `startGame` est rejeté
- Le payload `question` envoyé via Socket.IO ne contient PAS `correctAnswer`
- Brute-force de 100 codes de partie déclenche le rate limit
- Un joueur ne peut pas soumettre 2 réponses à la même question
- Reconnexion avec un mauvais cookie échoue

### 11. Documentation
- `SECURITY.md` : politique, modèle de menace, procédure d'incident
- `SECURITY_AUDIT.md` : état avant/après
- Section "variables d'env à configurer en prod" dans le README

## Livrables
- Code modifié, typé strict, testé
- Tous les tests passent (`pnpm test`)
- Audit `pnpm audit` propre ou justifié
- Résumé final + checklist des actions infra restantes

## Contraintes
- Ne casse pas le flow Kahoot existant : si une modif change le contrat Socket.IO,
  préviens-moi avant
- Migrations Prisma : génère-les mais ne les applique pas en prod sans validation
- Commits atomiques et messages clairs (feat(security):, fix(security):) avant de la faire
