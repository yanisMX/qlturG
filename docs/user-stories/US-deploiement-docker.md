# US-deploiement-docker

**En tant qu'** ops, je veux pouvoir lancer toute la stack via Docker Compose, afin de simplifier le déploiement en production.

## Critères d'acceptation

- `docker-compose up` lance postgres, api et web
- Dockerfiles pour api (Node) et web (Nginx)
- Variables d'environnement configurables via `.env`
- Port postgres Docker : 5433 (évite conflit avec Homebrew sur 5432)

## Statut

📋 Backlog — Dockerfiles créés, non testé end-to-end
