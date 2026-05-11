import { IsString, IsArray, ArrayMinSize, ArrayMaxSize, IsInt, Min, Max, IsEnum } from 'class-validator';
import { Period, Difficulty } from '@prisma/client';

export class CreateQuestionDto {
  @IsString()
  text!: string;

  @IsArray()
  @ArrayMinSize(4)
  @ArrayMaxSize(4)
  @IsString({ each: true })
  choices!: string[];

  @IsInt()
  @Min(0)
  @Max(3)
  answerIndex!: number;

  @IsString()
  explanation!: string;

  @IsEnum(Period)
  period!: Period;

  @IsEnum(Difficulty)
  difficulty!: Difficulty;
}

export class UpdateQuestionDto {
  @IsString()
  text?: string;

  @IsArray()
  @ArrayMinSize(4)
  @ArrayMaxSize(4)
  @IsString({ each: true })
  choices?: string[];

  @IsInt()
  @Min(0)
  @Max(3)
  answerIndex?: number;

  @IsString()
  explanation?: string;

  @IsEnum(Period)
  period?: Period;

  @IsEnum(Difficulty)
  difficulty?: Difficulty;
}
