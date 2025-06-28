import { EncryptionKey } from '../entities/encryption-key.entity';

export interface IEncryptionKeyRepository {
  create(
    key: string,
    algorithm: string,
    expiresAt: Date,
  ): Promise<EncryptionKey>;

  findById(id: string): Promise<EncryptionKey | null>;

  findByVersion(version: number): Promise<EncryptionKey | null>;

  findActiveKey(): Promise<EncryptionKey | null>;

  findAllActive(): Promise<EncryptionKey[]>;

  update(
    id: string,
    data: Partial<{
      isActive: boolean;
      rotatedAt: Date;
    }>,
  ): Promise<EncryptionKey>;

  countByVersionRange(
    startVersion: number,
    endVersion: number,
  ): Promise<number>;
}