# US-gestion-banque-questions

**En tant qu'** administrateur, je veux pouvoir créer, modifier et supprimer des questions via une API REST, afin de maintenir et enrichir la banque de questions.

## Critères d'acceptation

- Endpoints `GET/POST /questions` et `GET/PUT/DELETE /questions/:id`
- Protégé par header `x-admin-key`
- Validation : 4 choix exactement, `answerIndex` entre 0 et 3, `period` et `difficulty` valides
- Filtre par difficulté et par période via query params

## Statut

✅ Done
