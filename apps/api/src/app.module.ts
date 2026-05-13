import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';
import { QuestionsModule } from './questions/questions.module';
import { GamesModule } from './games/games.module';
import { AuthModule } from './auth/auth.module';
import { LeaderboardModule } from './leaderboard/leaderboard.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    PrismaModule,
    QuestionsModule,
    GamesModule,
    AuthModule,
    LeaderboardModule,
  ],
})
export class AppModule {}
