import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  EncryptedDataRecord,
  IEncryptedDataRepository,
} from '@domain/repositories/encrypted-data.repository.interface';

@Injectable()
export class EncryptedDataRepository implements IEncryptedDataRepository {
  constructor(private readonly prisma: PrismaService) {}

  async upsert(data: EncryptedDataRecord): Promise<void> {
    await this.prisma.encryptedData.upsert({
      where: {
        entityType_entityId_fieldName: {
          entityType: data.entityType,
          entityId: data.entityId,
          fieldName: data.fieldName,
        },
      },
      create: data,
      update: {
        encryptedData: data.encryptedData,
        keyVersion: data.keyVersion,
      },
    });
  }

  async find(
    entityType: string,
    entityId: string,
    fieldName: string,
  ): Promise<EncryptedDataRecord | null> {
    const record = await this.prisma.encryptedData.findUnique({
      where: {
        entityType_entityId_fieldName: {
          entityType,
          entityId,
          fieldName,
        },
      },
    });

    return record ? this.mapToRecord(record) : null;
  }

  async findByKeyVersion(
    keyVersion: number,
    limit: number,
  ): Promise<EncryptedDataRecord[]> {
    const records = await this.prisma.encryptedData.findMany({
      where: {
        keyVersion,
      },
      take: limit,
    });

    return records.map(this.mapToRecord);
  }

  async updateKeyVersion(
    id: string,
    encryptedData: string,
    newKeyVersion: number,
  ): Promise<void> {
    await this.prisma.encryptedData.update({
      where: { id },
      data: {
        encryptedData,
        keyVersion: newKeyVersion,
      },
    });
  }

  async delete(
    entityType: string,
    entityId: string,
    fieldName: string,
  ): Promise<void> {
    await this.prisma.encryptedData.delete({
      where: {
        entityType_entityId_fieldName: {
          entityType,
          entityId,
          fieldName,
        },
      },
    });
  }

  private mapToRecord(data: any): EncryptedDataRecord {
    return {
      entityType: data.entityType,
      entityId: data.entityId,
      fieldName: data.fieldName,
      encryptedData: data.encryptedData,
      keyVersion: data.keyVersion,
    };
  }
}
