import { Module } from '@nestjs/common';
import { GamesController } from './games.controller';
import { GameService } from './game.service';
import { GameGateway } from './game.gateway';
import { QuestionsModule } from '../questions/questions.module';
import { AuthModule } from '../auth/auth.module';
import { LeaderboardModule } from '../leaderboard/leaderboard.module';

@Module({
  imports: [QuestionsModule, AuthModule, LeaderboardModule],
  controllers: [GamesController],
  providers: [GameService, GameGateway],
})
export class GamesModule {}
