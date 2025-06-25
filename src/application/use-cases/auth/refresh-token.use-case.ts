import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { IRefreshTokenRepository } from '@domain/repositories/refresh-token.repository.interface';
import { IUserRepository } from '@domain/repositories/user.repository.interface';
import { InvalidTokenException } from '@domain/exceptions/domain.exception';

@Injectable()
export class RefreshTokenUseCase {
  constructor(
    private readonly refreshTokenRepository: IRefreshTokenRepository,
    private readonly userRepository: IUserRepository,
    @Inject() private readonly jwtService: JwtService,
    @Inject() private readonly configService: ConfigService,
  ) {}

  async execute(refreshToken: string) {
    // Verify JWT signature
    let payload: any;
    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>(
          'security.jwt.refreshTokenSecret',
        ),
      });
    } catch (error) {
      throw new InvalidTokenException('Invalid refresh token');
    }

    // Check if it's a refresh token
    if (payload.type !== 'refresh') {
      throw new InvalidTokenException('Invalid token type');
    }

    // Check if token exists in database
    const token = await this.refreshTokenRepository.findByToken(refreshToken);

    if (!token) {
      throw new InvalidTokenException('Refresh token not found');
    }

    if (!token.isValid()) {
      throw new InvalidTokenException('Refresh token is expired or revoked');
    }

    const user = await this.userRepository.findById(payload.sub);
    if (!user) {
      throw new InvalidTokenException('User not found');
    }

    // Revoke old token
    await this.refreshTokenRepository.revokeToken(refreshToken);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }
}
