# US-quitter-partie

**En tant que** joueur, je veux pouvoir quitter une partie en cours, afin de ne pas rester bloqué si je dois partir.

## Critères d'acceptation

- Un bouton "✕ Quitter" est visible dans le header de la page de jeu (à côté du compteur de questions)
- Cliquer sur ce bouton ouvre une modale de confirmation (message + boutons "Annuler" / "Quitter")
- Cliquer en dehors de la modale ou sur "Annuler" la ferme sans action
- Confirmer émet `game:leave` via WebSocket, reset le store Zustand et redirige vers `/`
- Le bouton est présent en mode STANDARD et en mode SURVIVAL (tous les joueurs, pas seulement l'hôte)

## Règles métier

- L'événement `game:leave` est géré côté serveur : le joueur est retiré de la salle WS et les autres joueurs reçoivent `game:player-left`
- La partie continue pour les joueurs restants
- En mode SURVIVAL_MULTI, le joueur quittant est compté comme éliminé

## Statut

✅ Done
