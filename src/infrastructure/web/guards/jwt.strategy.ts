import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { ISessionManagerService } from '@domain/services/session-manager.service.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    @Inject('ISessionManagerService')
    private sessionManagerService: ISessionManagerService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        configService.get<string>('security.jwt.accessTokenSecret') ||
        'default-secret',
      passReqToCallback: true, // Important pour accéder à la requête
    });
  }

  async validate(request: any, payload: any) {
    // Extraire le sessionId depuis les headers
    const sessionId = request.headers['x-session-id'];

    // Si un sessionId est fourni, le valider
    if (sessionId) {
      const isValidSession =
        await this.sessionManagerService.validateSession(sessionId);

      if (!isValidSession) {
        throw new UnauthorizedException(
          'Session expired or invalid. Please login again.',
        );
      }
    } else {
      // Optionnel : rendre la session obligatoire
      // throw new UnauthorizedException('Session ID required');
    }

    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
      sessionId: sessionId,
    };
  }
}
