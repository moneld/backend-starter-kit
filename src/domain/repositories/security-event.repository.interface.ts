import {
  SecurityEvent,
  SecurityEventType,
} from '../entities/security-event.entity';

export interface SecurityEventFilter {
  type?: SecurityEventType;
  userId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}

export interface SecurityStats {
  totalEvents: number;
  eventsByType: Record<SecurityEventType, number>;
  recentFailedLogins: number;
  activeLockedAccounts: number;
  suspiciousActivities: number;
}

export interface ISecurityEventRepository {
  create(
    type: SecurityEventType,
    userId?: string | null,
    ipAddress?: string | null,
    userAgent?: string | null,
    metadata?: Record<string, any> | null,
  ): Promise<SecurityEvent>;

  findByFilter(filter: SecurityEventFilter): Promise<SecurityEvent[]>;

  getStats(startDate: Date, endDate: Date): Promise<SecurityStats>;

  countByTypeAndUser(
    type: SecurityEventType,
    userId: string,
    since: Date,
  ): Promise<number>;
}
