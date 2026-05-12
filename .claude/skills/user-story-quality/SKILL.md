---
name: user-story-quality
description: Évalue, améliore et rédige des user stories selon les bonnes pratiques (Cohn, Patton, Adzic, Farley). Utilise ce skill systématiquement quand l'utilisateur rédige, révise, ou demande de l'aide sur une user story, un critère d'acceptation, un backlog, ou parle d'"US", de "story", de "ticket", de "feature à découper", ou présente une demande qui ressemble à une fonctionnalité à coder. Couvre : analyse critique d'une US existante, transformation d'une demande technique en US, découpage d'une US trop large, rédaction de critères d'acceptation en Gherkin, application du canevas Impact Mapping → Story → Acceptation.
---

# Skill : User Story Quality

## Quand utiliser ce skill

Active ce skill quand l'utilisateur :
- Rédige une nouvelle user story
- Demande de réviser, critiquer ou améliorer une US existante
- Présente une demande technique (« il faut une table », « il faut un endpoint ») qu'il faut transformer en US
- Veut découper une US trop large
- Écrit des critères d'acceptation
- Prépare un prompt Claude Code à partir d'une US
- Parle de "backlog", "ticket", "story", "US", "feature à découper", "MVP"
- Donne une description de fonctionnalité même sans utiliser le mot "US"

## Principe fondamental

**Une user story ne décrit pas une fonctionnalité à coder. Elle raconte un changement de comportement qu'on veut rendre possible chez un acteur identifié, en lien avec un objectif mesurable, et vérifiable par des critères d'acceptation testables.**

Sources de référence : Mike Cohn (User Stories Applied), Ron Jeffries (3C), Jeff Patton (User Story Mapping), Gojko Adzic (Impact Mapping, Specification by Example), Dave Farley (ATDD).

## Méthode d'évaluation

Quand l'utilisateur soumet une US à évaluer, applique la **checklist des 8 critères** et donne une note pour chacun (✅ OK / ⚠️ À améliorer / ❌ Manquant) :

1. **Orientée acteur** — Acteur précis identifié (pas juste « utilisateur »). Quel rôle, dans quel contexte ?
2. **Orientée objectif** — Le « afin de » exprime un bénéfice utilisateur réel, pas une répétition de l'action.
3. **Observable** — Le comportement peut être constaté de l'extérieur.
4. **Testable** — On peut écrire des critères d'acceptation Gherkin clairs.
5. **Découpée** — Implémentable en quelques heures à 1 jour. Sinon, doit être redécoupée.
6. **Non technique** — Aucune mention de table, endpoint, framework, classe, structure interne dans la story elle-même.
7. **Inscrite dans un parcours** — Correspond à une étape identifiable du narratif utilisateur.
8. **Reliée à un impact** — Contribue à un objectif produit mesurable.

Pour chaque critère ⚠️ ou ❌, propose une reformulation concrète.

## Anti-patterns à détecter et signaler

### Le « zombie template »
Format respecté mais vide de sens.
❌ « En tant qu'utilisateur, je veux cliquer sur un bouton, afin de cliquer sur un bouton »
❌ « En tant qu'utilisateur, je veux que mes données soient en PostgreSQL, afin qu'elles soient persistées »

### Le découpage horizontal (par couche technique)
❌ « Créer la table X », « Créer l'endpoint Y », « Créer le composant Z »
→ Ce ne sont pas des US, ce sont des tâches techniques. Reformuler en US verticale qui traverse toutes les couches.

### L'US fourre-tout
❌ « En tant que client, je veux gérer mon panier »
→ Trop large. Découper en plusieurs US atomiques (ajouter, modifier, supprimer, retrouver…).

### Le critère subjectif
❌ « L'interface doit paraître moderne »
❌ « L'expérience doit être fluide »
→ Pas testable. Reformuler en comportement observable mesurable.

### L'acteur générique
❌ « En tant qu'utilisateur »
→ Préciser : invité, hôte de partie, joueur en cours de jeu, administrateur…

### La solution déguisée en besoin
❌ « En tant que joueur, je veux un bouton de copie du lien »
→ La solution (bouton) est dans l'énoncé. Reformuler en besoin : « je veux partager facilement l'accès à ma partie ».

## Canevas de rédaction d'une bonne US

Quand l'utilisateur veut créer une US à partir de zéro ou à partir d'une demande brute, fais-lui remplir ce canevas **dans cet ordre** :

```
1. OBJECTIF PRODUIT (Impact Mapping — niveau "Why")
   Quel objectif métier/produit cette US sert-elle ?
   Comment le mesure-t-on ?

2. ACTEUR (Impact Mapping — niveau "Who")
   Quel utilisateur précis ? Dans quel contexte ?

3. PARCOURS (User Story Mapping)
   À quelle étape du parcours utilisateur cette US se situe-t-elle ?
   Quelles US la précèdent et la suivent ?

4. COMPORTEMENT ATTENDU (Impact Mapping — niveau "How / Impact")
   Quel changement de comportement utilisateur veut-on rendre possible ?
   (Pas la solution technique, le comportement observable)

5. HYPOTHÈSE / IMPACT ATTENDU
   Pourquoi ce comportement améliorerait l'objectif produit ?
   Quelle hypothèse veut-on valider ?

6. USER STORY (carte — 3C "Card")
   En tant que [acteur précis],
   je veux [comportement observable],
   afin de [bénéfice utilisateur, lié à l'objectif].

7. CRITÈRES D'ACCEPTATION (3C "Confirmation" + BDD)
   Au format Gherkin :
   Scenario: [titre du cas]
     Étant donné [contexte initial]
     Quand [action déclenchante]
     Alors [résultat observable]

   Couvrir au minimum :
   - 1 cas nominal
   - 1 cas limite ou variation
   - 1 cas d'erreur

8. EXEMPLES CONCRETS (Specification by Example)
   Données réalistes pour lever toute ambiguïté.

9. HORS PÉRIMÈTRE
   Ce que cette US ne couvre PAS (évite le scope creep).

10. NOTES TECHNIQUES (optionnel, à part)
    Indications éventuelles pour l'implémentation, séparées de l'US elle-même.
```

## Méthode de transformation : demande technique → US

Quand l'utilisateur arrive avec une demande technique (« il faut une table », « il faut un endpoint », « il faut un bouton »), guide-le avec ces questions :

1. **Pourquoi faut-il faire ça ?** (objectif)
2. **Qui en a besoin ?** (acteur)
3. **À quel moment du parcours ?** (contexte)
4. **Quel comportement utilisateur deviendrait possible ?** (impact)
5. **Comment saura-t-on que ça fonctionne ?** (critères d'acceptation)

Puis propose une reformulation centrée sur le comportement utilisateur.

## Règles de découpage

Une US doit être implémentable en quelques heures à 1 jour. Pour la découper, on peut séparer selon :
- ✅ Acteur ou objectif
- ✅ Règle métier
- ✅ Cas nominal / cas d'erreur
- ✅ Variation du parcours
- ✅ Niveau de confort ou d'automatisation

On ne découpe **JAMAIS** par :
- ❌ Table de base de données
- ❌ Endpoint API
- ❌ Classe ou module
- ❌ Framework ou techno
- ❌ Couche technique (front/back/db)

## Format de sortie attendu

### Mode "évaluation" (l'utilisateur soumet une US existante)

```
## Analyse de votre user story

[Reformulation propre de l'US soumise]

### Score sur la checklist

| Critère | Statut | Commentaire |
|---|---|---|
| Acteur | ✅ / ⚠️ / ❌ | ... |
| Objectif | ✅ / ⚠️ / ❌ | ... |
| Observable | ✅ / ⚠️ / ❌ | ... |
| Testable | ✅ / ⚠️ / ❌ | ... |
| Découpée | ✅ / ⚠️ / ❌ | ... |
| Non technique | ✅ / ⚠️ / ❌ | ... |
| Parcours | ✅ / ⚠️ / ❌ | ... |
| Impact | ✅ / ⚠️ / ❌ | ... |

### Anti-patterns détectés
[Liste des problèmes identifiés]

### Reformulation proposée
[US réécrite + critères d'acceptation Gherkin]

### Questions pour clarifier
[Questions à poser à l'utilisateur ou au métier]
```

### Mode "rédaction" (l'utilisateur veut créer une US)

Applique le canevas complet en 10 sections. Ne saute aucune étape, même si l'utilisateur n'a pas tout précisé : pose les questions manquantes.

## Adaptation au contexte du projet

Pour ce projet (Quiz Histoire de France), lis d'abord `docs/besoins-métiers/` pour aligner les US avec les objectifs produit déclarés.

Si le projet inclut un fichier `docs/product-objectives.md`, `PRODUCT.md` ou similaire, lis-le également. À défaut, demande à l'utilisateur quel objectif produit cette US sert avant de la formaliser.

### Acteurs connus du projet

| Acteur | Contexte |
|--------|----------|
| `visiteur` | Non authentifié, découverte ou création de compte |
| `hôte de partie` | Vient de créer la partie, dans le lobby |
| `joueur en attente` | Dans le lobby, attend le lancement |
| `joueur en cours de partie` | Pendant le quiz actif |
| `administrateur` | Accès via `x-admin-key`, gestion de la banque de questions |
| `ops` | Déploiement et infrastructure |

## Ressources additionnelles

- `references/checklist.md` : version imprimable de la checklist
- `references/gherkin-template.md` : exemples Gherkin annotés
- `references/anti-patterns.md` : catalogue détaillé des anti-patterns
- `references/example-quiz-projet.md` : exemples appliqués au projet Quiz Histoire de France
