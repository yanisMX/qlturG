import { PrismaClient, Period, Difficulty, Topic } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

const VALID_PERIODS = new Set(Object.values(Period));
const VALID_DIFFICULTIES = new Set(Object.values(Difficulty));
const VALID_TOPICS = new Set(Object.values(Topic));

interface RawQuestion {
  text: string;
  choices: string[];
  answerIndex: number;
  explanation: string;
  period: string;
  difficulty: string;
  topic: string;
}

function validate(q: RawQuestion, source: string): boolean {
  if (!q.text || typeof q.text !== 'string') {
    console.error(`[${source}] Invalid or missing 'text'`);
    return false;
  }
  if (!Array.isArray(q.choices) || q.choices.length !== 4) {
    console.error(`[${source}] "${q.text}" — 'choices' must be an array of exactly 4 strings`);
    return false;
  }
  if (typeof q.answerIndex !== 'number' || q.answerIndex < 0 || q.answerIndex > 3) {
    console.error(`[${source}] "${q.text}" — 'answerIndex' must be 0-3`);
    return false;
  }
  if (!VALID_PERIODS.has(q.period as Period)) {
    console.error(`[${source}] "${q.text}" — invalid period: ${q.period}`);
    return false;
  }
  if (!VALID_DIFFICULTIES.has(q.difficulty as Difficulty)) {
    console.error(`[${source}] "${q.text}" — invalid difficulty: ${q.difficulty}`);
    return false;
  }
  if (!VALID_TOPICS.has(q.topic as Topic)) {
    console.error(`[${source}] "${q.text}" — invalid topic: ${q.topic}`);
    return false;
  }
  return true;
}

function loadQuestionsFromDir(dir: string): RawQuestion[] {
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json'));
  const all: RawQuestion[] = [];

  for (const file of files) {
    const filePath = path.join(dir, file);
    const raw = JSON.parse(fs.readFileSync(filePath, 'utf-8')) as RawQuestion[];

    if (!Array.isArray(raw)) {
      console.error(`[${file}] Root must be a JSON array — skipping file`);
      continue;
    }

    let valid = 0;
    for (const q of raw) {
      if (validate(q, file)) {
        all.push(q);
        valid++;
      }
    }
    console.log(`  ${file}: ${valid}/${raw.length} valid`);
  }

  return all;
}

async function main() {
  const questionsDir = path.join(__dirname, 'questions');
  console.log('Loading questions from', questionsDir);
  const questions = loadQuestionsFromDir(questionsDir);
  console.log(`Total valid questions: ${questions.length}`);

  let upserted = 0;
  for (const q of questions) {
    await prisma.question.upsert({
      where: { text: q.text },
      update: {
        choices: q.choices,
        answerIndex: q.answerIndex,
        explanation: q.explanation,
        period: q.period as Period,
        difficulty: q.difficulty as Difficulty,
        topic: q.topic as Topic,
      },
      create: {
        text: q.text,
        choices: q.choices,
        answerIndex: q.answerIndex,
        explanation: q.explanation,
        period: q.period as Period,
        difficulty: q.difficulty as Difficulty,
        topic: q.topic as Topic,
      },
    });
    upserted++;
  }

  // Stats by topic
  const byTopic: Record<string, number> = {};
  for (const q of questions) {
    byTopic[q.topic] = (byTopic[q.topic] ?? 0) + 1;
  }
  console.log('\nQuestions by topic:');
  for (const [topic, count] of Object.entries(byTopic).sort()) {
    console.log(`  ${topic}: ${count}`);
  }
  console.log(`\nDone — ${upserted} questions upserted`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
