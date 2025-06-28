import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import {
  EncryptionResult,
  IEncryptionService,
} from '@domain/services/encryption.service.interface';
import { IEncryptionKeyRepository } from '@domain/repositories/encryption-key.repository.interface';
import {
  DecryptionException,
  EncryptionException,
  KeyNotFoundException,
} from '@domain/exceptions/crypto.exception';
import { EncryptedData } from '@domain/value-objects/encrypted-data.value-object';

@Injectable()
export class AesEncryptionService implements IEncryptionService {
  private readonly logger = new Logger(AesEncryptionService.name);
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyLength = 32; // 256 bits
  private readonly ivLength = 16; // 128 bits
  private readonly tagLength = 16; // 128 bits
  private masterKey!: Buffer;

  constructor(
    private readonly configService: ConfigService,
    @Inject('IEncryptionKeyRepository')
    private readonly encryptionKeyRepository: IEncryptionKeyRepository,
  ) {
    this.initializeMasterKey();
  }

  private initializeMasterKey(): void {
    const masterKeyBase64 = this.configService.get<string>('crypto.masterKey');

    if (!masterKeyBase64) {
      throw new EncryptionException('Master encryption key not configured');
    }

    this.masterKey = Buffer.from(masterKeyBase64, 'base64');

    if (this.masterKey.length !== this.keyLength) {
      throw new EncryptionException(
        `Master key must be ${this.keyLength} bytes (${this.keyLength * 8} bits)`,
      );
    }
  }

  async encrypt(plaintext: string): Promise<EncryptionResult> {
    try {
      // Obtenir la clé active
      const activeKey = await this.encryptionKeyRepository.findActiveKey();

      if (!activeKey) {
        throw new KeyNotFoundException('No active encryption key found');
      }

      // Déchiffrer la clé avec la master key
      const decryptedKey = this.decryptMasterKey(activeKey.key);

      // Chiffrer les données
      return this.encryptWithKey(plaintext, decryptedKey, activeKey.version);
    } catch (error) {
      this.logger.error('Encryption failed', error);
      if (error instanceof EncryptionException) throw error;
      throw new EncryptionException('Failed to encrypt data');
    }
  }

  async decrypt(encryptedData: string): Promise<string> {
    try {
      // Parser les données chiffrées
      const encrypted = new EncryptedData(encryptedData);

      // Obtenir la clé correspondante
      const key = await this.encryptionKeyRepository.findByVersion(
        encrypted.version,
      );

      if (!key) {
        throw new KeyNotFoundException(
          `Key version ${encrypted.version} not found`,
        );
      }

      // Déchiffrer la clé avec la master key
      const decryptedKey = this.decryptMasterKey(key.key);

      // Déchiffrer les données
      return this.decryptWithKey(encryptedData, decryptedKey);
    } catch (error) {
      this.logger.error('Decryption failed', error);
      if (error instanceof DecryptionException) throw error;
      throw new DecryptionException('Failed to decrypt data');
    }
  }

  encryptWithKey(
    plaintext: string,
    key: Buffer,
    keyVersion: number,
  ): EncryptionResult {
    // Générer un IV unique
    const iv = crypto.randomBytes(this.ivLength);

    // Créer le cipher
    const cipher = crypto.createCipheriv(this.algorithm, key, iv);

    // Chiffrer les données
    const encrypted = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final(),
    ]);

    // Obtenir le tag d'authentification
    const authTag = cipher.getAuthTag();

    // Créer l'objet EncryptedData
    const encryptedData = EncryptedData.create(
      keyVersion,
      iv.toString('base64'),
      authTag.toString('base64'),
      encrypted.toString('base64'),
    );

    return {
      encryptedData: encryptedData.serialize(),
      keyVersion,
    };
  }

  decryptWithKey(encryptedData: string, key: Buffer): string {
    // Parser les données chiffrées
    const encrypted = new EncryptedData(encryptedData);

    // Convertir depuis base64
    const iv = Buffer.from(encrypted.iv, 'base64');
    const authTag = Buffer.from(encrypted.authTag, 'base64');
    const ciphertext = Buffer.from(encrypted.ciphertext, 'base64');

    // Créer le decipher
    const decipher = crypto.createDecipheriv(this.algorithm, key, iv);
    decipher.setAuthTag(authTag);

    try {
      // Déchiffrer les données
      const decrypted = Buffer.concat([
        decipher.update(ciphertext),
        decipher.final(),
      ]);

      return decrypted.toString('utf8');
    } catch (error) {
      throw new DecryptionException('Authentication failed or data corrupted');
    }
  }

  private encryptMasterKey(key: Buffer): string {
    const iv = crypto.randomBytes(this.ivLength);
    const cipher = crypto.createCipheriv(this.algorithm, this.masterKey, iv);

    const encrypted = Buffer.concat([cipher.update(key), cipher.final()]);

    const authTag = cipher.getAuthTag();

    // Format: iv:authTag:ciphertext
    return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted.toString('base64')}`;
  }

  private decryptMasterKey(encryptedKey: string): Buffer {
    const parts = encryptedKey.split(':');

    if (parts.length !== 3) {
      throw new DecryptionException('Invalid master key format');
    }

    const [ivBase64, authTagBase64, ciphertextBase64] = parts;

    const iv = Buffer.from(ivBase64, 'base64');
    const authTag = Buffer.from(authTagBase64, 'base64');
    const ciphertext = Buffer.from(ciphertextBase64, 'base64');

    const decipher = crypto.createDecipheriv(
      this.algorithm,
      this.masterKey,
      iv,
    );
    decipher.setAuthTag(authTag);

    try {
      const decrypted = Buffer.concat([
        decipher.update(ciphertext),
        decipher.final(),
      ]);

      return decrypted;
    } catch (error) {
      throw new DecryptionException('Failed to decrypt master key');
    }
  }

  generateDataKey(): { key: Buffer; encryptedKey: string } {
    // Générer une nouvelle clé de données
    const key = crypto.randomBytes(this.keyLength);

    // Chiffrer avec la master key
    const encryptedKey = this.encryptMasterKey(key);

    return { key, encryptedKey };
  }
}
