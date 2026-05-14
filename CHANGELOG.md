# Changelog

Toutes les modifications notables de ce projet sont documentées ici.
Format : [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/).

---

## [Unreleased]

### Ajouté

- **Rematch** : l'hôte peut lancer une nouvelle partie depuis la page de résultats sans que les joueurs connectés aient à rejoindre manuellement. L'événement WS `game:rematch` crée une partie identique (mêmes paramètres) et redirige automatiquement tous les joueurs présents vers le nouveau lobby.
- **Classement hebdomadaire** : système de points hebdomadaires avec tiers (Bronze / Silver / Gold / Platinum), bonus de série de réponses correctes (+200 pts tous les 5), bonus de connexion quotidienne (+500 pts après 7 jours consécutifs), malus d'abandon (−100 pts, plancher 0), reset CRON chaque lundi à minuit (Europe/Paris).
- **Page Classement** (`/leaderboard`) : vue paginée du classement de la semaine avec compte à rebours jusqu'au prochain reset, position de l'utilisateur connecté en sticky si hors top.
- **Widget classement sur la HomePage** : top 5 de la semaine avec tiers et points, position de l'utilisateur connecté si absent du top 5.
- **Badges hebdomadaires** : archive des performances de fin de semaine visibles sur la page profil.
- **Pré-remplissage du pseudo** : sur les pages Rejoindre et Créer une partie, le champ pseudo est pré-rempli et verrouillé pour les utilisateurs connectés.
- **Topics multiples** : le modèle `Game` accepte désormais un tableau `topics` (vs. un seul `topic` nullable), permettant des parties mixtes ou filtrées par plusieurs thèmes.
- **Bouton Quitter en cours de partie** : bouton "✕ Quitter" dans le header de `PlayPage`, protégé par une modale de confirmation. Émet `game:leave`, reset le store Zustand et redirige vers l'accueil.

### Corrigé

- Surbrillance du joueur courant dans le scoreboard en cours de partie (`data-me="true"`) — le test Vitest associé a été mis à jour.
- **Distribution des questions par topic** : quand plusieurs topics sont sélectionnés, les questions sont désormais réparties équitablement (mode standard : `ceil(count/N)` par topic ; mode survival : interleave round-robin). Avant ce correctif, un topic avec un grand pool dominait statistiquement le résultat.
- **Migrations manquantes en production** : 5 migrations (`add_user_model`, `add_game_modes`, `add_game_topic`, `game_topics_array`, `add_leaderboard`) n'étaient pas suivies par git → tables `WeeklyScore`/`WeeklyBadge` absentes en production → route `/leaderboard` retournait 404. Les migrations sont maintenant trackées ; le `startCommand` Railway tente `migrate deploy` puis bascule sur `db push` en cas d'état incohérent.
