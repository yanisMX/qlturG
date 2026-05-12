import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback, Profile } from 'passport-google-oauth20';
import { AuthService } from '../auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private readonly authService: AuthService) {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
      callbackURL: `${process.env.API_URL ?? 'http://localhost:3001'}/auth/google/callback`,
      scope: ['email', 'profile'],
    });
  }

  async validate(_accessToken: string, _refreshToken: string, profile: Profile, done: VerifyCallback) {
    const email = profile.emails?.[0]?.value;
    const avatarUrl = profile.photos?.[0]?.value;

    if (!email) return done(new Error('Email non fourni par Google'), false);

    const user = await this.authService.findOrCreateOAuthUser({
      provider: 'google',
      oauthId: profile.id,
      email,
      displayName: profile.displayName ?? email.split('@')[0],
      avatarUrl,
    });

    done(null, user);
  }
}
