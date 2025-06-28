import { Inject, Injectable } from '@nestjs/common';
import { IEncryptionService } from '@domain/services/encryption.service.interface';
import { IEncryptedDataRepository } from '@domain/repositories/encrypted-data.repository.interface';

@Injectable()
export class EncryptionAdapter {
  constructor(
    @Inject('IEncryptionService')
    private readonly encryptionService: IEncryptionService,
    @Inject('IEncryptedDataRepository')
    private readonly encryptedDataRepository: IEncryptedDataRepository,
  ) {}

  async encryptField(
    entityType: string,
    entityId: string,
    fieldName: string,
    value: string,
  ): Promise<void> {
    const { encryptedData, keyVersion } =
      await this.encryptionService.encrypt(value);

    await this.encryptedDataRepository.upsert({
      entityType,
      entityId,
      fieldName,
      encryptedData,
      keyVersion,
    });
  }

  async decryptField(
    entityType: string,
    entityId: string,
    fieldName: string,
  ): Promise<string | null> {
    const record = await this.encryptedDataRepository.find(
      entityType,
      entityId,
      fieldName,
    );

    if (!record) {
      return null;
    }

    return this.encryptionService.decrypt(record.encryptedData);
  }

  async deleteField(
    entityType: string,
    entityId: string,
    fieldName: string,
  ): Promise<void> {
    await this.encryptedDataRepository.delete(entityType, entityId, fieldName);
  }
}
