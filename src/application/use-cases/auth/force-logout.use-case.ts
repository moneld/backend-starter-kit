// src/application/use-cases/auth/force-logout.use-case.ts
import { Inject, Injectable } from '@nestjs/common';
import { IUserRepository } from '@domain/repositories/user.repository.interface';
import { ISessionManagerService } from '@domain/services/session-manager.service.interface';
import { IRefreshTokenRepository } from '@domain/repositories/refresh-token.repository.interface';
import { UserNotFoundException } from '@domain/exceptions/domain.exception';

@Injectable()
export class ForceLogoutUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    @Inject('ISessionManagerService')
    private readonly sessionManagerService: ISessionManagerService,
    @Inject('IRefreshTokenRepository')
    private readonly refreshTokenRepository: IRefreshTokenRepository,
  ) {}

  async execute(adminId: string, targetUserId: string): Promise<void> {
    const user = await this.userRepository.findById(targetUserId);

    if (!user) {
      throw new UserNotFoundException(targetUserId);
    }

    // Terminate all sessions
    await this.sessionManagerService.terminateAllUserSessions(targetUserId);

    // Revoke all refresh tokens
    await this.refreshTokenRepository.revokeAllUserTokens(targetUserId);
  }
}
