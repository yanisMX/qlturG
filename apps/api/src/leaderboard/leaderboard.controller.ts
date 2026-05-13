import { Controller, Get, Query, UseGuards, ParseIntPipe, DefaultValuePipe } from '@nestjs/common';
import { LeaderboardService } from './leaderboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../auth/decorators/current-user.decorator';

@Controller('leaderboard')
export class LeaderboardController {
  constructor(private readonly leaderboardService: LeaderboardService) {}

  @Get()
  async getLeaderboard(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    const safeLimit = Math.min(Math.max(limit, 1), 100);
    const safePage = Math.max(page, 1);
    return this.leaderboardService.getWeeklyLeaderboard(safePage, safeLimit);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMyPosition(@CurrentUser() payload: JwtPayload) {
    return this.leaderboardService.getMyWeeklyPosition(payload.sub);
  }

  @Get('badges')
  @UseGuards(JwtAuthGuard)
  async getMyBadges(@CurrentUser() payload: JwtPayload) {
    return this.leaderboardService.getUserBadges(payload.sub);
  }

  @Get('next-reset')
  getNextReset() {
    return { nextReset: this.leaderboardService.getNextWeekStart().toISOString() };
  }
}
