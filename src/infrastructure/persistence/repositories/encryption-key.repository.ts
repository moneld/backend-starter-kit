import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IEncryptionKeyRepository } from '@domain/repositories/encryption-key.repository.interface';
import { EncryptionKey } from '@domain/entities/encryption-key.entity';

@Injectable()
export class EncryptionKeyRepository implements IEncryptionKeyRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    key: string,
    algorithm: string,
    expiresAt: Date,
  ): Promise<EncryptionKey> {
    const keyRecord = await this.prisma.encryptionKey.create({
      data: {
        key,
        algorithm,
        expiresAt,
      },
    });

    return this.mapToEntity(keyRecord);
  }

  async findById(id: string): Promise<EncryptionKey | null> {
    const keyRecord = await this.prisma.encryptionKey.findUnique({
      where: { id },
    });

    return keyRecord ? this.mapToEntity(keyRecord) : null;
  }

  async findByVersion(version: number): Promise<EncryptionKey | null> {
    const keyRecord = await this.prisma.encryptionKey.findUnique({
      where: { version },
    });

    return keyRecord ? this.mapToEntity(keyRecord) : null;
  }

  async findActiveKey(): Promise<EncryptionKey | null> {
    const keyRecord = await this.prisma.encryptionKey.findFirst({
      where: {
        isActive: true,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        version: 'desc',
      },
    });

    return keyRecord ? this.mapToEntity(keyRecord) : null;
  }

  async findAllActive(): Promise<EncryptionKey[]> {
    const keys = await this.prisma.encryptionKey.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        version: 'desc',
      },
    });

    return keys.map(this.mapToEntity);
  }

  async update(
    id: string,
    data: Partial<{
      isActive: boolean;
      rotatedAt: Date;
    }>,
  ): Promise<EncryptionKey> {
    const keyRecord = await this.prisma.encryptionKey.update({
      where: { id },
      data,
    });

    return this.mapToEntity(keyRecord);
  }

  async countByVersionRange(
    startVersion: number,
    endVersion: number,
  ): Promise<number> {
    return this.prisma.encryptionKey.count({
      where: {
        version: {
          gte: startVersion,
          lte: endVersion,
        },
      },
    });
  }

  private mapToEntity(keyRecord: any): EncryptionKey {
    return new EncryptionKey(
      keyRecord.id,
      keyRecord.version,
      keyRecord.key,
      keyRecord.algorithm,
      keyRecord.isActive,
      keyRecord.rotatedAt,
      keyRecord.createdAt,
      keyRecord.expiresAt,
    );
  }
}