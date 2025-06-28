import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '@infrastructure/persistence/prisma/prisma.module';
import { SecurityModule } from '@modules/security/security.module';

// Services
import { AesEncryptionService } from '@infrastructure/crypto/aes-encryption.service';
import { KeyRotationService } from '@infrastructure/crypto/key-rotation.service';
import { EncryptionAdapter } from '@infrastructure/crypto/encryption.adapter';

// Repositories
import { EncryptionKeyRepository } from '@infrastructure/persistence/repositories/encryption-key.repository';
import { EncryptedDataRepository } from '@infrastructure/persistence/repositories/encrypted-data.repository';

// Use Cases
import { RotateEncryptionKeysUseCase } from '@application/use-cases/crypto/rotate-encryption-keys.use-case';
import { GetEncryptionStatusUseCase } from '@application/use-cases/crypto/get-encryption-status.use-case';

// Tasks
import { KeyRotationTask } from '@infrastructure/tasks/key-rotation.task';

// Config
import cryptoConfig from '@infrastructure/config/crypto.config';

@Module({
  imports: [
    ConfigModule.forFeature(cryptoConfig),
    PrismaModule,
    SecurityModule,
  ],
  providers: [
    // Repositories
    {
      provide: 'IEncryptionKeyRepository',
      useClass: EncryptionKeyRepository,
    },
    {
      provide: 'IEncryptedDataRepository',
      useClass: EncryptedDataRepository,
    },

    // Services
    {
      provide: 'IEncryptionService',
      useClass: AesEncryptionService,
    },
    {
      provide: 'IKeyRotationService',
      useClass: KeyRotationService,
    },
    {
      provide: 'EncryptionAdapter',
      useClass: EncryptionAdapter,
    },

    // Services concrets pour l'injection
    AesEncryptionService,
    KeyRotationService,

    // Use Cases
    RotateEncryptionKeysUseCase,
    GetEncryptionStatusUseCase,

    // Tasks
    KeyRotationTask,
  ],
  exports: [
    'IEncryptionService',
    'IKeyRotationService',
    'EncryptionAdapter',
    RotateEncryptionKeysUseCase,
    GetEncryptionStatusUseCase,
  ],
})
export class CryptoModule {}
