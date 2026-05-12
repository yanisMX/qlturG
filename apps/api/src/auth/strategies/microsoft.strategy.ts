import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-oauth2';
import { AuthService } from '../auth.service';

@Injectable()
export class MicrosoftStrategy extends PassportStrategy(Strategy, 'microsoft') {
  constructor(private readonly authService: AuthService) {
    const tenant = process.env.MICROSOFT_TENANT_ID ?? 'common';
    super({
      authorizationURL: `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/authorize`,
      tokenURL: `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`,
      clientID: process.env.MICROSOFT_CLIENT_ID ?? '',
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET ?? '',
      callbackURL: `${process.env.API_URL ?? 'http://localhost:3001'}/auth/microsoft/callback`,
      scope: ['openid', 'profile', 'email', 'User.Read'],
    });
  }

  async validate(accessToken: string, _refreshToken: string, done: (...args: unknown[]) => void) {
    try {
      const res = await fetch('https://graph.microsoft.com/v1.0/me', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const profile = await res.json();

      const user = await this.authService.findOrCreateOAuthUser({
        provider: 'microsoft',
        oauthId: profile.id,
        email: profile.mail ?? profile.userPrincipalName,
        displayName: profile.displayName ?? profile.givenName,
      });

      done(null, user);
    } catch (err) {
      done(err, false);
    }
  }
}
