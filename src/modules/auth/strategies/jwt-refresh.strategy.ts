import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { FastifyRequest } from 'fastify';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../../users/users.service';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  private readonly logger = new Logger(JwtRefreshStrategy.name);

  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        configService.get<string>('auth.jwtRefreshSecret') ||
        'fallback_refresh_secret',
      passReqToCallback: true as any, // Forcer le type pour éviter l'erreur TS
    });
  }

  async validate(req: FastifyRequest, payload: JwtPayload) {
    try {
      const refreshToken = ExtractJwt.fromAuthHeaderAsBearerToken()(req as any);

      if (!refreshToken) {
        throw new UnauthorizedException('Refresh token not found');
      }

      // Vérifier si l'utilisateur existe et si le refresh token correspond
      const user = await this.usersService.getUserIfRefreshTokenMatches(
        payload.sub,
        refreshToken,
      );

      if (!user) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      if (!user.isActive) {
        throw new UnauthorizedException('User is inactive');
      }

      // Au lieu d'ajouter le refreshToken à la requête, nous ajoutons l'information au payload
      // que nous retournons à Passport
      return {
        ...user,
        refreshToken,
      };
    } catch (error) {
      this.logger.error(`JWT refresh validation failed: ${error.message}`);
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}
