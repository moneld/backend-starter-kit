import { SecurityEvent, SecurityEventType } from '@domain/entities/security-event.entity';

export interface SecurityMetrics {
  failedLoginAttempts: number;
  successfulLogins: number;
  accountLocks: number;
  suspiciousActivities: number;
  activeSessions: number;
  passwordChanges: number;
}

export interface ISecurityMonitoringService {
  logSecurityEvent(
    type: SecurityEventType,
    userId?: string,
    ipAddress?: string,
    userAgent?: string,
    metadata?: Record<string, any>,
  ): Promise<void>;

  detectSuspiciousActivity(userId: string, ipAddress: string): Promise<boolean>;

  getSecurityMetrics(startDate: Date, endDate: Date): Promise<SecurityMetrics>;

  getRecentSecurityEvents(limit: number): Promise<SecurityEvent[]>;
}
