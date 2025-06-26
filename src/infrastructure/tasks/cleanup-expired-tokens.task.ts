import { Injectable, Logger, Inject } from '@nestjs/common';
import { IRefreshTokenRepository } from '@domain/repositories/refresh-token.repository.interface';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class CleanupExpiredTokensTask {
  private readonly logger = new Logger(CleanupExpiredTokensTask.name);

  constructor(
    @Inject('IRefreshTokenRepository')
    private readonly refreshTokenRepository: IRefreshTokenRepository,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async handleCleanup() {
    try {
      await this.refreshTokenRepository.deleteExpiredTokens();
      this.logger.log('Expired tokens cleaned up successfully');
    } catch (error) {
      this.logger.error('Failed to cleanup expired tokens', error);
    }
  }
}