import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { Tier } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const ANSWER_STREAK_AT = 5;
const ANSWER_STREAK_BONUS = 200;
const CONNECTION_STREAK_AT = 7;
const CONNECTION_STREAK_BONUS = 500;
const ABANDON_MALUS = 100;
const MIN_PLAYERS_PERCENTILE = 100;
const PLATINUM_FIXED = 10_000;
const GOLD_FIXED = 5_000;
const SILVER_FIXED = 2_000;

@Injectable()
export class LeaderboardService {
  private readonly logger = new Logger(LeaderboardService.name);

  constructor(private readonly prisma: PrismaService) {}

  getWeekStart(now = new Date()): Date {
    const dateStr = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Europe/Paris',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(now);
    const weekday = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Europe/Paris',
      weekday: 'short',
    }).format(now);
    const [y, m, d] = dateStr.split('-').map(Number);
    const idx = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(weekday);
    const daysToMonday = idx === 0 ? 6 : idx - 1;
    return new Date(Date.UTC(y, m - 1, d - daysToMonday));
  }

  getNextWeekStart(now = new Date()): Date {
    const ws = this.getWeekStart(now);
    return new Date(ws.getTime() + 7 * 24 * 60 * 60 * 1000);
  }

  private async getOrCreateWeeklyScore(userId: string, weekStart: Date) {
    return this.prisma.weeklyScore.upsert({
      where: { userId_weekStart: { userId, weekStart } },
      create: { userId, weekStart },
      update: {},
    });
  }

  async recordDailyLogin(userId: string): Promise<void> {
    const weekStart = this.getWeekStart();
    const now = new Date();
    const ws = await this.getOrCreateWeeklyScore(userId, weekStart);

    const last = ws.lastConnectedAt;
    if (last) {
      const lastParis = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris' }).format(last);
      const todayParis = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris' }).format(now);
      if (lastParis === todayParis) return; // already counted today

      const diffDays = Math.round((now.getTime() - last.getTime()) / 86_400_000);
      const newStreak = diffDays === 1 ? ws.connectionStreak + 1 : 1;
      const bonus = newStreak >= CONNECTION_STREAK_AT ? CONNECTION_STREAK_BONUS : 0;

      await this.prisma.weeklyScore.update({
        where: { userId_weekStart: { userId, weekStart } },
        data: {
          connectionStreak: newStreak,
          lastConnectedAt: now,
          ...(bonus > 0 ? { points: { increment: bonus } } : {}),
        },
      });
    } else {
      await this.prisma.weeklyScore.update({
        where: { userId_weekStart: { userId, weekStart } },
        data: { connectionStreak: 1, lastConnectedAt: now },
      });
    }
  }

  async creditGamePoints(userId: string, gamePoints: number, abandoned: boolean): Promise<void> {
    const weekStart = this.getWeekStart();
    await this.getOrCreateWeeklyScore(userId, weekStart);

    const malus = abandoned ? ABANDON_MALUS : 0;

    // Increment quizzes played; apply malus-aware points in a second call to respect floor=0
    await this.prisma.weeklyScore.update({
      where: { userId_weekStart: { userId, weekStart } },
      data: { quizzesPlayed: { increment: 1 } },
    });

    if (malus > 0) {
      const current = await this.prisma.weeklyScore.findUnique({
        where: { userId_weekStart: { userId, weekStart } },
        select: { points: true },
      });
      const newPoints = Math.max(0, (current?.points ?? 0) + gamePoints - malus);
      await this.prisma.weeklyScore.update({
        where: { userId_weekStart: { userId, weekStart } },
        data: { points: newPoints },
      });
    } else {
      await this.prisma.weeklyScore.update({
        where: { userId_weekStart: { userId, weekStart } },
        data: { points: { increment: gamePoints } },
      });
    }
  }

  async applyAnswerStreakBonus(userId: string): Promise<void> {
    const weekStart = this.getWeekStart();
    await this.getOrCreateWeeklyScore(userId, weekStart);
    await this.prisma.weeklyScore.update({
      where: { userId_weekStart: { userId, weekStart } },
      data: { points: { increment: ANSWER_STREAK_BONUS } },
    });
  }

  get answerStreakThreshold() {
    return ANSWER_STREAK_AT;
  }

  async getWeeklyLeaderboard(page: number, limit: number) {
    const weekStart = this.getWeekStart();
    const skip = (page - 1) * limit;

    const [scores, total] = await Promise.all([
      this.prisma.weeklyScore.findMany({
        where: { weekStart },
        orderBy: { points: 'desc' },
        skip,
        take: limit,
        include: { user: { select: { pseudo: true, avatarUrl: true } } },
      }),
      this.prisma.weeklyScore.count({ where: { weekStart } }),
    ]);

    const entries = scores.map((s, i) => ({
      rank: skip + i + 1,
      userId: s.userId,
      pseudo: s.user.pseudo,
      avatarUrl: s.user.avatarUrl,
      points: s.points,
      quizzesPlayed: s.quizzesPlayed,
      tier: this.computeTier(s.points, skip + i + 1, total),
    }));

    return { entries, total, page, limit };
  }

  async getMyWeeklyPosition(userId: string) {
    const weekStart = this.getWeekStart();
    await this.getOrCreateWeeklyScore(userId, weekStart);

    const [myScore, total] = await Promise.all([
      this.prisma.weeklyScore.findUnique({
        where: { userId_weekStart: { userId, weekStart } },
        include: { user: { select: { pseudo: true, avatarUrl: true } } },
      }),
      this.prisma.weeklyScore.count({ where: { weekStart } }),
    ]);

    if (!myScore) return null;

    const rank = await this.prisma.weeklyScore.count({
      where: { weekStart, points: { gt: myScore.points } },
    });

    return {
      rank: rank + 1,
      userId,
      pseudo: myScore.user.pseudo,
      avatarUrl: myScore.user.avatarUrl,
      points: myScore.points,
      quizzesPlayed: myScore.quizzesPlayed,
      connectionStreak: myScore.connectionStreak,
      tier: this.computeTier(myScore.points, rank + 1, total),
    };
  }

  async getUserBadges(userId: string) {
    return this.prisma.weeklyBadge.findMany({
      where: { userId },
      orderBy: { weekStart: 'desc' },
      select: {
        id: true,
        weekStart: true,
        tier: true,
        points: true,
        rank: true,
      },
    });
  }

  private computeTier(points: number, rank: number, total: number): Tier {
    if (total >= MIN_PLAYERS_PERCENTILE) {
      const pct = rank / total;
      if (pct <= 0.01) return 'PLATINUM';
      if (pct <= 0.10) return 'GOLD';
      if (pct <= 0.30) return 'SILVER';
      return 'BRONZE';
    }
    if (points >= PLATINUM_FIXED) return 'PLATINUM';
    if (points >= GOLD_FIXED) return 'GOLD';
    if (points >= SILVER_FIXED) return 'SILVER';
    return 'BRONZE';
  }

  @Cron('0 0 * * 1', { timeZone: 'Europe/Paris' })
  async runWeeklyReset(): Promise<void> {
    this.logger.log('Weekly reset — computing tiers and archiving badges');
    const now = new Date();
    const lastWeekStart = new Date(this.getWeekStart(now).getTime() - 7 * 24 * 60 * 60 * 1000);

    const scores = await this.prisma.weeklyScore.findMany({
      where: { weekStart: lastWeekStart },
      orderBy: { points: 'desc' },
    });

    const total = scores.length;
    if (total === 0) return;

    await Promise.all(
      scores.map((s, i) =>
        this.prisma.weeklyBadge.upsert({
          where: { userId_weekStart: { userId: s.userId, weekStart: lastWeekStart } },
          create: {
            userId: s.userId,
            weekStart: lastWeekStart,
            tier: this.computeTier(s.points, i + 1, total),
            points: s.points,
            rank: i + 1,
          },
          update: {},
        }),
      ),
    );

    this.logger.log(`Weekly reset complete — ${total} badges created`);
  }
}
