# 🔐 User Story — Authentification

---

# 📌 Objectif

Permettre à un utilisateur de créer un compte et de s’authentifier afin de :

- sécuriser l’accès à ses données personnelles,
- retrouver son historique de parties,
- accéder à ses statistiques,
- gérer son profil,
- empêcher toute usurpation de compte.

---

# 🎯 Fonctionnalités Attendues

## 📝 Création de compte

Un utilisateur peut créer un compte avec :

- un pseudo,
- une adresse mail,
- un avatar.

---

## 🌐 Connexion OAuth

L’utilisateur peut se connecter via :

- Google,
- Microsoft,
- LinkedIn.

---

## 👤 Gestion du profil

Un utilisateur authentifié peut modifier :

- son pseudo,
- son avatar,
- son adresse mail.

---

# 📏 Règles Métier

## 👤 Pseudo

Le pseudo doit être :

- obligatoire,
- unique,
- compris entre 3 et 20 caractères,
- composé uniquement de :
  - lettres,
  - chiffres,
  - tirets (`-`),
  - underscores (`_`).

### ❌ Exemples invalides

- pseudo vide,
- caractères spéciaux non autorisés,
- pseudo déjà utilisé.

---

## 📧 Adresse Mail

L’adresse mail doit être :

- obligatoire,
- unique,
- au format valide,
- vérifiée via email de confirmation.

---

## 🖼️ Avatar

L’utilisateur peut :

- uploader une image,
- sélectionner un avatar prédéfini.

### Règles

- si aucun avatar n’est choisi → avatar par défaut,
- limiter les formats supportés (`jpg`, `png`, `webp`),
- taille maximale configurable.

---

## 🔑 OAuth

### Lors d’une première connexion OAuth

- un compte est créé automatiquement.

### Si l’adresse mail existe déjà

- l’utilisateur est connecté au compte existant,
- aucun doublon de compte ne doit être créé.

---

# 🔒 Sécurité

Le système doit garantir :

- une authentification sécurisée,
- la protection des routes privées,
- une session persistante après refresh,
- la redirection des utilisateurs non authentifiés vers la page de connexion,
- l’impossibilité d’accéder aux données d’un autre utilisateur.

---

# ✅ Critères d’Acceptation

## 📝 Création de compte

- un utilisateur peut créer un compte valide,
- un pseudo déjà utilisé est refusé,
- une adresse mail déjà utilisée est refusée,
- les champs invalides affichent un message d’erreur explicite,
- un email invalide est refusé,
- un pseudo hors limites est refusé.

---

## 🌐 Connexion OAuth

- un utilisateur peut se connecter avec Google,
- un utilisateur peut se connecter avec Microsoft,
- un utilisateur peut se connecter avec LinkedIn,
- après connexion l’utilisateur accède à son espace personnel,
- un compte OAuth déjà existant reconnecte correctement l’utilisateur.

---

## 🔄 Session

- la session reste active après un refresh,
- un utilisateur déconnecté ne peut plus accéder aux routes privées,
- les routes protégées redirigent vers `/login` si nécessaire.

---

## 👤 Gestion du Profil

- l’utilisateur peut modifier son pseudo,
- l’utilisateur peut modifier son avatar,
- l’utilisateur peut modifier son adresse mail,
- les modifications sont persistées après refresh.

---

# 🚫 Cas à Gérer

## Création de compte impossible si :

- pseudo déjà utilisé,
- email déjà utilisé,
- email invalide,
- pseudo invalide,
- upload avatar invalide.

---

# 🎨 Notes UX/UI

## L’expérience utilisateur doit être :

- fluide,
- moderne,
- rapide,
- sécurisante.

## Recommandations UI

- feedback visuel clair,
- loading states,
- erreurs explicites,
- animations légères,
- transitions fluides,
- confirmation visuelle après succès.

---

# 🧠 Notes Techniques


## Contraintes

- responsive mobile / desktop,
- animations performantes,
- éviter les rerenders inutiles,
- sécuriser les tokens et sessions.

---
