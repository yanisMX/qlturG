import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { GameService } from './game.service';
import {
  IsString, IsEnum, IsInt, IsBoolean, IsOptional, IsArray,
  Min, Max, MinLength, MaxLength, Matches,
} from 'class-validator';
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
  @IsArray()
  @IsEnum(Topic, { each: true })
  topics?: Topic[];
}

class JoinGameDto {
  @IsString()
  @MinLength(6)
  @MaxLength(6)
  code!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(20)
  @Matches(/^[\w\-\s àâäéèêëïîôùûüçÀÂÄÉÈÊËÏÎÔÙÛÜÇ]+$/, {
    message: 'nickname contains invalid characters',
  })
  nickname!: string;
}

@Controller('games')
export class GamesController {
  constructor(private readonly gameService: GameService) {}

  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @Post()
  create(@Body() dto: CreateGameDto) {
    return this.gameService.createGame(dto);
  }

  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @Post('join')
  join(@Body() dto: JoinGameDto) {
    return this.gameService.joinGame(dto);
  }

  @Get(':code')
  getByCode(@Param('code') code: string) {
    return this.gameService.getGameByCode(code);
  }
}
