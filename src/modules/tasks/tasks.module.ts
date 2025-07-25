import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { CleanupExpiredTokensTask } from '@infrastructure/tasks/cleanup-expired-tokens.task';
import { CleanupVerificationTokensTask } from '@infrastructure/tasks/cleanup-verification-tokens.task';
import { CleanupExpiredSessionsTask } from '@infrastructure/tasks/cleanup-expired-sessions.task';
import { RefreshTokenRepository } from '@infrastructure/persistence/repositories/refresh-token.repository';
import { VerificationTokenRepository } from '@infrastructure/persistence/repositories/verification-token.repository';
import { PrismaModule } from '@infrastructure/persistence/prisma/prisma.module';
import { SecurityModule } from '@modules/security/security.module';
import { CryptoModule } from '@modules/crypto/crypto.module'; // NOUVEAU

@Module({
  imports: [
    ScheduleModule.forRoot(),
    PrismaModule,
    SecurityModule,
    CryptoModule, // NOUVEAU
  ],
  providers: [
    // Tasks existantes
    CleanupExpiredTokensTask,
    CleanupVerificationTokensTask,
    CleanupExpiredSessionsTask,
    // KeyRotationTask est maintenant fournie par CryptoModule

    // Repositories
    {
      provide: 'IRefreshTokenRepository',
      useClass: RefreshTokenRepository,
    },
    {
      provide: 'IVerificationTokenRepository',
      useClass: VerificationTokenRepository,
    },
  ],
})
export class TasksModule {}
