import { Inject, Injectable, Logger } from '@nestjs/common';
import { ISessionManagerService } from '@domain/services/session-manager.service.interface';
import { ISessionRepository } from '@domain/repositories/session.repository.interface';
import { ISecurityEventRepository } from '@domain/repositories/security-event.repository.interface';
import { SecurityEventType } from '@domain/entities/security-event.entity';

@Injectable()
export class SessionManagerService implements ISessionManagerService {
  private readonly logger = new Logger(SessionManagerService.name);
  private readonly DEFAULT_MAX_SESSIONS = 5;
  private readonly SESSION_INACTIVITY_MINUTES = 30;

  constructor(
    @Inject('ISessionRepository')
    private readonly sessionRepository: ISessionRepository,
    @Inject('ISecurityEventRepository')
    private readonly securityEventRepository: ISecurityEventRepository,
  ) {}

  async createSession(
    userId: string,
    ipAddress: string,
    userAgent: string,
  ): Promise<string> {
    // Enforce session limit
    await this.enforceSessionLimit(userId, this.DEFAULT_MAX_SESSIONS);

    // Create new session
    const session = await this.sessionRepository.create(
      userId,
      ipAddress,
      userAgent,
    );

    // Log security event
    await this.securityEventRepository.create(
      SecurityEventType.SESSION_CREATED,
      userId,
      ipAddress,
      userAgent,
    );

    this.logger.log(`Session created for user ${userId} from ${ipAddress}`);

    return session.id;
  }

  async validateSession(sessionId: string): Promise<boolean> {
    const session = await this.sessionRepository.findById(sessionId);

    if (!session) return false;

    if (session.isExpired(this.SESSION_INACTIVITY_MINUTES)) {
      await this.sessionRepository.delete(sessionId);
      await this.securityEventRepository.create(
        SecurityEventType.SESSION_EXPIRED,
        session.userId,
      );
      return false;
    }

    // Update last activity
    await this.sessionRepository.updateLastActivity(sessionId);

    return true;
  }

  async terminateSession(sessionId: string): Promise<void> {
    const session = await this.sessionRepository.findById(sessionId);
    if (session) {
      await this.sessionRepository.delete(sessionId);
      this.logger.log(`Session ${sessionId} terminated`);
    }
  }

  async terminateAllUserSessions(userId: string): Promise<void> {
    await this.sessionRepository.deleteAllByUserId(userId);

    await this.securityEventRepository.create(
      SecurityEventType.FORCED_LOGOUT,
      userId,
    );

    this.logger.log(`All sessions terminated for user ${userId}`);
  }

  async getActiveSessions(userId: string): Promise<
    Array<{
      id: string;
      ipAddress: string;
      userAgent: string;
      lastActivity: Date;
    }>
  > {
    const sessions = await this.sessionRepository.findByUserId(userId);

    return sessions
      .filter((session) => !session.isExpired(this.SESSION_INACTIVITY_MINUTES))
      .map((session) => ({
        id: session.id,
        ipAddress: session.ipAddress,
        userAgent: session.userAgent,
        lastActivity: session.lastActivity,
      }));
  }

  async enforceSessionLimit(
    userId: string,
    maxSessions: number,
  ): Promise<void> {
    const sessions = await this.sessionRepository.findByUserId(userId);

    if (sessions.length >= maxSessions) {
      // Sort by last activity and remove oldest
      const sortedSessions = sessions.sort(
        (a, b) => a.lastActivity.getTime() - b.lastActivity.getTime(),
      );

      const sessionsToRemove = sortedSessions.slice(
        0,
        sessions.length - maxSessions + 1,
      );

      for (const session of sessionsToRemove) {
        await this.sessionRepository.delete(session.id);
      }
    }
  }
}
