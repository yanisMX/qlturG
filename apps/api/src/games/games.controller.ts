import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { GameService } from './game.service';
import { IsString, IsEnum, IsInt, IsBoolean, Min, Max } from 'class-validator';
import { Difficulty } from '@prisma/client';

class CreateGameDto {
  @IsEnum(Difficulty)
  difficulty!: Difficulty;

  @IsInt()
  @Min(5)
  @Max(20)
  totalQuestions!: number;

  @IsBoolean()
  speedBonus!: boolean;
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
