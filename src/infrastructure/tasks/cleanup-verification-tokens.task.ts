import { Injectable, Logger, Inject } from '@nestjs/common';
import { IVerificationTokenRepository } from '@domain/repositories/verification-token.repository.interface';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class CleanupVerificationTokensTask {
  private readonly logger = new Logger(CleanupVerificationTokensTask.name);

  constructor(
    @Inject('IVerificationTokenRepository')
    private readonly verificationTokenRepository: IVerificationTokenRepository,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_4AM)
  async handleCleanup() {
    try {
      await this.verificationTokenRepository.deleteExpiredTokens();
      this.logger.log('Expired verification tokens cleaned up successfully');
    } catch (error) {
      this.logger.error('Failed to cleanup expired verification tokens', error);
    }
  }
}