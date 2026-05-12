# Checklist d'une bonne user story

À utiliser comme grille de relecture avant de valider une US.

## Les 8 critères

- [ ] **Orientée acteur** — L'US identifie un acteur précis (pas juste « utilisateur »). Exemples : invité, hôte de partie, joueur en cours, administrateur.
- [ ] **Orientée objectif** — Le « afin de » exprime un bénéfice utilisateur réel, pas une répétition de l'action.
- [ ] **Observable** — Le comportement décrit peut être constaté de l'extérieur, sans regarder le code.
- [ ] **Testable** — On peut écrire au moins 3 critères d'acceptation Gherkin (cas nominal, cas limite, cas d'erreur).
- [ ] **Découpée** — L'US est implémentable en quelques heures à 1 jour. Si plus, redécouper.
- [ ] **Non technique** — Aucune mention de table, endpoint, framework, classe, structure interne dans le titre ou la story.
- [ ] **Inscrite dans un parcours** — On peut situer l'US dans le narratif utilisateur (avant et après).
- [ ] **Reliée à un impact** — L'US contribue à un objectif produit identifiable et mesurable.

## Test rapide

Pose-toi ces 3 questions :

1. **Si je lis l'US sans connaître le code, est-ce que je comprends ce qu'un utilisateur va pouvoir faire de nouveau ?**
2. **Est-ce qu'un testeur métier (non-développeur) peut vérifier que c'est fini ?**
3. **Si je supprime cette US, quel impact business je perds ?**

Si tu réponds non à une de ces questions, retravaille l'US.

## Drapeaux rouges

Si tu vois un de ces signaux, l'US est probablement à reformuler :

- 🚩 Le titre contient un nom technique (« table », « endpoint », « API », « composant »)
- 🚩 L'acteur est « utilisateur » sans précision
- 🚩 Le « afin de » répète l'action (« je veux X afin de X »)
- 🚩 L'US fait plus de 5 lignes de description
- 🚩 Les critères d'acceptation contiennent des mots subjectifs (« moderne », « fluide », « beau »)
- 🚩 L'US ne peut pas être finie en 1 jour
- 🚩 On ne sait pas à quel objectif produit elle sert
