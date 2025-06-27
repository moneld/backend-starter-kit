// src/modules/security/security.module.ts
import { Module } from '@nestjs/common';
import { SecurityAdminController } from '@infrastructure/web/controllers/security-admin.controller';
import { AccountLockService } from '@infrastructure/services/account-lock.service';
import { SessionManagerService } from '@infrastructure/services/session-manager.service';
import { SecurityMonitoringService } from '@infrastructure/services/security-monitoring.service';
import { SessionRepository } from '@infrastructure/persistence/repositories/session.repository';
import { SecurityEventRepository } from '@infrastructure/persistence/repositories/security-event.repository';
import { UnlockUserUseCase } from '@application/use-cases/auth/unlock-user.use-case';
import { GetSecurityStatsUseCase } from '@application/use-cases/auth/get-security-stats.use-case';
import { ForceLogoutUseCase } from '@application/use-cases/auth/force-logout.use-case';
import { PrismaModule } from '@infrastructure/persistence/prisma/prisma.module';
import { UserRepository } from '@infrastructure/persistence/repositories/user.repository';
import { RefreshTokenRepository } from '@infrastructure/persistence/repositories/refresh-token.repository';

@Module({
  imports: [
    PrismaModule,
    // Retirer AuthModule car il cause une dépendance circulaire
  ],
  controllers: [SecurityAdminController],
  providers: [
    // Repositories
    {
      provide: 'IUserRepository',
      useClass: UserRepository,
    },
    {
      provide: 'IRefreshTokenRepository',
      useClass: RefreshTokenRepository,
    },
    {
      provide: 'ISessionRepository',
      useClass: SessionRepository,
    },
    {
      provide: 'ISecurityEventRepository',
      useClass: SecurityEventRepository,
    },

    // Services
    {
      provide: 'IAccountLockService',
      useClass: AccountLockService,
    },
    {
      provide: 'ISessionManagerService',
      useClass: SessionManagerService,
    },
    {
      provide: 'ISecurityMonitoringService',
      useClass: SecurityMonitoringService,
    },

    // Use Cases
    {
      provide: UnlockUserUseCase,
      useFactory: (
        userRepository: UserRepository,
        accountLockService: AccountLockService,
      ) => {
        return new UnlockUserUseCase(userRepository, accountLockService);
      },
      inject: ['IUserRepository', 'IAccountLockService'],
    },
    {
      provide: GetSecurityStatsUseCase,
      useFactory: (securityMonitoringService: SecurityMonitoringService) => {
        return new GetSecurityStatsUseCase(securityMonitoringService);
      },
      inject: ['ISecurityMonitoringService'],
    },
    {
      provide: ForceLogoutUseCase,
      useFactory: (
        userRepository: UserRepository,
        sessionManagerService: SessionManagerService,
        refreshTokenRepository: RefreshTokenRepository,
      ) => {
        return new ForceLogoutUseCase(
          userRepository,
          sessionManagerService,
          refreshTokenRepository,
        );
      },
      inject: [
        'IUserRepository',
        'ISessionManagerService',
        'IRefreshTokenRepository',
      ],
    },
  ],
  exports: [
    'IAccountLockService',
    'ISessionManagerService',
    'ISecurityMonitoringService',
    'ISessionRepository',
    'ISecurityEventRepository',
  ],
})
export class SecurityModule {}
