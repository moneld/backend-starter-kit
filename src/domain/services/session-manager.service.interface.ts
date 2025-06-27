export interface ISessionManagerService {
  createSession(
    userId: string,
    ipAddress: string,
    userAgent: string,
  ): Promise<string>;

  validateSession(sessionId: string): Promise<boolean>;

  terminateSession(sessionId: string): Promise<void>;

  terminateAllUserSessions(userId: string): Promise<void>;

  getActiveSessions(userId: string): Promise<
    Array<{
      id: string;
      ipAddress: string;
      userAgent: string;
      lastActivity: Date;
    }>
  >;

  enforceSessionLimit(userId: string, maxSessions: number): Promise<void>;
}
