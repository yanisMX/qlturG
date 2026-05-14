import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';
import { QuestionsModule } from './questions/questions.module';
import { GamesModule } from './games/games.module';
import { AuthModule } from './auth/auth.module';
import { LeaderboardModule } from './leaderboard/leaderboard.module';
import { UploadModule } from './upload/upload.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    PrismaModule,
    QuestionsModule,
    GamesModule,
    AuthModule,
    LeaderboardModule,
    UploadModule,
  ],
})
export class AppModule {}
