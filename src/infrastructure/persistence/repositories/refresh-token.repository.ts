import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IRefreshTokenRepository } from '@domain/repositories/refresh-token.repository.interface';
import { RefreshToken } from '@domain/entities/refresh-token.entity';

@Injectable()
export class RefreshTokenRepository implements IRefreshTokenRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    userId: string,
    token: string,
    expiresAt: Date,
  ): Promise<RefreshToken> {
    const tokenRecord = await this.prisma.refreshToken.create({
      data: {
        token,
        userId,
        expiresAt,
      },
    });

    return this.mapToEntity(tokenRecord);
  }

  async findByToken(token: string): Promise<RefreshToken | null> {
    const tokenRecord = await this.prisma.refreshToken.findUnique({
      where: { token },
    });

    return tokenRecord ? this.mapToEntity(tokenRecord) : null;
  }

  async revokeToken(token: string): Promise<void> {
    await this.prisma.refreshToken.update({
      where: { token },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    });
  }

  async deleteExpiredTokens(): Promise<void> {
    await this.prisma.refreshToken.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
  }

  private mapToEntity(tokenRecord: any): RefreshToken {
    return new RefreshToken(
      tokenRecord.id,
      tokenRecord.token,
      tokenRecord.userId,
      tokenRecord.expiresAt,
      tokenRecord.revokedAt,
      tokenRecord.createdAt,
    );
  }
}
