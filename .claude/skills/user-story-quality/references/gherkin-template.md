# Template Gherkin pour critères d'acceptation

## Structure de base

```gherkin
Feature: [Titre court de la fonctionnalité, côté utilisateur]
  En tant que [acteur]
  Je veux [comportement]
  Afin de [bénéfice]

  Scenario: [Cas nominal — titre descriptif court]
    Étant donné [contexte initial, état du système]
    Et [autre condition initiale si nécessaire]
    Quand [action déclenchante, événement]
    Alors [résultat observable]
    Et [autre résultat observable si nécessaire]

  Scenario: [Cas limite ou variation]
    Étant donné ...
    Quand ...
    Alors ...

  Scenario: [Cas d'erreur ou cas dégradé]
    Étant donné ...
    Quand ...
    Alors ...
```

## Règles d'écriture

### Étant donné (Given)
Décrit l'état initial. Pas d'action utilisateur ici.
✅ « Étant donné que je suis un invité avec un lien de partie valide »
❌ « Étant donné que je clique sur le lien » (c'est une action, donc Quand)

### Quand (When)
Une seule action déclenchante par scénario.
✅ « Quand j'ouvre le lien d'invitation »
❌ « Quand j'ouvre le lien et que je saisis mon pseudo et que je clique sur Rejoindre » (trois actions → trois scénarios distincts ou un scénario plus large)

### Alors (Then)
Décrit un résultat observable de l'extérieur.
✅ « Alors je vois le formulaire de saisie du pseudo pré-rempli avec le code de partie »
❌ « Alors le state Zustand contient le code » (c'est interne, pas observable)

## Exemple complet — US du projet Quiz

```gherkin
Feature: Rejoindre une partie via un lien d'invitation
  En tant qu'invité ayant reçu un lien de partage,
  Je veux rejoindre la salle d'attente en un clic depuis le lien,
  Afin de ne pas avoir à saisir le code manuellement.

  Scenario: Lien valide pointant vers une partie ouverte
    Étant donné qu'une partie au code "A3F9KM" est en statut "LOBBY"
    Et que j'ai reçu le lien "https://app/join?code=A3F9KM"
    Quand j'ouvre ce lien dans mon navigateur
    Alors je vois la page de connexion à la partie
    Et le champ code est pré-rempli avec "A3F9KM"
    Et il ne me reste qu'à saisir mon pseudo

  Scenario: Lien pointant vers une partie déjà terminée
    Étant donné qu'une partie au code "B7X2LP" est en statut "FINISHED"
    Quand j'ouvre le lien "https://app/join?code=B7X2LP"
    Alors je vois un message d'erreur "Cette partie est déjà terminée"
    Et je vois un bouton "Retour à l'accueil"

  Scenario: Lien avec un code inexistant
    Étant donné qu'aucune partie n'a le code "ZZZZZZ"
    Quand j'ouvre le lien "https://app/join?code=ZZZZZZ"
    Alors je vois un message d'erreur "Cette partie n'existe pas"
    Et je vois un bouton "Retour à l'accueil"
```

## Anti-patterns Gherkin

❌ **Le scénario "fourre-tout"** : trop d'étapes, on teste 3 choses en même temps
❌ **Le résultat invisible** : « Alors la donnée est en base » → reformuler en effet observable utilisateur
❌ **L'action dans le Given** : « Étant donné que je clique » → c'est un Quand
❌ **Le Then technique** : « Alors l'API retourne 200 » → préférer « Alors je vois ma partie créée »
❌ **Le scénario sans Then** : pas de vérification = pas de critère
