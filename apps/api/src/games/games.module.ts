import { Module } from '@nestjs/common';
import { GamesController } from './games.controller';
import { GameService } from './game.service';
import { GameGateway } from './game.gateway';
import { QuestionsModule } from '../questions/questions.module';

@Module({
  imports: [QuestionsModule],
  controllers: [GamesController],
  providers: [GameService, GameGateway],
})
export class GamesModule {}
