# User Stories

## Légende

| Statut | Signification |
|--------|---------------|
| ✅ Done | Implémenté et testé |
| 🚧 In Progress | En cours |
| 📋 Backlog | À faire |

---

## Épique 1 — Gestion de partie

### US-01 — Créer une partie
**En tant que** joueur,  
**je veux** créer une partie en choisissant ma difficulté, le nombre de questions et le mode bonus,  
**afin de** obtenir un code à partager avec mes amis.

**Critères d'acceptation :**
- Formulaire avec : pseudo, difficulté (Facile/Moyen/Difficile), questions (5-20), bonus de rapidité on/off
- Génération d'un code à 6 caractères alphanumériques uniques (sans I, O, 0, 1)
- Redirection vers le lobby avec le code affiché

**Statut :** ✅ Done

---

### US-02 — Rejoindre une partie
**En tant que** joueur,  
**je veux** rejoindre une partie existante en entrant un code et mon pseudo,  
**afin de** participer au quiz avec d'autres joueurs.

**Critères d'acceptation :**
- Formulaire avec : code (6 chars), pseudo
- Erreur si code invalide, partie déjà lancée, ou partie pleine (>12 joueurs)
- Redirection vers le lobby après connexion

**Statut :** ✅ Done

---

### US-03 — Lobby d'attente
**En tant que** joueur,  
**je veux** voir en temps réel la liste des joueurs connectés dans le lobby,  
**afin de** savoir qui est prêt avant le lancement.

**Critères d'acceptation :**
- Liste des joueurs mise à jour en temps réel (WebSocket)
- Bouton "Lancer la partie" visible uniquement pour l'hôte
- Code de la partie bien visible pour partage
- Possibilité de jouer seul (minimum 1 joueur)

**Statut :** ✅ Done

---

## Épique 2 — Déroulement du quiz

### US-04 — Répondre à une question
**En tant que** joueur,  
**je veux** voir une question avec 4 choix et un chronomètre de 10 secondes,  
**afin de** répondre avant la fin du temps imparti.

**Critères d'acceptation :**
- Question affichée sans la bonne réponse
- 4 boutons de choix cliquables, désactivés après sélection
- Chronomètre visible (barre de progression + chiffre) qui décompte de 10 à 0
- Retour visuel immédiat après sélection ("Réponse enregistrée")

**Statut :** ✅ Done

---

### US-05 — Voir la révélation après chaque question
**En tant que** joueur,  
**je veux** voir la bonne réponse et une explication pédagogique après chaque question,  
**afin d'** apprendre quelque chose même quand je me trompe.

**Critères d'acceptation :**
- Bonne réponse surlignée en vert, mauvaise réponse sélectionnée en rouge
- Explication affichée (champ `explanation` de la question)
- Points gagnés affichés pour le joueur
- Durée d'affichage : 4 secondes avant la question suivante

**Statut :** ✅ Done

---

### US-06 — Calcul du score avec bonus de rapidité
**En tant que** joueur,  
**je veux** que mon score tienne compte de la rapidité de ma réponse (si le mode est activé),  
**afin d'** être récompensé pour avoir répondu vite et correctement.

**Critères d'acceptation :**
- Sans bonus : 1 000 pts par bonne réponse
- Avec bonus : `floor(500 + 500 × (temps_restant / 10))` — de 1 000 pts (instantané) à 500 pts (dernière seconde)
- Mauvaise réponse ou absence : 0 pt
- Calcul effectué côté serveur uniquement (horodatage serveur)

**Statut :** ✅ Done

---

### US-07 — Suivi du classement en temps réel
**En tant que** joueur,  
**je veux** voir le classement mis à jour après chaque question,  
**afin de** savoir où je me situe par rapport aux autres pendant la partie.

**Critères d'acceptation :**
- Classement trié par score décroissant
- Mon pseudo mis en valeur dans la liste
- Mise à jour animée après chaque révélation

**Statut :** ✅ Done

---

## Épique 3 — Résultats

### US-08 — Voir le classement final avec podium
**En tant que** joueur,  
**je veux** voir un classement final avec un podium pour le top 3,  
**afin de** célébrer la victoire ou identifier les meilleurs joueurs.

**Critères d'acceptation :**
- Podium visuel pour les places 1, 2, 3
- Classement complet en dessous (si plus de 3 joueurs)
- Mon résultat personnel mis en valeur (rang + score)
- Boutons pour relancer une partie ou retourner à l'accueil

**Statut :** ✅ Done

---

## Épique 4 — Administration des questions

### US-09 — Gérer la banque de questions
**En tant qu'** administrateur,  
**je veux** pouvoir créer, modifier et supprimer des questions via une API REST,  
**afin de** maintenir et enrichir la banque de questions.

**Critères d'acceptation :**
- Endpoints `GET/POST /questions` et `GET/PUT/DELETE /questions/:id`
- Protégé par header `x-admin-key`
- Validation des données (4 choix exactement, answerIndex entre 0 et 3, period et difficulty valides)
- Filtre par difficulté et par période via query params

**Statut :** ✅ Done

---

## Épique 5 — Qualité & Infrastructure

### US-10 — Tests unitaires du scoring
**En tant que** développeur,  
**je veux** des tests unitaires couvrant tous les cas du calcul de score,  
**afin de** garantir que le scoring est correct et non régressif.

**Critères d'acceptation :**
- Bonne réponse instantanée sans bonus → 1 000 pts
- Bonne réponse instantanée avec bonus → 1 000 pts
- Bonne réponse à 5s restantes avec bonus → 750 pts
- Bonne réponse à la dernière seconde avec bonus → 500 pts
- Mauvaise réponse → 0 pt (avec et sans bonus)
- Réponse hors délai → 500 pts minimum (plancher)

**Statut :** ✅ Done

---

### US-11 — Déploiement Dockerisé
**En tant que** ops,  
**je veux** pouvoir lancer toute la stack (API, web, DB) via Docker Compose,  
**afin de** simplifier le déploiement en production.

**Critères d'acceptation :**
- `docker-compose up` lance postgres, api et web
- Dockerfiles pour api (Node) et web (Nginx)
- Variables d'environnement configurables

**Statut :** 📋 Backlog (Dockerfiles créés, non testé end-to-end)
