import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtPayload } from './decorators/current-user.decorator';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  generateToken(user: User): string {
    const payload: JwtPayload = { sub: user.id, pseudo: user.pseudo, email: user.email };
    return this.jwtService.sign(payload);
  }

  async register(dto: RegisterDto): Promise<{ user: User; token: string }> {
    const existingEmail = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existingEmail) throw new ConflictException('Adresse email déjà utilisée');

    const existingPseudo = await this.prisma.user.findUnique({ where: { pseudo: dto.pseudo } });
    if (existingPseudo) throw new ConflictException('Pseudo déjà utilisé');

    const user = await this.prisma.user.create({
      data: {
        pseudo: dto.pseudo,
        email: dto.email,
        avatarUrl: dto.avatarUrl ?? null,
      },
    });

    return { user, token: this.generateToken(user) };
  }

  async findOrCreateOAuthUser(params: {
    provider: 'google' | 'microsoft' | 'linkedin';
    oauthId: string;
    email: string;
    displayName: string;
    avatarUrl?: string;
  }): Promise<User> {
    // 1. Find by provider + oauthId
    const byOAuth = await this.prisma.user.findFirst({
      where: { oauthProvider: params.provider, oauthId: params.oauthId },
    });
    if (byOAuth) return byOAuth;

    // 2. Find by email — link OAuth to existing account
    const byEmail = await this.prisma.user.findUnique({ where: { email: params.email } });
    if (byEmail) {
      return this.prisma.user.update({
        where: { id: byEmail.id },
        data: { oauthProvider: params.provider, oauthId: params.oauthId, emailVerified: true },
      });
    }

    // 3. Create new account
    const pseudo = await this.ensureUniquePseudo(params.displayName);
    return this.prisma.user.create({
      data: {
        pseudo,
        email: params.email,
        avatarUrl: params.avatarUrl ?? null,
        emailVerified: true,
        oauthProvider: params.provider,
        oauthId: params.oauthId,
      },
    });
  }

  async getMe(userId: string): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Utilisateur introuvable');
    return user;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<User> {
    if (dto.pseudo) {
      const existing = await this.prisma.user.findUnique({ where: { pseudo: dto.pseudo } });
      if (existing && existing.id !== userId) {
        throw new ConflictException('Pseudo déjà utilisé');
      }
    }

    if (dto.email) {
      const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
      if (existing && existing.id !== userId) {
        throw new ConflictException('Adresse email déjà utilisée');
      }
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.pseudo && { pseudo: dto.pseudo }),
        ...(dto.email && { email: dto.email, emailVerified: false }),
        ...(dto.avatarUrl !== undefined && { avatarUrl: dto.avatarUrl }),
      },
    });
  }

  async updateAvatar(userId: string, avatarUrl: string): Promise<User> {
    return this.prisma.user.update({ where: { id: userId }, data: { avatarUrl } });
  }

  getConfiguredProviders(): string[] {
    const providers: string[] = [];
    if (process.env.GOOGLE_CLIENT_ID) providers.push('google');
    if (process.env.MICROSOFT_CLIENT_ID) providers.push('microsoft');
    if (process.env.LINKEDIN_CLIENT_ID) providers.push('linkedin');
    return providers;
  }

  private async ensureUniquePseudo(base: string): Promise<string> {
    const clean = base.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 18) || 'Joueur';
    let pseudo = clean;
    let i = 2;
    while (await this.prisma.user.findUnique({ where: { pseudo } })) {
      pseudo = `${clean.slice(0, 16)}${i}`;
      i++;
    }
    return pseudo;
  }
}
