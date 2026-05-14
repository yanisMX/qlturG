import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { mkdirSync } from 'fs';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LeaderboardService } from '../leaderboard/leaderboard.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from './decorators/current-user.decorator';
import { RegisterDto } from './dto/register.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { User } from '@prisma/client';

const FRONTEND_URL = process.env.CORS_ORIGIN?.split(',')[0] ?? 'http://localhost:5173';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly leaderboardService: LeaderboardService,
  ) {}

  // ─── Dev-only endpoint (no OAuth required) ────────────────────────────────

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    const { user, token } = await this.authService.register(dto);
    return { token, user: this.sanitize(user) };
  }

  // ─── Current user ─────────────────────────────────────────────────────────

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@CurrentUser() payload: JwtPayload) {
    const user = await this.authService.getMe(payload.sub);
    // Fire-and-forget — do not block the response
    this.leaderboardService.recordDailyLogin(payload.sub).catch(() => null);
    return this.sanitize(user);
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  async updateProfile(@CurrentUser() payload: JwtPayload, @Body() dto: UpdateProfileDto) {
    const user = await this.authService.updateProfile(payload.sub, dto);
    return this.sanitize(user);
  }

  @Post('avatar')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('avatar', {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          const dir = join(process.cwd(), 'public', 'avatars');
          mkdirSync(dir, { recursive: true });
          cb(null, dir);
        },
        filename: (_req, file, cb) => {
          const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          cb(null, `${unique}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (_req, file, cb) => {
        if (/\.(jpg|jpeg|png|webp)$/i.test(file.originalname)) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Format non supporté (jpg, png, webp uniquement)'), false);
        }
      },
      limits: { fileSize: 20 * 1024 * 1024 },
    }),
  )
  async uploadAvatar(
    @CurrentUser() payload: JwtPayload,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('Fichier manquant');
    const avatarUrl = `/avatars/${file.filename}`;
    const user = await this.authService.updateAvatar(payload.sub, avatarUrl);
    return { avatarUrl, user: this.sanitize(user) };
  }

  // ─── Configured providers ─────────────────────────────────────────────────

  @Get('providers')
  getProviders() {
    return { providers: this.authService.getConfiguredProviders() };
  }

  // ─── Google OAuth ─────────────────────────────────────────────────────────

  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleLogin() {
    // Passport redirects to Google
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  googleCallback(@Req() req: Request & { user: User }, @Res() res: Response) {
    const token = this.authService.generateToken(req.user);
    res.redirect(`${FRONTEND_URL}/auth/callback?token=${token}`);
  }

  // ─── Microsoft OAuth ──────────────────────────────────────────────────────

  @Get('microsoft')
  @UseGuards(AuthGuard('microsoft'))
  microsoftLogin() {}

  @Get('microsoft/callback')
  @UseGuards(AuthGuard('microsoft'))
  microsoftCallback(@Req() req: Request & { user: User }, @Res() res: Response) {
    const token = this.authService.generateToken(req.user);
    res.redirect(`${FRONTEND_URL}/auth/callback?token=${token}`);
  }

  // ─── LinkedIn OAuth ───────────────────────────────────────────────────────

  @Get('linkedin')
  @UseGuards(AuthGuard('linkedin'))
  linkedinLogin() {}

  @Get('linkedin/callback')
  @UseGuards(AuthGuard('linkedin'))
  linkedinCallback(@Req() req: Request & { user: User }, @Res() res: Response) {
    const token = this.authService.generateToken(req.user);
    res.redirect(`${FRONTEND_URL}/auth/callback?token=${token}`);
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private sanitize(user: User) {
    const { oauthId, ...safe } = user;
    void oauthId;
    return safe;
  }
}
