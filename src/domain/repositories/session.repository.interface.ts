import { Session } from '../entities/session.entity';

export interface ISessionRepository {
  create(
    userId: string,
    ipAddress: string,
    userAgent: string,
  ): Promise<Session>;

  findById(id: string): Promise<Session | null>;

  findByUserId(userId: string): Promise<Session[]>;

  countActiveByUserId(userId: string): Promise<number>;

  updateLastActivity(sessionId: string): Promise<void>;

  delete(sessionId: string): Promise<void>;

  deleteAllByUserId(userId: string): Promise<void>;

  deleteExpiredSessions(maxInactivityMinutes: number): Promise<void>;
}
