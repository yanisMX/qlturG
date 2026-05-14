## US — Répartition équitable des questions selon les thèmes sélectionnés

### Contexte
L'utilisateur peut sélectionner :
- un mode de jeu
- un nombre de questions
- un ou plusieurs thèmes

Le système doit garantir une répartition cohérente et équitable des questions entre les thèmes sélectionnés, peu importe le mode de jeu utilisé.

### Objectif
Garantir que les questions générées soient réparties de manière équilibrée entre les thèmes choisis par l'utilisateur.

### Règle métier
Lorsque plusieurs thèmes sont sélectionnés :
- le système doit répartir équitablement les questions entre les thèmes
- chaque thème doit être représenté au minimum par un nombre cohérent de questions
- si la division n'est pas exacte, les questions restantes peuvent être attribuées à n'importe lequel des thèmes sélectionnés

### Exemple concret
Étant donné :
- 4 thèmes sélectionnés
- 10 questions demandées

Alors :
- chaque thème doit apparaître au minimum 2 fois
- les 2 questions restantes peuvent appartenir à n'importe lequel des 4 thèmes

Exemple valide :
- Géographie : 3
- Cinéma : 2
- Géopolitique : 2
- Informatique : 3

Exemple invalide :
- Géographie : 6
- Cinéma : 1
- Géopolitique : 1
- Informatique : 2

### Cas à tester

#### Cas 1 — Répartition multi-thèmes
Étant donné que l'utilisateur sélectionne :
- 4 thèmes
- 10 questions

Quand le quiz est généré,
Alors les questions doivent être réparties équitablement entre les thèmes sélectionnés.

---

#### Cas 2 — Tous les modes de jeu
Étant donné qu'il existe plusieurs modes de jeu,
Quand l'utilisateur lance un quiz avec plusieurs thèmes,
Alors la logique de répartition doit fonctionner de manière identique sur tous les modes de jeu.

---

#### Cas 3 — Vérification des thèmes
Étant donné plusieurs thèmes sélectionnés,
Quand les questions sont affichées,
Alors chaque question doit appartenir à l'un des thèmes choisis,
Et aucune question hors thème ne doit être présente.

### Critères d'acceptation
- La répartition des questions est équilibrée entre les thèmes sélectionnés.
- Aucun thème sélectionné ne doit être ignoré.
- Aucun thème non sélectionné ne doit apparaître.
- La logique fonctionne sur tous les modes de jeu.
- Les tests E2E doivent vérifier :
  - la répartition
  - les catégories des questions
  - le nombre total de questions générées

### Notes techniques
- Implémenter des tests E2E automatisés avec Playwright ou Cypress.
- Vérifier la catégorie de chaque question via :
  - le DOM
  - ou les réponses API
- Prévoir des fixtures stables pour éviter les résultats aléatoires.
