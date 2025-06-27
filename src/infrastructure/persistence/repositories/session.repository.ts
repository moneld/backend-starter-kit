// src/infrastructure/persistence/repositories/session.repository.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ISessionRepository } from '@domain/repositories/session.repository.interface';
import { Session } from '@domain/entities/session.entity';

@Injectable()
export class SessionRepository implements ISessionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    userId: string,
    ipAddress: string,
    userAgent: string,
  ): Promise<Session> {
    const sessionRecord = await this.prisma.session.create({
      data: {
        userId,
        ipAddress,
        userAgent,
      },
    });

    return this.mapToEntity(sessionRecord);
  }

  async findById(id: string): Promise<Session | null> {
    const sessionRecord = await this.prisma.session.findUnique({
      where: { id },
    });

    return sessionRecord ? this.mapToEntity(sessionRecord) : null;
  }

  async findByUserId(userId: string): Promise<Session[]> {
    const sessions = await this.prisma.session.findMany({
      where: { userId },
      orderBy: { lastActivity: 'desc' },
    });

    return sessions.map(this.mapToEntity);
  }

  async countActiveByUserId(userId: string): Promise<number> {
    return this.prisma.session.count({
      where: { userId },
    });
  }

  async updateLastActivity(sessionId: string): Promise<void> {
    await this.prisma.session.update({
      where: { id: sessionId },
      data: { lastActivity: new Date() },
    });
  }

  async delete(sessionId: string): Promise<void> {
    await this.prisma.session.delete({
      where: { id: sessionId },
    });
  }

  async deleteAllByUserId(userId: string): Promise<void> {
    await this.prisma.session.deleteMany({
      where: { userId },
    });
  }

  async deleteExpiredSessions(maxInactivityMinutes: number): Promise<void> {
    const expiryDate = new Date(Date.now() - maxInactivityMinutes * 60 * 1000);

    await this.prisma.session.deleteMany({
      where: {
        lastActivity: {
          lt: expiryDate,
        },
      },
    });
  }

  private mapToEntity(sessionRecord: any): Session {
    return new Session(
      sessionRecord.id,
      sessionRecord.userId,
      sessionRecord.ipAddress,
      sessionRecord.userAgent,
      sessionRecord.lastActivity,
      sessionRecord.createdAt,
    );
  }
}
