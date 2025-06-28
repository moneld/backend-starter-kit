import { Inject, Injectable } from '@nestjs/common';
import { IKeyRotationService } from '@domain/services/key-rotation.service.interface';
import { IEncryptionKeyRepository } from '@domain/repositories/encryption-key.repository.interface';

@Injectable()
export class GetEncryptionStatusUseCase {
  constructor(
    @Inject('IKeyRotationService')
    private readonly keyRotationService: IKeyRotationService,
    @Inject('IEncryptionKeyRepository')
    private readonly encryptionKeyRepository: IEncryptionKeyRepository,
  ) {}

  async execute() {
    const rotationStatus = await this.keyRotationService.getRotationStatus();
    const activeKey = await this.encryptionKeyRepository.findActiveKey();
    const allKeys = await this.encryptionKeyRepository.findAllActive();

    return {
      encryption: {
        algorithm: activeKey?.algorithm || 'aes-256-gcm',
        activeKeyVersion: activeKey?.version || null,
        activeKeyCreatedAt: activeKey?.createdAt || null,
        activeKeyExpiresAt: activeKey?.expiresAt || null,
      },
      rotation: rotationStatus,
      keys: {
        total: allKeys.length,
        active: allKeys.filter((k) => k.isActive).length,
        expired: allKeys.filter((k) => k.isExpired()).length,
        needsRotation: allKeys.filter((k) => k.shouldRotate()).length,
      },
    };
  }
}
