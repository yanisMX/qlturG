import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-oauth2';
import { AuthService } from '../auth.service';

@Injectable()
export class LinkedInStrategy extends PassportStrategy(Strategy, 'linkedin') {
  constructor(private readonly authService: AuthService) {
    super({
      authorizationURL: 'https://www.linkedin.com/oauth/v2/authorization',
      tokenURL: 'https://www.linkedin.com/oauth/v2/accessToken',
      clientID: process.env.LINKEDIN_CLIENT_ID ?? '',
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET ?? '',
      callbackURL: `${process.env.API_URL ?? 'http://localhost:3001'}/auth/linkedin/callback`,
      scope: ['openid', 'profile', 'email'],
    });
  }

  async validate(accessToken: string, _refreshToken: string, done: (...args: unknown[]) => void) {
    try {
      const res = await fetch('https://api.linkedin.com/v2/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const profile = await res.json();

      const user = await this.authService.findOrCreateOAuthUser({
        provider: 'linkedin',
        oauthId: profile.sub,
        email: profile.email,
        displayName: profile.name ?? profile.given_name,
        avatarUrl: profile.picture,
      });

      done(null, user);
    } catch (err) {
      done(err, false);
    }
  }
}
