# US-authentification

**En tant qu'** utilisateur, je veux créer un compte et m'authentifier via OAuth ou un compte local, afin de sécuriser mes données personnelles, gérer mon profil et accéder à mon espace personnel.

## Critères d'acceptation

### Création de compte local (`POST /auth/register`)
- Pseudo obligatoire, 3–20 caractères, uniquement `[a-zA-Z0-9_-]`
- Email obligatoire au format valide
- Pseudo déjà utilisé → `409 Conflict`
- Email déjà utilisé → `409 Conflict`
- Champs invalides → message d'erreur explicite (class-validator)
- Retourne un JWT valide 7 jours + objet user (sans `oauthId`)

### Connexion OAuth
- `GET /auth/google` → redirect Google → callback → redirect frontend `/auth/callback?token=JWT`
- `GET /auth/microsoft` → Microsoft Graph v2.0 → même flow
- `GET /auth/linkedin` → LinkedIn OpenID Connect `/v2/userinfo` → même flow
- Première connexion OAuth : compte créé automatiquement, pseudo dérivé du nom d'affichage (unicité garantie)
- Email déjà existant : OAuth lié au compte existant, pas de doublon
- `GET /auth/providers` : liste les providers configurés (env vars présentes)

### Session persistante
- Token JWT stocké dans `localStorage` (clé `hf_token`)
- `authStore.init()` appelé au démarrage de l'app : restaure la session sans redemander la connexion
- Token expiré ou invalide : localStorage nettoyé, redirection `/login`
- `GET /auth/me` : route protégée par `JwtAuthGuard`, retourne le profil courant

### Gestion du profil (`/profile`)
- Route protégée — redirige vers `/login` si non authentifié (`ProtectedRoute`)
- `PATCH /auth/profile` : modifier pseudo et/ou email, conflit vérifié avant mise à jour
- `POST /auth/avatar` : upload fichier (jpg, png, webp, max 2 Mo) → stocké dans `public/avatars/`, servi en statique
- Sélection d'un preset parmi 8 couleurs → `avatarUrl = preset:N`
- Confirmation visuelle après succès ("Profil mis à jour !")

### Avatars
- `UserAvatar` rend : cercle coloré + initiale si `preset:N`, `<img>` si chemin `/avatars/…`, défaut indigo si `null`
- 8 presets de couleur : indigo, violet, cyan, emerald, amber, red, pink, teal

### UI/UX
- `/login` : onglets "Connexion" / "Créer un compte", boutons OAuth grisés avec mention "Non configuré" si env vars absentes
- `HomePage` : chip utilisateur (avatar + pseudo) en top-right si connecté, sinon bouton "Connexion"
- Loading states, erreurs explicites, confirmation après succès

## Fichiers créés / modifiés

| Fichier | Rôle |
|---------|------|
| `apps/api/prisma/schema.prisma` | Modèle `User` ajouté |
| `apps/api/src/auth/auth.module.ts` | Module NestJS (JWT + Passport) |
| `apps/api/src/auth/auth.service.ts` | Logique métier auth |
| `apps/api/src/auth/auth.controller.ts` | Endpoints REST + OAuth callbacks |
| `apps/api/src/auth/strategies/jwt.strategy.ts` | Stratégie JWT Passport |
| `apps/api/src/auth/strategies/google.strategy.ts` | Stratégie Google OAuth2 |
| `apps/api/src/auth/strategies/microsoft.strategy.ts` | Stratégie Microsoft (Graph API) |
| `apps/api/src/auth/strategies/linkedin.strategy.ts` | Stratégie LinkedIn (OpenID) |
| `apps/api/src/auth/guards/jwt-auth.guard.ts` | Guard NestJS JWT |
| `apps/api/src/auth/decorators/current-user.decorator.ts` | `@CurrentUser()` param decorator |
| `apps/api/src/auth/dto/register.dto.ts` | DTO register avec class-validator |
| `apps/api/src/auth/dto/update-profile.dto.ts` | DTO update profile |
| `apps/api/src/main.ts` | `useStaticAssets` pour `/avatars/*` |
| `apps/web/src/store/authStore.ts` | Zustand store auth (token, user, init, logout) |
| `apps/web/src/components/ProtectedRoute.tsx` | Wrapper redirect `/login` |
| `apps/web/src/components/UserAvatar.tsx` | Rendu avatar preset/upload/défaut |
| `apps/web/src/pages/LoginPage.tsx` | Page connexion + création compte |
| `apps/web/src/pages/ProfilePage.tsx` | Page profil (modifier pseudo/email/avatar) |
| `apps/web/src/pages/AuthCallbackPage.tsx` | Réception token OAuth → store |
| `apps/web/src/App.tsx` | Routes `/login`, `/profile`, `/auth/callback` + `init()` |
| `apps/web/src/pages/HomePage.tsx` | Chip utilisateur en top-right |

## Variables d'environnement requises (`apps/api/.env`)

```env
JWT_SECRET=<secret-fort>
API_URL=http://localhost:3001

# Google OAuth (console.cloud.google.com)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# Microsoft OAuth (portal.azure.com → App registrations)
MICROSOFT_CLIENT_ID=...
MICROSOFT_CLIENT_SECRET=...
MICROSOFT_TENANT_ID=common

# LinkedIn OAuth (developer.linkedin.com)
LINKEDIN_CLIENT_ID=...
LINKEDIN_CLIENT_SECRET=...
```

## Statut

✅ Done
