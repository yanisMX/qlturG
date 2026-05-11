import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Headers,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { QuestionsService } from './questions.service';
import { CreateQuestionDto, UpdateQuestionDto } from './questions.dto';
import { Difficulty, Period } from '@prisma/client';

@Controller('questions')
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  private checkAdmin(key: string | undefined) {
    if (key !== process.env.ADMIN_KEY) {
      throw new UnauthorizedException('Invalid admin key');
    }
  }

  @Get()
  findAll(
    @Query('difficulty') difficulty?: Difficulty,
    @Query('period') period?: Period,
  ) {
    return this.questionsService.findAll({ difficulty, period });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const question = await this.questionsService.findOne(id);
    if (!question) throw new NotFoundException();
    return question;
  }

  @Post()
  create(
    @Headers('x-admin-key') key: string,
    @Body() dto: CreateQuestionDto,
  ) {
    this.checkAdmin(key);
    return this.questionsService.create(dto);
  }

  @Put(':id')
  async update(
    @Headers('x-admin-key') key: string,
    @Param('id') id: string,
    @Body() dto: UpdateQuestionDto,
  ) {
    this.checkAdmin(key);
    const question = await this.questionsService.findOne(id);
    if (!question) throw new NotFoundException();
    return this.questionsService.update(id, dto);
  }

  @Delete(':id')
  async remove(@Headers('x-admin-key') key: string, @Param('id') id: string) {
    this.checkAdmin(key);
    const question = await this.questionsService.findOne(id);
    if (!question) throw new NotFoundException();
    return this.questionsService.remove(id);
  }
}
