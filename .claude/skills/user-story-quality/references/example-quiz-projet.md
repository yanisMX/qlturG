# Exemples appliqués au projet Quiz Histoire de France

Ce fichier contient des US réelles du projet, analysées et reformulées selon les bonnes pratiques.

## Exemple 1 — De la demande brute à la bonne US

### Demande initiale
> « Je souhaite que le classement soit affiché sur le côté de l'écran en temps réel et qu'on puisse copier le lien d'invitation »

### Problèmes
- 🚩 Deux comportements différents regroupés (classement + invitation) servant probablement deux objectifs distincts
- 🚩 La solution UI est dans l'énoncé (« sur le côté », « copier »)
- 🚩 Pas d'acteur précis
- 🚩 Pas d'objectif produit
- 🚩 Pas de critères d'acceptation

### Reformulation en deux US

#### US-A : Inviter facilement d'autres joueurs

**Objectif produit** : augmenter le nombre moyen de joueurs par partie créée

**Acteur** : hôte d'une partie venant de la créer

**Parcours** : Créer une partie → **Inviter** → Attendre dans le lobby → Lancer

**Comportement attendu** : l'hôte peut partager l'accès à sa partie en une action, sans avoir à dicter le code

**Hypothèse** : réduire le coût de l'invitation augmentera le nombre d'invités effectifs par partie

**Story** :
> En tant qu'hôte d'une partie nouvellement créée, je veux partager l'accès à ma partie en un clic, afin d'inviter mes amis sans avoir à leur communiquer le code manuellement.

**Critères d'acceptation** :

```gherkin
Scenario: Partage d'un lien valide
  Étant donné que je viens de créer une partie au code "A3F9KM"
  Quand j'arrive sur l'écran du lobby
  Alors je vois un lien d'invitation contenant le code de la partie
  Et je vois un mécanisme pour copier ce lien

Scenario: Ouverture du lien par un invité
  Étant donné qu'une partie "A3F9KM" est en attente de joueurs
  Et que j'ai reçu le lien d'invitation
  Quand j'ouvre ce lien
  Alors je peux rejoindre la partie sans saisir le code manuellement

Scenario: Lien d'une partie déjà terminée
  Étant donné qu'une partie est en statut "FINISHED"
  Quand j'ouvre le lien d'invitation correspondant
  Alors je vois un message indiquant que la partie est terminée
  Et je vois un moyen de revenir à l'accueil
```

**Hors périmètre** : pas de partage direct via SMS / WhatsApp / réseaux sociaux dans cette US (peut faire l'objet d'une US séparée).

---

#### US-B : Voir le classement en temps réel pendant la partie

**Objectif produit** : augmenter l'engagement et la rétention dans la partie (taux de joueurs qui terminent une partie une fois commencée)

**Acteur** : joueur en cours de partie

**Parcours** : Lobby → **Jouer (round par round)** → Voir le résultat final

**Comportement attendu** : le joueur perçoit sa position relative tout au long de la partie, pas seulement à la fin

**Hypothèse** : la visibilité continue de la compétition réduit l'abandon en cours de partie

**Story** :
> En tant que joueur dans une partie en cours, je veux suivre ma position face aux autres joueurs après chaque question, afin de savoir si je dois rattraper mon retard ou défendre ma place.

**Critères d'acceptation** :

```gherkin
Scenario: Classement mis à jour après chaque révélation
  Étant donné qu'une partie est en cours avec 4 joueurs
  Et que la question courante vient d'être révélée
  Quand les scores sont calculés
  Alors je vois le classement mis à jour avec les nouveaux scores
  Et je vois le gain de points de chaque joueur pour ce tour

Scenario: Mise en évidence de ma propre position
  Étant donné que je suis le joueur "Alice" parmi 4 joueurs
  Quand j'affiche l'écran de jeu
  Alors ma ligne est mise en évidence visuellement dans le classement

Scenario: Réordonnancement quand un joueur dépasse un autre
  Étant donné qu'avant la révélation j'étais 2e
  Et qu'après mes points gagnés je passe en 1ère position
  Quand le classement se met à jour
  Alors ma position change visiblement de 2e à 1ère
```

**Hors périmètre** : pas d'animation élaborée (podium, confettis), pas de comparaison historique avec des parties précédentes.

---

## Exemple 2 — Demande UI/UX vague à reformuler

### Demande initiale
> « Je veux une interface moderne et premium, plus immersive, avec des animations »

### Problèmes
- 🚩 Ce n'est pas une US, c'est une initiative / un epic
- 🚩 Acteur générique, pas de comportement précis
- 🚩 Critères 100% subjectifs (« moderne », « premium », « immersive »)
- 🚩 Aucun objectif produit mesurable
- 🚩 Couvre potentiellement 20 US distinctes

### Reformulation : transformer l'epic en plusieurs US

L'objectif produit derrière la demande doit d'abord être clarifié. Hypothèses possibles :
- Augmenter la rétention (joueurs qui reviennent)
- Augmenter le NPS / la satisfaction
- Réduire le drop en cours de partie

À partir de là, on peut décliner en US atomiques. Exemples :

#### US-1
> En tant que joueur, je veux recevoir un feedback visuel immédiat quand je clique sur une réponse, afin de savoir sans ambiguïté que ma réponse a été enregistrée.

```gherkin
Scenario: Feedback visuel au clic
  Étant donné qu'une question est affichée avec 4 choix
  Quand je clique sur un choix
  Alors le choix sélectionné affiche un état visuel distinct (sélectionné)
  Et les autres choix deviennent non cliquables
```

#### US-2
> En tant que joueur dans les dernières secondes d'une question, je veux que le timer attire mon attention quand il devient critique, afin de ne pas oublier de répondre.

```gherkin
Scenario: Le timer change visuellement dans les dernières secondes
  Étant donné qu'une question est en cours
  Quand il reste moins de 3 secondes
  Alors le timer change de couleur vers une couleur d'alerte
  Et il anime une pulsation visible
```

#### US-3
> En tant que joueur à la fin d'une partie, je veux voir mon résultat mis en scène, afin de ressentir un moment de récompense ou de relance.

```gherkin
Scenario: Affichage du podium top 3
  Étant donné que la partie vient de se terminer
  Quand j'arrive sur l'écran de résultats
  Alors je vois les 3 premiers joueurs mis en valeur visuellement
  Et je vois ma propre position si je ne suis pas dans le top 3
```

(Chaque US peut être priorisée et livrée séparément, avec des critères testables.)

---

## Exemple 3 — Mauvais découpage technique à refondre

### Découpage initial proposé
- US-1 : « Créer la table users dans Prisma »
- US-2 : « Créer l'endpoint POST /auth/register »
- US-3 : « Créer le formulaire React d'inscription »

### Problèmes
- 🚩 Découpage horizontal par couche technique
- 🚩 Aucune des trois ne livre seule un comportement utilisateur observable
- 🚩 Pas d'acteur ni d'objectif

### Refonte en US verticales

#### US-1 : S'inscrire avec email et mot de passe

**Story** :
> En tant que visiteur, je veux créer un compte avec mon email et un mot de passe, afin de pouvoir suivre l'historique de mes parties.

Cette US **seule** traverse le formulaire React, l'endpoint NestJS, et la table Prisma. Elle livre un comportement complet.

**Critères** :
```gherkin
Scenario: Inscription réussie
  Étant donné que je suis sur la page d'inscription
  Quand je saisis un email valide et un mot de passe conforme aux règles
  Et que je soumets le formulaire
  Alors mon compte est créé
  Et je suis automatiquement connecté
  Et je vois un message de bienvenue

Scenario: Email déjà utilisé
  Étant donné qu'un compte existe avec l'email "alice@test.com"
  Quand je tente de m'inscrire avec ce même email
  Alors je vois un message indiquant que l'email est déjà utilisé
  Et aucun nouveau compte n'est créé

Scenario: Mot de passe trop faible
  Étant donné que je suis sur la page d'inscription
  Quand je saisis un mot de passe de moins de 8 caractères
  Alors je vois un message d'erreur expliquant la règle
  Et le formulaire n'est pas soumis
```

#### US-2 (séparée) : Se connecter avec email et mot de passe
*(US distincte, même structure)*

#### US-3 (séparée) : Réinitialiser un mot de passe oublié
*(US distincte, même structure)*

---

## Synthèse

Pour ton projet, les questions à te poser avant chaque US :

1. **Quel acteur précis ?** (visiteur ? hôte ? joueur en cours ? admin ?)
2. **À quelle étape du parcours quiz ?** (création / lobby / jeu / résultats / rejouer)
3. **Quel objectif produit ?** (acquisition / engagement / rétention / monétisation future ?)
4. **Quel comportement observable ?** (pas une UI, pas une techno)
5. **Comment je le teste ?** (3 scénarios Gherkin minimum)

---

## Anti-patterns identifiés dans les US existantes du projet

Ces US dans `docs/user-stories/` ont des problèmes à corriger si elles sont soumises en évaluation :

| Fichier | Problème principal |
|---|---|
| `US-amelioration-multijoueur.md` | **Fourre-tout** — 4 comportements mélangés (invitation + classement + /join + tests). À découper en 4 US distinctes. |
| `US-authentification.md` | **Then sous le capot** — critères avec `POST /auth/register`, `localStorage`, chemins de fichiers. Contient aussi une table d'implémentation qui n'appartient pas à une US. |
| `US-tests-unitaires-scoring.md` | **Découpage horizontal** — acteur = développeur, c'est une tâche technique déguisée en US. |
| `docs/besoins-métiers/US-Authentification.md` | **Critères subjectifs** dans les notes UX : « fluide, moderne, rapide » → non testables. |
