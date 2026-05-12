/**
 * Scraper multi-sources pour questions de quiz histoire de France.
 * Sources : histoire-france.net (SPA → Playwright) + Wikipedia FR (HTML statique → fetch)
 *
 * Usage:
 *   node scripts/scrape-questions.js
 *
 * Output: scripts/questions-scraped.json
 */

const { chromium } = require('playwright');
const https = require('https');
const fs = require('fs');
const path = require('path');

// ─── Sources histoire-france.net (Playwright, SPA) ───────────────────────────
const HF_ARTICLES = [
  { url: 'https://www.histoire-france.net/moyen/clovis-ier',         period: 'MOYEN_AGE',                    subject: 'Clovis' },
  { url: 'https://www.histoire-france.net/moyen/charlemagne',        period: 'MOYEN_AGE',                    subject: 'Charlemagne' },
  { url: 'https://www.histoire-france.net/moyen/saint-louis',        period: 'MOYEN_AGE',                    subject: 'Saint Louis' },
  { url: 'https://www.histoire-france.net/moyen/jeanne-darc',        period: 'MOYEN_AGE',                    subject: "Jeanne d'Arc" },
  { url: 'https://www.histoire-france.net/moyen/guerre-cent-ans',    period: 'MOYEN_AGE',                    subject: null },
  { url: 'https://www.histoire-france.net/moyen/cathares',           period: 'MOYEN_AGE',                    subject: 'les Cathares' },
  { url: 'https://www.histoire-france.net/temps/francois-ier',       period: 'RENAISSANCE_ANCIEN_REGIME',    subject: 'François Ier' },
  { url: 'https://www.histoire-france.net/temps/guerres-religion',   period: 'RENAISSANCE_ANCIEN_REGIME',    subject: null },
  { url: 'https://www.histoire-france.net/temps/henri4',             period: 'RENAISSANCE_ANCIEN_REGIME',    subject: 'Henri IV' },
  { url: 'https://www.histoire-france.net/epoque/napoleon-ier',      period: 'REVOLUTION_EMPIRE',            subject: 'Napoléon Ier' },
  { url: 'https://www.histoire-france.net/epoque/revolution-francaise', period: 'REVOLUTION_EMPIRE',         subject: null },
  { url: 'https://www.histoire-france.net/epoque/batailles-napoleoniennes', period: 'REVOLUTION_EMPIRE',    subject: null },
];

// ─── Sources Wikipedia FR (fetch direct, HTML statique) ──────────────────────
const WIKI_ARTICLES = [
  // XIXe siècle / Industrialisation
  { slug: 'Révolution_industrielle_en_France',               period: 'XIXE_SIECLE',                  subject: null },
  { slug: 'Commune_de_Paris_(1871)',                          period: 'XIXE_SIECLE',                  subject: null },
  { slug: 'Affaire_Dreyfus',                                  period: 'XIXE_SIECLE',                  subject: null },
  { slug: 'Second_Empire',                                    period: 'XIXE_SIECLE',                  subject: null },
  { slug: 'Guerre_franco-prussienne_de_1870',                 period: 'XIXE_SIECLE',                  subject: null },
  // Guerres mondiales — WWI
  { slug: 'Première_Guerre_mondiale',                         period: 'GUERRES_MONDIALES',             subject: null },
  { slug: 'Bataille_de_Verdun',                               period: 'GUERRES_MONDIALES',             subject: null },
  { slug: 'Guerre_de_tranchées',                              period: 'GUERRES_MONDIALES',             subject: null },
  { slug: 'Armistice_du_11_novembre_1918',                    period: 'GUERRES_MONDIALES',             subject: null },
  { slug: 'Traité_de_Versailles_(1919)',                      period: 'GUERRES_MONDIALES',             subject: null },
  { slug: 'Bataille_de_la_Marne_(1914)',                      period: 'GUERRES_MONDIALES',             subject: null },
  { slug: 'Ferdinand_Foch',                                   period: 'GUERRES_MONDIALES',             subject: 'Ferdinand Foch' },
  // Guerres mondiales — entre-deux-guerres
  { slug: 'Front_populaire_(France)',                         period: 'GUERRES_MONDIALES',             subject: null },
  { slug: 'Crise_économique_de_1929_en_France',               period: 'GUERRES_MONDIALES',             subject: null },
  // Guerres mondiales — WWII
  { slug: 'Seconde_Guerre_mondiale',                          period: 'GUERRES_MONDIALES',             subject: null },
  { slug: 'Appel_du_18_Juin',                                 period: 'GUERRES_MONDIALES',             subject: 'Charles de Gaulle' },
  { slug: 'Régime_de_Vichy',                                  period: 'GUERRES_MONDIALES',             subject: null },
  { slug: 'Débarquement_de_Normandie',                        period: 'GUERRES_MONDIALES',             subject: null },
  { slug: 'Libération_de_Paris',                              period: 'GUERRES_MONDIALES',             subject: null },
  { slug: 'Jean_Moulin',                                      period: 'GUERRES_MONDIALES',             subject: 'Jean Moulin' },
  { slug: 'Philippe_Pétain',                                  period: 'GUERRES_MONDIALES',             subject: 'Philippe Pétain' },
  { slug: 'Résistance_intérieure_française',                  period: 'GUERRES_MONDIALES',             subject: null },
  { slug: 'Bataille_de_la_Somme',                             period: 'GUERRES_MONDIALES',             subject: null },
  { slug: 'Débarquement_en_Provence',                         period: 'GUERRES_MONDIALES',             subject: null },
  { slug: 'Occupation_de_la_France_pendant_la_Seconde_Guerre_mondiale', period: 'GUERRES_MONDIALES',  subject: null },
  // Guerre froide / Décolonisation
  { slug: 'Guerre_d%27Algérie',                               period: 'GUERRE_FROIDE_DECOLONISATION',  subject: null },
  { slug: 'Cinquième_République_(France)',                     period: 'GUERRE_FROIDE_DECOLONISATION',  subject: null },
  { slug: 'Mai_68',                                           period: 'GUERRE_FROIDE_DECOLONISATION',  subject: null },
  { slug: 'Guerre_d%27Indochine',                             period: 'GUERRE_FROIDE_DECOLONISATION',  subject: null },
  { slug: 'Charles_de_Gaulle',                                period: 'GUERRE_FROIDE_DECOLONISATION',  subject: 'Charles de Gaulle' },
  { slug: 'Décolonisation',                                   period: 'GUERRE_FROIDE_DECOLONISATION',  subject: null },
  { slug: 'Trente_Glorieuses',                                period: 'GUERRE_FROIDE_DECOLONISATION',  subject: null },
  // Époque contemporaine
  { slug: 'Construction_européenne',                          period: 'EPOQUE_CONTEMPORAINE',          subject: null },
  { slug: 'Attentats_du_13_novembre_2015_en_France',          period: 'EPOQUE_CONTEMPORAINE',          subject: null },
  { slug: 'Traité_de_Maastricht',                             period: 'EPOQUE_CONTEMPORAINE',          subject: null },
  { slug: 'Chute_du_mur_de_Berlin',                           period: 'EPOQUE_CONTEMPORAINE',          subject: null },
  { slug: 'François_Mitterrand',                              period: 'EPOQUE_CONTEMPORAINE',          subject: 'François Mitterrand' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STOP_WORDS = new Set([
  'Le','La','Les','Un','Une','Des','Du','En','Au','Aux','Ce','Cet','Cette','Ces',
  'Mon','Son','Sa','Ses','Mais','Donc','Car','Avec','Sans','Pour','Par','Sur','Sous',
  'France','Europe','Paris','Dieu','Eglise','Roi','Reine','État','Pays','Ville',
]);

function generateWrongYears(year) {
  const candidates = [];
  const spreads = [3,7,12,18,25,35,50,75,100].filter((s) => year + s <= 2026 && year - s > 0);
  const used = new Set([year]);
  for (const s of shuffle(spreads)) {
    for (const c of shuffle([year + s, year - s])) {
      const cs = String(c);
      if (!used.has(cs) && c > 0 && c <= 2026) {
        candidates.push(cs);
        used.add(cs);
      }
      if (candidates.length === 3) return candidates;
    }
  }
  return candidates;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function difficultyFromYear(y) {
  if (y < 1000) return 'DIFFICILE';
  if (y < 1600) return 'MOYEN';
  if (y < 1900) return 'MOYEN';
  return 'FACILE';
}

// ─── Extraction de questions depuis des paragraphes ───────────────────────────

const NAMED_SUBJECT_AFTER_YEAR =
  /[Ee]n (\d{3,4})\s*(?:ap\.\s*J\.-C\.\s*)?,\s+([A-ZÀ-Ÿ][a-zà-ÿ]+(?:[-\s][A-ZÀ-Ÿ]?[a-zà-ÿ]+){0,3})\s+((?:est|fut|devient|naît|monte|prend|signe|remporte|bat|conquiert|fonde|crée|construit|meurt|décède|abdique|couronne|sacre|épouse|s'empare|lance|déclare|envahit|libère|capitule|publie|adopte|promulgue|vote|ratifie)[^,\.]{0,100})/i;

const SUBJECT_THEN_YEAR =
  /([A-ZÀ-Ÿ][a-zà-ÿ]+(?:[-\s][A-ZÀ-Ÿ]?[a-zà-ÿ]+){0,3})\s+((?:mourut|naquit|devint|monta|prit|signa|remporta|créa|construisit|fonda|abdiqua|fut couronné|fut sacré|fut assassiné|fut arrêté|fut capturé|se rendit|capitula|publia|adopta|promulgua|vota|ratifia)[^,\.]{0,80})\s+en\s+(\d{3,4})/i;

const PRONOUN_WITH_YEAR =
  /[Ee]n (\d{3,4})\s*(?:ap\.\s*J\.-C\.\s*)?,\s+(?:il|elle|la France|l['\s]armée|le gouvernement|le régime)\s+((?:est|fut|devient|naît|monte|prend|signe|remporte|bat|conquiert|fonde|crée|construit|meurt|décède|abdique|couronne|sacre|épouse|s'empare|lance|déclare|envahit|libère|capitule|publie|adopte|promulgue|vote|ratifie)[^,\.]{0,100})/i;

// Patterns spécifiques style Wikipedia
// Ex : "La bataille de Verdun s'est déroulée en 1916"
const WIKI_EVENT_YEAR =
  /([A-ZÀ-Ÿ][a-zà-ÿ\s]{5,50}(?:bataille|guerre|armistice|traité|accord|révolution|débarquement|siège|offensive|capitulation|armée|insurrection|révolte|loi|décret|accord|constitution)[a-zà-ÿ\s]{0,30})\s+(?:s'est\s+)?(?:déroulée?|signé?|adoptée?|proclamée?|débutée?|achevée?|eu lieu|ratifié?|promulguée?)\s+(?:le\s+\d+\s+\w+\s+)?en\s+(\d{4})/i;

// Ex : "En 1914, l'Allemagne déclara la guerre à la France"
const WIKI_YEAR_COUNTRY =
  /[Ee]n (\d{4}),\s+((?:l[ae']|les)\s+[A-ZÀ-Ÿ][a-zà-ÿ]+(?:\s+[a-zà-ÿ]+){0,3})\s+((?:déclara|signa|adopta|promulgua|lança|envahit|capitula|libéra|créa|fonda|vota|ratifia|remporta|perdit|reprit)[^,\.]{0,100})/i;

function extractQuestions(paragraphs, period, articleSubject) {
  const questions = [];

  for (const para of paragraphs) {
    // Pattern 1 : "En [year], [ProperNoun] [verb]..."
    const m1 = para.match(NAMED_SUBJECT_AFTER_YEAR);
    if (m1) {
      const [, year, subject, action] = m1;
      const y = parseInt(year);
      if (y >= 400 && y <= 2025 && !STOP_WORDS.has(subject)) {
        const wrongs = generateWrongYears(y);
        if (wrongs.length === 3) {
          const choices = shuffle([year, ...wrongs]);
          questions.push({
            text: `En quelle année ${subject} ${action.trim().replace(/\s+/g, ' ')} ?`,
            choices,
            answerIndex: choices.indexOf(year),
            explanation: para.slice(0, 300),
            period,
            difficulty: difficultyFromYear(y),
          });
          continue;
        }
      }
    }

    // Pattern 2 : "[ProperNoun] [verb-passé] en [year]"
    const m2 = para.match(SUBJECT_THEN_YEAR);
    if (m2) {
      const [, subject, action, year] = m2;
      const y = parseInt(year);
      if (y >= 400 && y <= 2025 && !STOP_WORDS.has(subject)) {
        const wrongs = generateWrongYears(y);
        if (wrongs.length === 3) {
          const choices = shuffle([year, ...wrongs]);
          questions.push({
            text: `En quelle année ${subject} ${action.trim()} ?`,
            choices,
            answerIndex: choices.indexOf(year),
            explanation: para.slice(0, 300),
            period,
            difficulty: difficultyFromYear(y),
          });
          continue;
        }
      }
    }

    // Pattern 3 : pronom avec sujet de l'article comme contexte
    if (articleSubject) {
      const m3 = para.match(PRONOUN_WITH_YEAR);
      if (m3) {
        const [, year, action] = m3;
        const y = parseInt(year);
        if (y >= 400 && y <= 2025) {
          const wrongs = generateWrongYears(y);
          if (wrongs.length === 3) {
            const choices = shuffle([year, ...wrongs]);
            questions.push({
              text: `En quelle année ${articleSubject} ${action.trim()} ?`,
              choices,
              answerIndex: choices.indexOf(year),
              explanation: para.slice(0, 300),
              period,
              difficulty: difficultyFromYear(y),
            });
          }
        }
      }
    }

    // Pattern 4 : style Wikipedia — "[événement] s'est déroulé en [year]"
    const m4 = para.match(WIKI_EVENT_YEAR);
    if (m4) {
      const [, event, year] = m4;
      const y = parseInt(year);
      if (y >= 1789 && y <= 2025) {
        const wrongs = generateWrongYears(y);
        if (wrongs.length === 3) {
          const choices = shuffle([year, ...wrongs]);
          const label = event.trim().replace(/\s+/g, ' ');
          questions.push({
            text: `En quelle année ${label.charAt(0).toLowerCase() + label.slice(1)} a-t-elle eu lieu ?`,
            choices,
            answerIndex: choices.indexOf(year),
            explanation: para.slice(0, 300),
            period,
            difficulty: difficultyFromYear(y),
          });
        }
      }
    }

    // Pattern 5 : style Wikipedia — "En [year], [pays/armée] [verbe]..."
    const m5 = para.match(WIKI_YEAR_COUNTRY);
    if (m5) {
      const [, year, subject, action] = m5;
      const y = parseInt(year);
      if (y >= 1789 && y <= 2025) {
        const wrongs = generateWrongYears(y);
        if (wrongs.length === 3) {
          const choices = shuffle([year, ...wrongs]);
          questions.push({
            text: `En quelle année ${subject.trim()} ${action.trim()} ?`,
            choices,
            answerIndex: choices.indexOf(year),
            explanation: para.slice(0, 300),
            period,
            difficulty: difficultyFromYear(y),
          });
        }
      }
    }
  }

  return questions;
}

// ─── Fetch Wikipedia ──────────────────────────────────────────────────────────

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; quiz-scraper/1.0)' } }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return fetchUrl(res.headers.location).then(resolve).catch(reject);
      }
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    req.setTimeout(15000, () => { req.destroy(); reject(new Error('timeout')); });
  });
}

function stripHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\[[\d,\s]+\]/g, '')         // [1], [2] footnotes texte
    .replace(/&#\d+;/g, ' ')              // &#160; &#91; etc.
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/«\s*|\s*»/g, '"')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function extractWikipediaParagraphs(html) {
  const pMatches = html.match(/<p[^>]*>([\s\S]*?)<\/p>/g) || [];
  return pMatches
    .map((p) => stripHtml(p))
    .filter((t) => t.length > 80 && !/^\s*\(/.test(t));
}

async function scrapeWikipedia(slug, period, subject) {
  const url = `https://fr.wikipedia.org/wiki/${slug}`;
  try {
    const html = await fetchUrl(url);
    const paragraphs = extractWikipediaParagraphs(html);
    return extractQuestions(paragraphs, period, subject);
  } catch (err) {
    console.warn(`  Wikipedia fetch error for ${slug}: ${err.message}`);
    return [];
  }
}

// ─── Scrape histoire-france.net via Playwright ────────────────────────────────

async function acceptCookies(page) {
  try {
    const btn = await page.waitForSelector(
      'button:has-text("Autoriser"), button:has-text("Accepter"), button:has-text("OK")',
      { timeout: 4000 }
    );
    await btn.click();
    await page.waitForTimeout(800);
  } catch { /* no dialog */ }
}

async function scrapeHF(page, url, period, subject) {
  await page.goto(url, { waitUntil: 'networkidle', timeout: 20000 });
  await acceptCookies(page);
  await page.waitForTimeout(400);

  const paragraphs = await page.$$eval(
    'article p, main p, .content p, [class*="article"] p, [class*="content"] p',
    (els) => els.map((el) => el.innerText.trim()).filter((t) => t.length > 40)
  );

  return extractQuestions(paragraphs, period, subject);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const allQuestions = [];

  // 1. histoire-france.net via Playwright
  console.log('=== histoire-france.net (Playwright) ===');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  console.log('Accepting cookies...');
  await page.goto('https://www.histoire-france.net/', { waitUntil: 'networkidle', timeout: 20000 });
  await acceptCookies(page);

  for (const { url, period, subject } of HF_ARTICLES) {
    const label = url.split('/').slice(-2).join('/');
    process.stdout.write(`  ${label} … `);
    try {
      const qs = await scrapeHF(page, url, period, subject);
      console.log(`${qs.length} questions`);
      allQuestions.push(...qs);
    } catch (err) {
      console.log(`erreur: ${err.message}`);
    }
  }

  await browser.close();

  // 2. Wikipedia FR via HTTP direct
  console.log('\n=== Wikipedia FR (HTTP) ===');
  for (const { slug, period, subject } of WIKI_ARTICLES) {
    process.stdout.write(`  ${decodeURIComponent(slug).slice(0, 40).padEnd(42)} … `);
    const qs = await scrapeWikipedia(slug, period, subject);
    console.log(`${qs.length} questions`);
    allQuestions.push(...qs);
    await new Promise((r) => setTimeout(r, 300)); // respectful delay
  }

  // 3. Dedup + quality filter
  const seen = new Set();
  const unique = allQuestions.filter((q) => {
    const key = q.text.toLowerCase().replace(/\s+/g, ' ');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const filtered = unique.filter((q) => {
    const t = q.text;
    const words = t.split(' ');
    const hasNamed = words.some((w) => /^[A-ZÀ-Ÿ]/.test(w) && w.length > 2 && !STOP_WORDS.has(w));
    const hasYear = q.choices.some((c) => /^\d{3,4}$/.test(c));
    // Reject obviously broken fragments (too short, HTML entities leftover, no real verb)
    const notBroken = t.length > 30 && !t.includes('&#') && !t.includes('  ');
    const hasVerb = /\b(est|fut|devient|naît|monte|prend|signe|remporte|bat|crée|meurt|décède|abdique|fonda|créa|signa|mourut|devint|lança|déclara|adopta|promulgua|vota|ratifia|capitula|libéra|remporta|perdit|reprit|déroulée?|signé?|proclamée?|débutée?|achevée?|élu|créée?|intégrée?|séparée?)\b/i.test(t);
    return hasNamed && hasYear && notBroken && hasVerb && q.answerIndex >= 0;
  });

  const outputPath = path.join(__dirname, 'questions-scraped.json');
  fs.writeFileSync(outputPath, JSON.stringify(filtered, null, 2), 'utf8');

  // Stats per period
  const byPeriod = {};
  for (const q of filtered) byPeriod[q.period] = (byPeriod[q.period] || 0) + 1;

  console.log(`\n✓ ${filtered.length} questions sauvegardées (${unique.length - filtered.length} filtrées)`);
  console.log('\nPar période :');
  for (const [p, n] of Object.entries(byPeriod)) console.log(`  ${p.padEnd(35)} ${n}`);

  console.log('\nProchaines étapes :');
  console.log('  open scripts/questions-scraped.json  # réviser / supprimer les mauvaises');
  console.log('  pnpm import-questions:dry             # prévisualiser');
  console.log('  pnpm import-questions                 # importer en DB');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
