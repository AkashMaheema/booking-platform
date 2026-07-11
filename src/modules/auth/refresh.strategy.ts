import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';

@Injectable()
export class RefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(private readonly configService: ConfigService) {
    const secret = configService.get<string>('REFRESH_SECRET');
    if (!secret) {
      throw new Error('REFRESH_SECRET must be defined in environment variables');
    }

    super({
      jwtFromRequest: ExtractJwt.fromBodyField('refreshToken'),
      ignoreExpiration: false,
      secretOrKey: secret,
      passReqToCallback: true, // Needed to access the raw token
    });
  }

  /**
   * Validates the decoded Refresh JWT payload.
   * We pass the payload and the raw token to the request so the controller/service
   * can verify the hash in the database.
   */
  async validate(
    req: Request,
    payload: { sub: string; email: string; role: string },
  ) {
    const refreshToken = req.body.refreshToken;

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is missing');
    }

    return {
      ...payload,
      refreshToken,
    };
  }
}
