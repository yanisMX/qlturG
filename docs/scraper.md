# Scraper de questions — Histoire de France Quiz

Pipeline pour enrichir la base de questions sans consommer de tokens Claude.

## Vue d'ensemble

Deux sources sont combinées :

| Source | Méthode | Périodes couvertes |
|---|---|---|
| `histoire-france.net` | Playwright (rendu JS) | Moyen Âge, Renaissance, Révolution/Empire |
| `Wikipedia FR` | HTTP direct (HTML statique) | Toutes périodes, surtout XIXe–XXe |

Le scraper extrait des phrases factuelles et les transforme en QCM de type **"En quelle année [sujet] [action] ?"** avec 4 choix dont 3 leurres générés automatiquement.

---

## Commandes

```bash
# 1. Scraper toutes les sources → scripts/questions-scraped.json
pnpm scrape

# 2. Prévisualiser sans écrire en DB
pnpm import-questions:dry

# 3. Importer (ajoute aux questions existantes)
pnpm import-questions

# 4. Remplacer toutes les questions existantes
pnpm import-questions:replace
```

---

## Workflow complet

```
pnpm scrape
    ↓
Réviser scripts/questions-scraped.json
(supprimer les entrées douteuses)
    ↓
pnpm import-questions:dry   (vérifier)
    ↓
pnpm import-questions       (importer)
```

**Règle d'or :** toujours relire le JSON avant d'importer. Le scraper extrait ~50 % de questions directement utilisables — le reste contient des pronoms flottants ("il", "elle") ou des fragments de phrases à supprimer.

---

## Ajouter des sources

### Wikipedia FR

Dans `scripts/scrape-questions.js`, ajouter une entrée dans `WIKI_ARTICLES` :

```js
{ slug: 'Nom_de_l_article_Wikipedia', period: 'GUERRES_MONDIALES', subject: 'Prénom Nom' },
```

- **`slug`** : partie finale de l'URL Wikipedia (`https://fr.wikipedia.org/wiki/<slug>`). Encoder les apostrophes : `Guerre_d%27Algérie`.
- **`period`** : valeur de l'enum Prisma (voir tableau ci-dessous).
- **`subject`** : nom du sujet de l'article (ex. `'Jean Moulin'`), utilisé pour résoudre les pronoms "il/elle". Mettre `null` si l'article n'a pas de sujet unique.

### histoire-france.net

Dans `HF_ARTICLES` :

```js
{ url: 'https://www.histoire-france.net/epoque/premier-empire', period: 'REVOLUTION_EMPIRE', subject: 'Napoléon' },
```

Les URLs disponibles sur le site :

| Section | URLs connues |
|---|---|
| Moyen Âge | `/moyen/clovis-ier`, `/moyen/charlemagne`, `/moyen/saint-louis`, `/moyen/jeanne-darc`, `/moyen/guerre-cent-ans`, `/moyen/cathares`, `/moyen/feodalite` |
| Temps Modernes | `/temps/francois-ier`, `/temps/guerres-religion`, `/temps/henri4`, `/temps/renaissance` |
| Époque Contemporaine | `/epoque/napoleon-ier`, `/epoque/revolution-francaise`, `/epoque/batailles-napoleoniennes` |

---

## Valeurs d'enum `period`

```
ANTIQUITE_GAULE
MOYEN_AGE
RENAISSANCE_ANCIEN_REGIME
REVOLUTION_EMPIRE
XIXE_SIECLE
GUERRES_MONDIALES
GUERRE_FROIDE_DECOLONISATION
EPOQUE_CONTEMPORAINE
```

---

## Identifier une bonne question

**À garder :**
- Sujet explicite et nominatif (`Louis VIII`, `Henri IV`, `François Mitterrand`)
- Date vérifiable et précise
- Phrase complète avec verbe conjugué

**À supprimer :**
- Commence par un pronom (`il`, `elle`, `c'est`) sans sujet résolu
- Texte coupé ou contient des artefacts (`[1]`, `&#160;`, `e République`)
- Hors France (`Mandchourie`, `Italie`, `Allemagne` sans lien direct)
- Anecdotique (`il est nommé sous-préfet de Châteaulin`)

---

## Format du JSON

```json
{
  "text": "En quelle année François Mitterrand est élu président de la République ?",
  "choices": ["2016", "1974", "1981", "1988"],
  "answerIndex": 2,
  "explanation": "En 1981, François Mitterrand est élu...",
  "period": "GUERRE_FROIDE_DECOLONISATION",
  "difficulty": "FACILE"
}
```

- `choices` : exactement 4 valeurs, toutes des années en string
- `answerIndex` : index (0–3) de la bonne réponse dans `choices`
- `difficulty` : `FACILE` | `MOYEN` | `DIFFICILE`

---

## Limites connues

| Limite | Détail |
|---|---|
| Type de question | Uniquement **"En quelle année..."** — pas de "Qui", "Quel monument", "Dans quelle ville" |
| Sources SPA | histoire-france.net nécessite Playwright (Chromium ~90 Mo) |
| Articles Wikipedia complexes | Les pages très narratives (Bataille de Verdun, Débarquement) donnent 0 résultat car les phrases n'ont pas de structure date+sujet+verbe directe |
| Taux d'extraction | ~40–50 % des questions brutes sont utilisables — curation manuelle obligatoire |
| Doublons | L'import **ajoute** aux questions existantes sans déduplication — relancer `pnpm db:seed` + `pnpm import-questions` si besoin de repartir de zéro |

---

## Questions rédigées à la main

Pour les sujets non couverts automatiquement (batailles complexes, personnages, lois…), éditer directement `scripts/questions-scraped.json` avant d'importer :

```json
{
  "text": "Quelle bataille de 1916 symbolise l'hécatombe de la Grande Guerre ?",
  "choices": ["La Marne", "La Somme", "Verdun", "Les Éparges"],
  "answerIndex": 2,
  "explanation": "La bataille de Verdun (février–décembre 1916) fit plus de 700 000 victimes.",
  "period": "GUERRES_MONDIALES",
  "difficulty": "FACILE"
}
```
