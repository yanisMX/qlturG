/**
 * Import scraped questions into the database.
 * Run after scrape-questions.js has produced questions-scraped.json.
 *
 * Usage (from repo root):
 *   node scripts/import-questions.js
 *   node scripts/import-questions.js --dry-run   # preview without writing
 *   node scripts/import-questions.js --clear     # delete existing questions first
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const VALID_PERIODS = [
  'ANTIQUITE_GAULE',
  'MOYEN_AGE',
  'RENAISSANCE_ANCIEN_REGIME',
  'REVOLUTION_EMPIRE',
  'XIXE_SIECLE',
  'GUERRES_MONDIALES',
  'GUERRE_FROIDE_DECOLONISATION',
  'EPOQUE_CONTEMPORAINE',
];
const VALID_DIFFICULTIES = ['FACILE', 'MOYEN', 'DIFFICILE'];

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const clearFirst = args.includes('--clear');

const inputPath = path.join(__dirname, 'questions-scraped.json');
if (!fs.existsSync(inputPath)) {
  console.error('questions-scraped.json not found. Run scrape-questions.js first.');
  process.exit(1);
}

const raw = JSON.parse(fs.readFileSync(inputPath, 'utf8'));

// Validate and clean
let valid = 0;
let invalid = 0;
const cleaned = raw
  .map((q, i) => {
    const errors = [];
    if (!q.text || q.text.length < 10) errors.push('text too short');
    if (!Array.isArray(q.choices) || q.choices.length < 2) errors.push('not enough choices');
    if (typeof q.answerIndex !== 'number' || q.answerIndex < 0 || q.answerIndex >= (q.choices?.length ?? 0))
      errors.push('invalid answerIndex');
    if (!VALID_PERIODS.includes(q.period)) errors.push(`unknown period: ${q.period}`);
    if (!VALID_DIFFICULTIES.includes(q.difficulty)) errors.push(`unknown difficulty: ${q.difficulty}`);

    if (errors.length > 0) {
      console.warn(`  [SKIP] Q${i + 1}: ${errors.join(', ')} — "${q.text?.slice(0, 50)}"`);
      invalid++;
      return null;
    }

    valid++;
    return {
      text: q.text.trim(),
      choices: q.choices.slice(0, 4).map((c) => c.trim()),
      answerIndex: q.answerIndex,
      explanation: (q.explanation || `Bonne réponse : ${q.choices[q.answerIndex]}`).trim(),
      period: q.period,
      difficulty: q.difficulty,
    };
  })
  .filter(Boolean);

console.log(`\nValidation: ${valid} valid, ${invalid} skipped`);

if (dryRun) {
  console.log('\n[DRY RUN] First 3 questions:');
  cleaned.slice(0, 3).forEach((q, i) => {
    console.log(`\n  Q${i + 1}: ${q.text}`);
    q.choices.forEach((c, j) => console.log(`    ${j === q.answerIndex ? '✓' : ' '} ${c}`));
    console.log(`  Period: ${q.period} | Difficulty: ${q.difficulty}`);
  });
  console.log('\nRun without --dry-run to import.');
  process.exit(0);
}

if (cleaned.length === 0) {
  console.error('No valid questions to import.');
  process.exit(1);
}

// Generate a temporary seed file that imports only the scraped questions
const seedContent = `
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const questions = ${JSON.stringify(cleaned, null, 2)};
async function main() {
  ${clearFirst ? 'await prisma.question.deleteMany(); console.log("Cleared existing questions.");' : ''}
  for (const q of questions) {
    await prisma.question.create({ data: q });
  }
  console.log('Imported ' + questions.length + ' questions.');
}
main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
`;

const tmpSeed = path.join(__dirname, '_tmp_import.js');
fs.writeFileSync(tmpSeed, seedContent);

const apiDir = path.join(__dirname, '..', 'apps', 'api');
const nodeModulesPath = path.join(apiDir, 'node_modules');

try {
  console.log(`\nImporting ${cleaned.length} questions...`);
  execSync(`node ${tmpSeed}`, {
    cwd: apiDir,
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_PATH: nodeModulesPath,
    },
  });
} catch (err) {
  console.error('Import failed:', err.message);
  fs.unlinkSync(tmpSeed);
  process.exit(1);
}

fs.unlinkSync(tmpSeed);
console.log('Done.');
