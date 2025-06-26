import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IVerificationTokenRepository } from '@domain/repositories/verification-token.repository.interface';
import {
  TokenType,
  VerificationToken,
} from '@domain/entities/verification-token.entity';
import { TokenType as PrismaTokenType } from 'generated/prisma';

@Injectable()
export class VerificationTokenRepository
  implements IVerificationTokenRepository
{
  constructor(private readonly prisma: PrismaService) {}

  async create(
    userId: string,
    token: string,
    type: TokenType,
    expiresAt: Date,
  ): Promise<VerificationToken> {
    const tokenRecord = await this.prisma.verificationToken.create({
      data: {
        token,
        userId,
        type: this.mapToPrismaTokenType(type),
        expiresAt,
      },
    });

    return this.mapToEntity(tokenRecord);
  }

  async findByToken(token: string): Promise<VerificationToken | null> {
    const tokenRecord = await this.prisma.verificationToken.findUnique({
      where: { token },
    });

    return tokenRecord ? this.mapToEntity(tokenRecord) : null;
  }

  async markAsUsed(token: string): Promise<void> {
    await this.prisma.verificationToken.update({
      where: { token },
      data: { usedAt: new Date() },
    });
  }

  async deleteExpiredTokens(): Promise<void> {
    await this.prisma.verificationToken.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
  }

  async findActiveByUserAndType(
    userId: string,
    type: TokenType,
  ): Promise<VerificationToken | null> {
    const tokenRecord = await this.prisma.verificationToken.findFirst({
      where: {
        userId,
        type: this.mapToPrismaTokenType(type),
        usedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return tokenRecord ? this.mapToEntity(tokenRecord) : null;
  }

  async invalidateUserTokensByType(
    userId: string,
    type: TokenType,
  ): Promise<void> {
    await this.prisma.verificationToken.updateMany({
      where: {
        userId,
        type: this.mapToPrismaTokenType(type),
        usedAt: null,
      },
      data: {
        usedAt: new Date(),
      },
    });
  }

  private mapToEntity(tokenRecord: any): VerificationToken {
    return new VerificationToken(
      tokenRecord.id,
      tokenRecord.token,
      tokenRecord.userId,
      this.mapToDomainTokenType(tokenRecord.type),
      tokenRecord.expiresAt,
      tokenRecord.usedAt,
      tokenRecord.createdAt,
    );
  }

  private mapToPrismaTokenType(type: TokenType): PrismaTokenType {
    return type as unknown as PrismaTokenType;
  }

  private mapToDomainTokenType(type: PrismaTokenType): TokenType {
    return type as unknown as TokenType;
  }
}
