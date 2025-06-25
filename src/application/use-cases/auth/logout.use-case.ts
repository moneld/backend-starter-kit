import { Injectable } from '@nestjs/common';
import { IRefreshTokenRepository } from '@domain/repositories/refresh-token.repository.interface';

@Injectable()
export class LogoutUseCase {
  constructor(
    private readonly refreshTokenRepository: IRefreshTokenRepository,
  ) {}

  async execute(userId: string): Promise<void> {
    await this.refreshTokenRepository.revokeAllUserTokens(userId);
  }
}
