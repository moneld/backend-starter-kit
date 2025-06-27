import { Inject, Injectable, Logger } from '@nestjs/common';
import { IAccountLockService } from '@domain/services/account-lock.service.interface';
import { IUserRepository } from '@domain/repositories/user.repository.interface';
import { ISecurityEventRepository } from '@domain/repositories/security-event.repository.interface';
import { SecurityEventType } from '@domain/entities/security-event.entity';

@Injectable()
export class AccountLockService implements IAccountLockService {
  private readonly logger = new Logger(AccountLockService.name);
  private readonly MAX_FAILED_ATTEMPTS = 3;
  private readonly LOCK_DURATION_MINUTES = 15;

  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Inject('ISecurityEventRepository')
    private readonly securityEventRepository: ISecurityEventRepository,
  ) {}

  async handleFailedLogin(userId: string): Promise<boolean> {
    const user = await this.userRepository.findById(userId);
    if (!user) return false;

    // Reset failed attempts if needed
    let failedAttempts = user.failedLoginAttempts;
    if (user.shouldResetFailedAttempts()) {
      failedAttempts = 0;
    }

    failedAttempts++;

    // Check if account should be locked
    const shouldLock = failedAttempts >= this.MAX_FAILED_ATTEMPTS;
    const lockedUntil = shouldLock
      ? new Date(Date.now() + this.LOCK_DURATION_MINUTES * 60 * 1000)
      : null;

    // Update user
    await this.userRepository.update(userId, {
      failedLoginAttempts: failedAttempts,
      lastFailedAttempt: new Date(),
      lockedUntil: lockedUntil,
    });

    // Log security event
    if (shouldLock) {
      await this.securityEventRepository.create(
        SecurityEventType.ACCOUNT_LOCKED,
        userId,
        null,
        null,
        { failedAttempts, lockDuration: this.LOCK_DURATION_MINUTES },
      );

      this.logger.warn(
        `Account locked for user ${userId} after ${failedAttempts} failed attempts`,
      );
    }

    return shouldLock;
  }

  async unlockAccount(userId: string): Promise<void> {
    await this.userRepository.update(userId, {
      failedLoginAttempts: 0,
      lockedUntil: null,
      lastFailedAttempt: null,
    });

    await this.securityEventRepository.create(
      SecurityEventType.ACCOUNT_UNLOCKED,
      userId,
    );

    this.logger.log(`Account unlocked for user ${userId}`);
  }

  async isAccountLocked(userId: string): Promise<boolean> {
    const user = await this.userRepository.findById(userId);
    return user?.isLocked() ?? false;
  }

  async getLockedAccounts(): Promise<
    Array<{
      userId: string;
      lockedUntil: Date;
      failedAttempts: number;
    }>
  > {
    // This would need a new method in UserRepository
    // For now, returning empty array - implementation depends on your needs
    return [];
  }
}
