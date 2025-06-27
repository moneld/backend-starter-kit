import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  ISecurityMonitoringService,
  SecurityMetrics,
} from '@domain/services/security-monitoring.service.interface';
import { ISecurityEventRepository } from '@domain/repositories/security-event.repository.interface';
import {
  SecurityEvent,
  SecurityEventType,
} from '@domain/entities/security-event.entity';

@Injectable()
export class SecurityMonitoringService implements ISecurityMonitoringService {
  private readonly logger = new Logger(SecurityMonitoringService.name);
  private readonly SUSPICIOUS_LOGIN_THRESHOLD = 3; // 3 failed logins in 10 minutes
  private readonly SUSPICIOUS_WINDOW_MINUTES = 10;

  constructor(
    @Inject('ISecurityEventRepository')
    private readonly securityEventRepository: ISecurityEventRepository,
  ) {}

  async logSecurityEvent(
    type: SecurityEventType,
    userId?: string,
    ipAddress?: string,
    userAgent?: string,
    metadata?: Record<string, any>,
  ): Promise<void> {
    await this.securityEventRepository.create(
      type,
      userId,
      ipAddress,
      userAgent,
      metadata,
    );

    this.logger.log(
      `Security event logged: ${type} for user ${userId || 'unknown'}`,
    );
  }

  async detectSuspiciousActivity(
    userId: string,
    ipAddress: string,
  ): Promise<boolean> {
    const windowStart = new Date(
      Date.now() - this.SUSPICIOUS_WINDOW_MINUTES * 60 * 1000,
    );

    const recentFailedLogins =
      await this.securityEventRepository.countByTypeAndUser(
        SecurityEventType.LOGIN_FAILED,
        userId,
        windowStart,
      );

    const isSuspicious = recentFailedLogins >= this.SUSPICIOUS_LOGIN_THRESHOLD;

    if (isSuspicious) {
      await this.logSecurityEvent(
        SecurityEventType.SUSPICIOUS_ACTIVITY,
        userId,
        ipAddress,
        undefined, // Changé de null à undefined
        { reason: 'Too many failed login attempts', count: recentFailedLogins },
      );
    }

    return isSuspicious;
  }

  async getSecurityMetrics(
    startDate: Date,
    endDate: Date,
  ): Promise<SecurityMetrics> {
    const stats = await this.securityEventRepository.getStats(
      startDate,
      endDate,
    );

    return {
      failedLoginAttempts:
        stats.eventsByType[SecurityEventType.LOGIN_FAILED] || 0,
      successfulLogins:
        stats.eventsByType[SecurityEventType.LOGIN_SUCCESS] || 0,
      accountLocks: stats.eventsByType[SecurityEventType.ACCOUNT_LOCKED] || 0,
      suspiciousActivities:
        stats.eventsByType[SecurityEventType.SUSPICIOUS_ACTIVITY] || 0,
      activeSessions:
        stats.eventsByType[SecurityEventType.SESSION_CREATED] || 0,
      passwordChanges:
        stats.eventsByType[SecurityEventType.PASSWORD_CHANGED] || 0,
    };
  }

  async getRecentSecurityEvents(limit: number): Promise<SecurityEvent[]> {
    return this.securityEventRepository.findByFilter({ limit });
  }
}
