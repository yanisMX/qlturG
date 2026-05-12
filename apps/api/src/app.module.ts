import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { QuestionsModule } from './questions/questions.module';
import { GamesModule } from './games/games.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [PrismaModule, QuestionsModule, GamesModule, AuthModule],
})
export class AppModule {}
