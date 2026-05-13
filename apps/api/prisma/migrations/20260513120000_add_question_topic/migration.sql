-- CreateEnum
CREATE TYPE "Topic" AS ENUM ('HISTOIRE', 'GEOGRAPHIE', 'GEOPOLITIQUE', 'CINEMA', 'PHILOSOPHIE', 'LITTERATURE');

-- AlterTable: add topic column with default
ALTER TABLE "Question" ADD COLUMN "topic" "Topic" NOT NULL DEFAULT 'HISTOIRE';

-- Deduplicate questions before adding unique constraint (keep oldest row per text)
DELETE FROM "Question" q1
USING "Question" q2
WHERE q1."id" > q2."id"
  AND q1."text" = q2."text";

-- Add unique constraint on text (used as upsert key in seed)
ALTER TABLE "Question" ADD CONSTRAINT "Question_text_key" UNIQUE ("text");
