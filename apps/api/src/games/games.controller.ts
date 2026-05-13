import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { GameService } from './game.service';
import { IsString, IsEnum, IsInt, IsBoolean, IsOptional, Min, Max } from 'class-validator';
import { Difficulty, GameMode, Topic } from '@prisma/client';

class CreateGameDto {
  @IsEnum(Difficulty)
  difficulty!: Difficulty;

  @IsInt()
  @Min(10)
  @Max(30)
  totalQuestions!: number;

  @IsBoolean()
  speedBonus!: boolean;

  @IsEnum(GameMode)
  gameMode!: GameMode;

  @IsInt()
  @Min(5)
  @Max(30)
  questionDuration!: number;

  @IsBoolean()
  doublePointsBonus!: boolean;

  @IsOptional()
  @IsEnum(Topic)
  topic?: Topic;
}

class JoinGameDto {
  @IsString()
  code!: string;

  @IsString()
  nickname!: string;
}

@Controller('games')
export class GamesController {
  constructor(private readonly gameService: GameService) {}

  @Post()
  create(@Body() dto: CreateGameDto) {
    return this.gameService.createGame(dto);
  }

  @Post('join')
  join(@Body() dto: JoinGameDto) {
    return this.gameService.joinGame(dto);
  }

  @Get(':code')
  getByCode(@Param('code') code: string) {
    return this.gameService.getGameByCode(code);
  }
}
