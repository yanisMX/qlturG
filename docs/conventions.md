# Conventions

## Commits

Format : `type(scope): message en français`

| Type | Usage |
|------|-------|
| `feat` | Nouvelle fonctionnalité |
| `fix` | Correction de bug |
| `refactor` | Refactoring sans changement de comportement |
| `test` | Ajout ou modification de tests |
| `docs` | Documentation uniquement |
| `chore` | Config, dépendances, CI |

Scopes disponibles : `api`, `web`, `prisma`, `ws`, `infra`, `docs`

Exemples :
```
feat(api): ajouter le calcul du bonus de rapidité dans GameService
fix(ws): corriger la détection de l'hôte lors du premier game:join
test(api): ajouter tests unitaires pour calculateScore
docs: initialiser CLAUDE.md et le dossier docs/
```

## Pull Requests

Chaque PR doit inclure dans son body :
- **User Story** : la US à laquelle elle répond (cf. `docs/user-stories.md`)
- **Résumé** : ce qui change et pourquoi
- **Plan de test** : étapes pour vérifier manuellement

## Branches

```
master          branche principale, toujours déployable
feat/<slug>     nouvelle fonctionnalité (ex: feat/speed-bonus)
fix/<slug>      correction (ex: fix/host-detection)
```

## Code TypeScript

- **Strict mode** activé sur les deux apps (pas de `any` implicite)
- Pas de commentaires sauf pour les WHY non-évidents
- Pas de `console.log` en production (utiliser le logger NestJS côté API)
- Imports groupés : librairies externes → modules internes → types

## Backend (NestJS)

- Un module par domaine (`PrismaModule`, `QuestionsModule`, `GamesModule`)
- La logique métier pure va dans le `Service`, pas dans le `Gateway` ni le `Controller`
- Les DTOs utilisent `class-validator` avec des décorateurs explicites
- Les endpoints admin sont protégés par le header `x-admin-key` (lu depuis `.env`)

## Frontend (React)

- Pages dans `src/pages/`, composants réutilisables dans `src/components/`
- L'état global de la partie est dans `gameStore.ts` (Zustand)
- Le socket est un singleton dans `src/socket/socket.ts`
- Les appels REST passent par `src/lib/api.ts`
- Les formulaires sont validés avec Zod avant tout appel réseau
- Pas de logique métier dans les pages — les pages orchestrent, les composants affichent

## Tests

- **Backend** : Jest, fichiers `*.spec.ts` dans `src/`
- **Frontend** : Vitest + Testing Library, fichiers `*.test.tsx` dans `src/`
- Tester les comportements, pas les implémentations internes
- Les tests unitaires du `GameService` doivent couvrir tous les cas du scoring
