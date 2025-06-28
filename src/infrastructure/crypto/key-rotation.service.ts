import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  IKeyRotationService,
  KeyRotationResult,
} from '@domain/services/key-rotation.service.interface';
import { IEncryptionKeyRepository } from '@domain/repositories/encryption-key.repository.interface';
import { IEncryptedDataRepository } from '@domain/repositories/encrypted-data.repository.interface';
import { AesEncryptionService } from './aes-encryption.service';
import { KeyRotationException } from '@domain/exceptions/crypto.exception';

@Injectable()
export class KeyRotationService implements IKeyRotationService {
  private readonly logger = new Logger(KeyRotationService.name);
  private readonly BATCH_SIZE = 100;
  private readonly KEY_LIFETIME_DAYS = 90;

  constructor(
    @Inject('IEncryptedDataRepository')
    private readonly encryptedDataRepository: IEncryptedDataRepository,
    @Inject('IEncryptionKeyRepository')
    private readonly encryptionKeyRepository: IEncryptionKeyRepository,
    @Inject('IEncryptionService')
    private readonly encryptionService: AesEncryptionService,
  ) {}

  async rotateKeys(): Promise<KeyRotationResult> {
    const startTime = Date.now();

    try {
      this.logger.log('Starting key rotation process');

      // 1. Créer une nouvelle clé
      const { key, encryptedKey } = this.encryptionService.generateDataKey();

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + this.KEY_LIFETIME_DAYS);

      const newKey = await this.encryptionKeyRepository.create(
        encryptedKey,
        'aes-256-gcm',
        expiresAt,
      );

      this.logger.log(`Created new encryption key version ${newKey.version}`);

      // 2. Désactiver l'ancienne clé active
      const oldActiveKey = await this.encryptionKeyRepository.findActiveKey();

      if (oldActiveKey) {
        await this.encryptionKeyRepository.update(oldActiveKey.id, {
          isActive: false,
          rotatedAt: new Date(),
        });
      }

      // 3. Activer la nouvelle clé
      await this.encryptionKeyRepository.update(newKey.id, {
        isActive: true,
      });

      // 4. Rechiffrer les données existantes
      const rotatedDataCount = await this.reencryptData(
        oldActiveKey?.version || 0,
        newKey.version,
        key,
      );

      const duration = Date.now() - startTime;

      this.logger.log(
        `Key rotation completed: ${rotatedDataCount} records re-encrypted in ${duration}ms`,
      );

      return {
        newKeyVersion: newKey.version,
        rotatedDataCount,
        duration,
      };
    } catch (error) {
      this.logger.error('Key rotation failed', error);
      throw new KeyRotationException('Failed to rotate encryption keys');
    }
  }

  async shouldRotate(): Promise<boolean> {
    const activeKey = await this.encryptionKeyRepository.findActiveKey();

    if (!activeKey) {
      return true; // Pas de clé active
    }

    return activeKey.shouldRotate();
  }

  async getRotationStatus(): Promise<{
    currentKeyVersion: number;
    lastRotation: Date | null;
    nextRotation: Date;
    keysToRotate: number;
  }> {
    const activeKey = await this.encryptionKeyRepository.findActiveKey();

    if (!activeKey) {
      throw new KeyRotationException('No active encryption key found');
    }

    const allActiveKeys = await this.encryptionKeyRepository.findAllActive();
    const keysToRotate = allActiveKeys.filter((key) =>
      key.shouldRotate(),
    ).length;

    const nextRotation = new Date(activeKey.createdAt);
    nextRotation.setDate(nextRotation.getDate() + this.KEY_LIFETIME_DAYS);

    return {
      currentKeyVersion: activeKey.version,
      lastRotation: activeKey.rotatedAt,
      nextRotation,
      keysToRotate,
    };
  }

  private async reencryptData(
    oldVersion: number,
    newVersion: number,
    newKey: Buffer,
  ): Promise<number> {
    let processedCount = 0;
    let hasMore = true;

    while (hasMore) {
      // Récupérer un batch de données à rechiffrer
      const batch = await this.encryptedDataRepository.findByKeyVersion(
        oldVersion,
        this.BATCH_SIZE,
      );

      if (batch.length === 0) {
        hasMore = false;
        break;
      }

      // Rechiffrer chaque enregistrement
      for (const record of batch) {
        try {
          // Déchiffrer avec l'ancienne clé
          const plaintext = await this.encryptionService.decrypt(
            record.encryptedData,
          );

          // Rechiffrer avec la nouvelle clé
          const { encryptedData } = this.encryptionService.encryptWithKey(
            plaintext,
            newKey,
            newVersion,
          );

          // Mettre à jour l'enregistrement
          await this.encryptedDataRepository.upsert({
            ...record,
            encryptedData,
            keyVersion: newVersion,
          });

          processedCount++;
        } catch (error) {
          this.logger.error(
            `Failed to re-encrypt data for ${record.entityType}:${record.entityId}:${record.fieldName}`,
            error,
          );
          // Continuer avec le prochain enregistrement
        }
      }

      // Pause pour éviter de surcharger la base de données
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    return processedCount;
  }
}
