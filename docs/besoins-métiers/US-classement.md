# 🏆 US — Classement Général des Joueurs

## 📌 User Story

**En tant que** joueur d'une app de quiz / culture générale,
**je veux** consulter un classement hebdomadaire avec un système de tiers (Bronze / Argent / Or / Platine) basé sur mes points de la semaine,
**afin de** me situer par rapport aux autres joueurs, suivre ma progression, et obtenir un badge hebdomadaire valorisant ma performance.

---

## 🎯 Objectifs

- Stimuler l'engagement par une compétition hebdomadaire renouvelée
- Récompenser à la fois la performance (points) et la régularité (streaks)
- Donner à chaque joueur un statut visible et évolutif

---

## ⚙️ Règles métier

- Créé une branche feat/classement

### 1. Scoring

Le score est calculé à partir de plusieurs sources qui s'additionnent dans un **score hebdomadaire** :

| Source | Détail |
|---|---|
| Points de quiz | Points fixes par bonne réponse (gérés par l'interface existante) |
| Bonus rapidité | Optionnel — toggle on/off **déjà géré par l'interface existante** |
| Bonus streak (réponses) | Bonus pour X bonnes réponses consécutives → **valeur exacte à paramétrer** |
| Bonus streak (connexion) | Bonus pour connexion quotidienne consécutive → **valeur exacte à paramétrer** |
| Malus abandon | Malus léger appliqué si un quiz est abandonné en cours → **valeur exacte à paramétrer** |

> ⚠️ Le total de points d'un joueur sur la semaine = somme de toutes ces sources.

### 2. Classement hebdomadaire

- **Reset total chaque lundi à 00h00** (fuseau à définir, suggestion : UTC ou fuseau de l'app)
- Tous les joueurs repartent à **0 point**
- Le classement de la semaine N-1 est archivé pour générer les badges

### 3. Tiers (attribution en fin de semaine)

Calcul effectué au **moment du reset hebdomadaire** sur la base du classement final de la semaine écoulée.

**Mode principal — % de la population active** (joueurs connectés ayant un compte) :

| Tier | Seuil (% des joueurs class\u00e9s) |
|---|---|
| 💎 Platine | Top 1% |
| 🥇 Or | Top 10% (de 1% à 10%) |
| 🥈 Argent | Top 30% (de 10% à 30%) |
| 🥉 Bronze | Le reste (de 30% à 100%) |

**Fallback seuils fixes** — appliqué si **moins de 100 joueurs classés** sur la semaine :

| Tier | Seuil de points hebdo |
|---|---|
| 💎 Platine | ≥ **X pts** (à définir) |
| 🥇 Or | ≥ **Y pts** (à définir) |
| 🥈 Argent | ≥ **Z pts** (à définir) |
| 🥉 Bronze | < Z pts |

### 4. Éligibilité

- **Tout joueur avec un compte connecté** apparaît dans le classement
- Aucune condition minimale d'activité requise
- Un joueur à 0 point apparaît en bas du classement avec le tier Bronze par défaut

### 5. Gestion des égalités

- En cas d'égalité de points, les joueurs sont **ex-aequo** au même rang
- Le rang suivant saute en conséquence (ex : deux joueurs 5e → joueur suivant = 7e)

### 6. Gestion des abandons

- Si un joueur quitte un quiz en cours (fermeture app, déconnexion, navigation arrière) :
  - **Les points des questions déjà répondues sont conservés**
  - **Un malus léger anti-abandon est appliqué** (valeur exacte à définir)

---

## 🖥️ Spécifications UI

### Écran "Classement"

**Structure générale :**
- En-tête : titre "Classement de la semaine" + compteur de jours restants avant reset
- Liste paginée du **classement complet**
- **Encart sticky** affichant en permanence la position du joueur courant (même s'il est à la page 47)

**Par ligne du classement, afficher :**
- Rang (#1, #2, #3…)
- Avatar
- Pseudo
- Tier (icône Bronze / Argent / Or / Platine)
- Points hebdo
- Nombre de quiz joués cette semaine

**Mise en valeur :**
- Le top 3 peut être stylisé (podium) — *à confirmer*
- La ligne du joueur courant doit être visuellement distincte (highlight)

### Profil joueur

- Affichage du **badge de tier en cours** (Bronze / Argent / Or / Platine)
- Affichage du badge historique **"Or - Semaine 42"** obtenu en fin de semaine précédente
- Historique des badges hebdomadaires obtenus (à terme : collection visible)

### Notifications

- Lundi matin lors du reset : notification au joueur avec son tier obtenu de la semaine écoulée + nouveau badge

---

## ✅ Critères d'acceptance

### Scoring
- [ ] Les points de quiz s'additionnent au score hebdomadaire
- [ ] Le bonus rapidité s'applique uniquement si activé sur l'interface
- [ ] Un streak de bonnes réponses déclenche un bonus
- [ ] Un streak de connexion quotidienne déclenche un bonus
- [ ] Un abandon de quiz applique le malus défini sans effacer les points déjà gagnés

### Classement hebdomadaire
- [ ] Le classement se reset automatiquement chaque lundi à 00h00
- [ ] Tous les compteurs hebdomadaires repartent à 0
- [ ] Le classement de la semaine précédente est archivé avant le reset

### Tiers
- [ ] Le calcul du tier utilise le mode "% population" si ≥ 100 joueurs actifs
- [ ] Le calcul bascule sur "seuils fixes" si < 100 joueurs actifs
- [ ] Chaque joueur classé reçoit exactement un tier en fin de semaine
- [ ] Le badge de tier est créé sur le profil au format "Tier - Semaine N"

### UI / UX
- [ ] Le classement complet est paginable
- [ ] La position du joueur courant reste visible en permanence (sticky)
- [ ] Chaque ligne affiche : rang, avatar, pseudo, tier, points, nb quiz joués
- [ ] Le profil affiche le tier courant + l'historique des badges

### Edge cases
- [ ] Les ex-aequo partagent le même rang, le rang suivant saute
- [ ] Un joueur sans aucun quiz joué apparaît avec 0 point en Bronze
- [ ] Le malus d'abandon ne peut pas faire passer le score hebdo en négatif (à confirmer)
- [ ] Le reset ne supprime pas l'historique des badges hebdomadaires obtenus

---

## ❓ Questions ouvertes / à arbitrer avant dev

1. **Fuseau horaire** du reset hebdomadaire (UTC ? Local ? Europe/Paris ?)
2. **Valeurs exactes** des bonus streak réponses, streak connexion et malus abandon
3. **Valeurs des seuils fixes** (Platine / Or / Argent) du mode fallback
4. Le **score hebdo peut-il être négatif** suite au malus, ou plancher à 0 ?
5. **Podium visuel** pour le top 3 — souhaité ou pas ?
6. **Limite de pagination** — combien de joueurs par page (20 / 50 / 100) ?

---

## 🔗 Dépendances techniques

- Système de comptes utilisateur **existant** (connexion gérée par l'interface)
- Système de quiz **existant** (toggle bonus rapidité déjà géré)
- Système de notifications (à confirmer si déjà en place)
- Job planifié (CRON) pour le reset hebdomadaire du lundi 00h00

---

## 📦 Livrables attendus

- Modèle de données pour : score hebdomadaire, historique des badges, classement archivé
- Endpoint(s) API : récupération classement paginé, position d'un joueur, badges d'un joueur
- UI : écran Classement (avec pagination + sticky position) + section Profil (tier + historique)
- Job hebdomadaire : calcul des tiers + reset + génération des badges + notifications

