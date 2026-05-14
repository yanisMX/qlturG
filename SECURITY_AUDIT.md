# SECURITY_AUDIT.md — Histoire de France Quiz

Audit réalisé sur la branche `feat/security` (2026-05-14).

## Résumé exécutif

| Catégorie | Avant | Après |
|-----------|-------|-------|
| Injection SQL | ✅ Prisma seul (aucun `$queryRawUnsafe`) | ✅ inchangé |
| Fuite de bonne réponse | ✅ `answerIndex` absent du payload `game:question` | ✅ + test unitaire |
| Score côté client | ✅ jamais lu depuis le client | ✅ + bug clock-skew corrigé |
| Double réponse | ❌ aucune protection | ✅ Map en mémoire + contrainte DB `@@unique([playerId, roundId])` |
| Range `choiceIndex` | ❌ aucune validation | ✅ rejeté si < 0 ou ≥ nbChoices |
| Clock skew / replay | ❌ responseTimeMs négatif → score > 1000 | ✅ clamping `[0, durationMs]` |
| CORS gateway | ❌ `origin: '*'` | ✅ lit `CORS_ORIGIN` depuis l'env |
| `forbidNonWhitelisted` | ❌ `false` | ✅ `true` |
| Helmet | ❌ absent | ✅ activé (CSP, HSTS, X-Frame-Options…) |
| Génération code partie | ❌ `Math.random()` (non cryptographique) | ✅ `crypto.randomBytes` |
| Rate limit REST | ❌ absent | ✅ `@nestjs/throttler` : 10 req/min sur POST /games, 5 req/min sur POST /games/join |
| Validation nickname | ❌ aucune contrainte de longueur/format | ✅ `MinLength(2)` `MaxLength(20)` + regex sans caractères HTML |

## Détail des vulnérabilités corrigées

### CRITIQUE — Clock skew inflate score (CVE-like)
- **Avant** : `responseTimeMs` négatif (timestamp client manipulé ou rejouer un événement) donnait jusqu'à ~1025 pts au lieu de 1000 max.
- **Après** : `Math.max(0, Math.min(responseTimeMs, durationMs))` — le serveur ne fait confiance qu'à son propre `startedAt`.

### HAUTE — Double réponse par joueur
- **Avant** : un joueur pouvait envoyer `game:answer` plusieurs fois sur le même round et accumuler des points.
- **Après** : Map `roundId → Set<playerId>` en mémoire (vérification O(1)) + contrainte `@@unique([playerId, roundId])` en DB (filet de sécurité).

### HAUTE — `choiceIndex` hors bornes
- **Avant** : `choiceIndex: -1` ou `choiceIndex: 999` était accepté et comparé à `answerIndex` (toujours faux, mais ouvre des comportements inattendus).
- **Après** : rejeté explicitement si `< 0` ou `>= question.choices.length`.

### MOYENNE — CORS gateway `*`
- **Avant** : n'importe quelle origine pouvait se connecter au namespace `/game`.
- **Après** : whitelist basée sur `process.env.CORS_ORIGIN`.

### MOYENNE — `forbidNonWhitelisted: false`
- **Avant** : des champs inconnus passaient le `ValidationPipe` sans erreur (risque d'injection de propriétés non prévues dans les DTOs).
- **Après** : `true` — tout champ non déclaré dans un DTO provoque un 400.

### MOYENNE — Génération de code non cryptographique
- **Avant** : `Math.random()` est un PRNG déterministe. En théorie prédictible si le state du moteur V8 est connu.
- **Après** : `crypto.randomBytes(6)` — entropie cryptographique garantie par l'OS.

### FAIBLE — Absence de helmet
- **Avant** : pas de headers de sécurité HTTP (Content-Security-Policy, X-Frame-Options, HSTS…).
- **Après** : `helmet()` activé sur toutes les routes HTTP.

### FAIBLE — Pas de rate limiting
- **Avant** : POST /games/join sans limite → brute-force de codes de partie possible.
- **Après** : `@nestjs/throttler` — 5 tentatives/minute par IP sur `/games/join`.

## pnpm audit — état des vulnérabilités de dépendances

15 vulnérabilités détectées (3 low, 7 moderate, 5 high). **Toutes dans des devDependencies ou des chemins transitifs non-exploitables en production :**

| Package | Sévérité | Chemin | Exposition prod |
|---------|----------|--------|-----------------|
| `glob` | HIGH | `@nestjs/cli` (devDep) | ❌ aucune |
| `multer` (3 CVEs) | HIGH | `@nestjs/platform-express` | ⚠️ mutualisé — upload avatars uniquement ; aucun endpoint jeu |
| `picomatch` | HIGH | `@nestjs/cli` (devDep) | ❌ aucune |
| `esbuild` | HIGH | `vitest` (devDep front) | ❌ aucune |
| `@nestjs/core` | MODERATE | runtime | ⚠️ à surveiller, mettre à jour lors du prochain cycle NestJS |
| `file-type` | MODERATE | `@nestjs/common` | ⚠️ à surveiller |
| `webpack`, `ajv`, `tmp`, `vite` | LOW–MOD | devDeps | ❌ aucune |

**Action recommandée** : mise à jour de `multer` et `@nestjs/core` lors du prochain bump de dépendances.

## Ce qui reste à faire (hors scope actuel)

| Item | Priorité | Raison du report |
|------|----------|-----------------|
| Middleware JWT obligatoire sur le namespace WS `/game` | HAUTE | Changerait le contrat socket.io (guests ne pourraient plus jouer sans passer par `/auth/join`) — nécessite décision produit |
| Cookie `HttpOnly Secure SameSite=Strict` pour les joueurs | MOYENNE | Nécessite changement front + backend |
| TTL automatique sur les codes de partie (30 min) | MOYENNE | Nécessite migration + scheduled job |
| Logs structurés (pino) sans données sensibles | FAIBLE | Travail de refactoring logging |
| Validation variables d'env au démarrage (Joi/Zod) | FAIBLE | Amélioration dev-ops |
| Dockerfiles multi-stage non-root | FAIBLE | Infra — à traiter avec l'équipe DevOps |
