import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { CleanupExpiredTokensTask } from '@infrastructure/tasks/cleanup-expired-tokens.task';
import { CleanupVerificationTokensTask } from '@infrastructure/tasks/cleanup-verification-tokens.task';
import { RefreshTokenRepository } from '@infrastructure/persistence/repositories/refresh-token.repository';
import { VerificationTokenRepository } from '@infrastructure/persistence/repositories/verification-token.repository';
import { PrismaModule } from '@infrastructure/persistence/prisma/prisma.module';

@Module({
  imports: [ScheduleModule.forRoot(), PrismaModule],
  providers: [
    // Tasks
    CleanupExpiredTokensTask,
    CleanupVerificationTokensTask,

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
