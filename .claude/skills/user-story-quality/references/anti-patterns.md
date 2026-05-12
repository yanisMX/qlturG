# Catalogue des anti-patterns d'user stories

## 1. Le zombie template

**Symptôme** : le format `En tant que / je veux / afin de` est respecté mais l'US ne dit rien d'utile.

❌ « En tant qu'utilisateur, je veux cliquer sur un bouton, afin de cliquer sur un bouton »
❌ « En tant qu'utilisateur, je veux que mes données soient sauvegardées en PostgreSQL, afin qu'elles soient persistées »

**Diagnostic** : remplacer mécaniquement le template ne suffit pas. Toujours se demander : *quel changement de comportement réel veut-on rendre possible ?*

## 2. Le découpage horizontal (par couche technique)

**Symptôme** : les US correspondent à des couches techniques au lieu de tranches de valeur utilisateur.

❌ US 1 : « Créer la table cart_items »
❌ US 2 : « Créer l'endpoint POST /cart/items »
❌ US 3 : « Créer le composant React CartItem »

**Diagnostic** : aucune de ces US ne livre seule un comportement utilisateur observable. Refondre en US verticale :

✅ « En tant que client, je veux ajouter un produit disponible à mon panier, afin de le commander plus tard » (traverse UI + API + DB en une seule US).

## 3. L'US fourre-tout (trop large)

**Symptôme** : un seul énoncé qui cache plusieurs comportements distincts.

❌ « En tant que client, je veux gérer mon panier »

**Diagnostic** : « gérer » est un mot-valise. Découper en US atomiques :
- ajouter un produit
- modifier la quantité
- supprimer un produit
- retrouver mon panier après reconnexion
- vider mon panier

## 4. L'acteur générique

**Symptôme** : « utilisateur » sans précision de rôle ni de contexte.

❌ « En tant qu'utilisateur, je veux voir le score »

**Diagnostic** : qui ? quel rôle, dans quelle phase du parcours ? Préciser :
✅ « En tant que joueur dans une partie en cours »
✅ « En tant qu'hôte attendant le démarrage »
✅ « En tant que spectateur d'une partie finie »

Chaque acteur a des besoins différents et probablement des US différentes.

## 5. La solution déguisée en besoin

**Symptôme** : l'US contient déjà la solution UI/technique au lieu du besoin.

❌ « En tant que joueur, je veux un bouton "Copier le lien" »
❌ « En tant qu'admin, je veux une popup modale pour confirmer »

**Diagnostic** : la solution (bouton, popup) est dans l'énoncé. Reformuler en besoin :
✅ « En tant qu'hôte, je veux partager facilement l'accès à ma partie, afin d'inviter mes amis en quelques secondes »

La solution sera décidée pendant la conception.

## 6. Le critère d'acceptation subjectif

**Symptôme** : critères non testables car ils font appel à un jugement personnel.

❌ « L'interface doit paraître moderne »
❌ « L'expérience doit être fluide »
❌ « Le design doit être premium »

**Diagnostic** : reformuler en comportement observable mesurable :
✅ « Les transitions de page ne dépassent pas 300ms »
✅ « Le timer change de couleur à 6s puis 3s »
✅ « Le bouton hover déclenche une élévation visible »

## 7. L'US sans objectif identifiable

**Symptôme** : le « afin de » est faible, tautologique ou absent.

❌ « ... afin d'améliorer l'expérience »
❌ « ... afin que ce soit mieux »
❌ « ... afin que ça marche »

**Diagnostic** : reformuler en bénéfice utilisateur concret ou en lien avec un objectif produit :
✅ « ... afin de retrouver ma progression sans recommencer »
✅ « ... afin de ne pas attendre le résultat des autres joueurs »
✅ « ... afin d'inviter mes amis sans leur dicter un code par téléphone »

## 8. Le Then qui regarde sous le capot

**Symptôme** : les critères d'acceptation valident des éléments internes invisibles à l'utilisateur.

❌ « Alors une ligne est insérée dans la table games »
❌ « Alors l'API retourne un code HTTP 201 »
❌ « Alors le state Zustand est mis à jour »

**Diagnostic** : remplacer par un effet observable côté utilisateur :
✅ « Alors je vois ma partie nouvellement créée dans la liste »
✅ « Alors je suis redirigé vers la salle d'attente avec le code affiché »

## 9. L'US sans cas d'erreur

**Symptôme** : seul le happy path est décrit, aucun scénario d'erreur ou de cas limite.

❌ Une seule US « rejoindre une partie » avec un seul scénario « le joueur entre le code et rejoint ».

**Diagnostic** : ajouter au moins :
- 1 cas nominal
- 1 cas limite (que se passe-t-il si la partie a déjà démarré ? si elle est pleine ?)
- 1 cas d'erreur (code invalide, partie inexistante, connexion perdue)

## 10. L'US qui dure 3 jours

**Symptôme** : trop grosse pour être livrée rapidement.

**Diagnostic** : si l'estimation dépasse 1 jour, redécouper en sous-US. Stratégies de découpage :
- Par cas d'usage (nominal / variation / erreur)
- Par règle métier
- Par niveau de confort (version minimale puis raffinement)
- Par variation de parcours
- Par acteur

Ne découpe **jamais** par couche technique.

## 11. L'US qui ne sert aucun objectif produit

**Symptôme** : impossible de relier l'US à un objectif business mesurable.

❌ « En tant qu'admin, je veux pouvoir exporter les logs au format XML »
(Pour quel objectif ? Quel acteur en bénéficie réellement ? Quel impact mesurable ?)

**Diagnostic** : remonter à l'Impact Mapping. Si on ne peut pas répondre à « cette US sert quel objectif produit », elle ne devrait pas être prioritaire.

## 12. La fausse US (qui est en fait un epic)

**Symptôme** : énoncé qui couvre tout un module ou un parcours complet.

❌ « En tant qu'utilisateur, je veux pouvoir m'authentifier »
❌ « En tant que joueur, je veux pouvoir jouer à des quiz »

**Diagnostic** : c'est un epic, à décliner en US :
- s'inscrire avec email + mot de passe
- se connecter avec email + mot de passe
- réinitialiser son mot de passe oublié
- se connecter avec Google OAuth
- se déconnecter
- supprimer son compte
- ...
