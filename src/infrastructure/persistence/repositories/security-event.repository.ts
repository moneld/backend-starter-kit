import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  ISecurityEventRepository,
  SecurityEventFilter,
  SecurityStats,
} from '@domain/repositories/security-event.repository.interface';
import {
  SecurityEvent,
  SecurityEventType,
} from '@domain/entities/security-event.entity';
import { SecurityEventType as PrismaSecurityEventType } from 'generated/prisma';

@Injectable()
export class SecurityEventRepository implements ISecurityEventRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    type: SecurityEventType,
    userId?: string | null,
    ipAddress?: string | null,
    userAgent?: string | null,
    metadata?: Record<string, any> | null,
  ): Promise<SecurityEvent> {
    const eventRecord = await this.prisma.securityEvent.create({
      data: {
        type: this.mapToPrismaEventType(type),
        userId,
        ipAddress,
        userAgent,
        metadata: metadata || undefined,
      },
    });

    return this.mapToEntity(eventRecord);
  }

  async findByFilter(filter: SecurityEventFilter): Promise<SecurityEvent[]> {
    const where: any = {};

    if (filter.type) {
      where.type = this.mapToPrismaEventType(filter.type);
    }

    if (filter.userId) {
      where.userId = filter.userId;
    }

    if (filter.startDate || filter.endDate) {
      where.createdAt = {};
      if (filter.startDate) {
        where.createdAt.gte = filter.startDate;
      }
      if (filter.endDate) {
        where.createdAt.lte = filter.endDate;
      }
    }

    const events = await this.prisma.securityEvent.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: filter.limit || 100,
    });

    return events.map(this.mapToEntity);
  }

  async getStats(startDate: Date, endDate: Date): Promise<SecurityStats> {
    const events = await this.prisma.securityEvent.groupBy({
      by: ['type'],
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      _count: {
        type: true,
      },
    });

    const eventsByType: Record<SecurityEventType, number> = {} as any;
    let totalEvents = 0;

    for (const event of events) {
      const domainType = this.mapToDomainEventType(event.type);
      eventsByType[domainType] = event._count.type;
      totalEvents += event._count.type;
    }

    // Get additional stats
    const recentFailedLogins = await this.prisma.securityEvent.count({
      where: {
        type: PrismaSecurityEventType.LOGIN_FAILED,
        createdAt: {
          gte: new Date(Date.now() - 60 * 60 * 1000), // Last hour
        },
      },
    });

    const activeLockedAccounts = await this.prisma.user.count({
      where: {
        lockedUntil: {
          gt: new Date(),
        },
      },
    });

    const suspiciousActivities =
      eventsByType[SecurityEventType.SUSPICIOUS_ACTIVITY] || 0;

    return {
      totalEvents,
      eventsByType,
      recentFailedLogins,
      activeLockedAccounts,
      suspiciousActivities,
    };
  }

  async countByTypeAndUser(
    type: SecurityEventType,
    userId: string,
    since: Date,
  ): Promise<number> {
    return this.prisma.securityEvent.count({
      where: {
        type: this.mapToPrismaEventType(type),
        userId,
        createdAt: {
          gte: since,
        },
      },
    });
  }

  private mapToEntity(eventRecord: any): SecurityEvent {
    return new SecurityEvent(
      eventRecord.id,
      this.mapToDomainEventType(eventRecord.type),
      eventRecord.userId,
      eventRecord.ipAddress,
      eventRecord.userAgent,
      eventRecord.metadata as Record<string, any> | null,
      eventRecord.createdAt,
    );
  }

  private mapToPrismaEventType(
    type: SecurityEventType,
  ): PrismaSecurityEventType {
    return type as unknown as PrismaSecurityEventType;
  }

  private mapToDomainEventType(
    type: PrismaSecurityEventType,
  ): SecurityEventType {
    return type as unknown as SecurityEventType;
  }
}
