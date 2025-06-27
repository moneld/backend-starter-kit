import { Inject, Injectable, Logger } from '@nestjs/common';
import { ISessionRepository } from '@domain/repositories/session.repository.interface';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class CleanupExpiredSessionsTask {
  private readonly logger = new Logger(CleanupExpiredSessionsTask.name);
  private readonly SESSION_INACTIVITY_MINUTES = 30;

  constructor(
    @Inject('ISessionRepository')
    private readonly sessionRepository: ISessionRepository,
  ) {}

  @Cron(CronExpression.EVERY_30_MINUTES)
  async handleCleanup() {
    try {
      await this.sessionRepository.deleteExpiredSessions(
        this.SESSION_INACTIVITY_MINUTES,
      );
      this.logger.log('Expired sessions cleaned up successfully');
    } catch (error) {
      this.logger.error('Failed to cleanup expired sessions', error);
    }
  }
}
