import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { QuestionsModule } from './questions/questions.module';
import { GamesModule } from './games/games.module';

@Module({
  imports: [PrismaModule, QuestionsModule, GamesModule],
})
export class AppModule {}
