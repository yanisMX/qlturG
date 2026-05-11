# US-calcul-score-bonus-rapidite

**En tant que** joueur, je veux que mon score tienne compte de la rapidité de ma réponse si le mode bonus est activé, afin d'être récompensé pour avoir répondu vite et correctement.

## Critères d'acceptation

- Sans bonus : 1 000 pts par bonne réponse, 0 sinon
- Avec bonus : `floor(500 + 500 × (temps_restant_ms / 10 000))` — de 1 000 pts (instantané) à 500 pts (dernière seconde)
- Mauvaise réponse ou absence : 0 pt dans tous les cas
- Calcul effectué côté serveur uniquement (horodatage serveur)

## Statut

✅ Done
