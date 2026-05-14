-- CreateEnum
CREATE TYPE "GameMode" AS ENUM ('STANDARD', 'SURVIVAL_SOLO', 'SURVIVAL_MULTI');

-- AlterEnum
ALTER TYPE "Difficulty" ADD VALUE 'VARIE';

-- AlterTable
ALTER TABLE "Game" ADD COLUMN     "doublePointsBonus" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "gameMode" "GameMode" NOT NULL DEFAULT 'STANDARD',
ADD COLUMN     "questionDuration" INTEGER NOT NULL DEFAULT 10;

-- AlterTable
ALTER TABLE "Player" ADD COLUMN     "eliminated" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lives" INTEGER NOT NULL DEFAULT 3;
