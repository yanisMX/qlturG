# US-amelioration-multijoueur

**En tant que** joueur, je veux une expérience multijoueur plus fluide et sociale, afin de partager facilement une partie et de suivre le classement en temps réel pendant le jeu.

## Critères d'acceptation

### Lien d'invitation dans `/lobby/:code`
- Lien cliquable `${origin}/join?code=CODE` affiché dans un champ lecture seule
- Bouton "Copier" → `navigator.clipboard.writeText` → feedback "✓ Copié !" pendant 2s
- Fallback : sélection automatique du champ si l'API Clipboard est indisponible

### Panneau classement temps réel dans `/play/:code`
- Desktop (≥ md) : panneau droit fixe de 280px, sticky en haut, toujours visible
- Mobile (< md) : classement compact en dessous du plateau de jeu
- Badge animé `+850` (or/vert) par joueur après `game:reveal`, visible pendant la phase révélation

### `/join` — pré-remplissage du code via URL
- `?code=XXXXXX` en query param pré-remplit le champ code au chargement
- Erreur socket `game:error` (partie déjà lancée, code invalide) affichée sous le formulaire

### Tests `<Scoreboard />`
- Tri par score décroissant
- Badge delta affiché quand `revealScores` fourni et `deltaThisRound > 0`
- Joueur courant mis en surbrillance (`myPlayerId`)
- Mode `compact` masque le score numérique

## Statut

✅ Done
