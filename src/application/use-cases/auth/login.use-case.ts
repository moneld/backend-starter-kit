
import { Inject, Injectable, Logger } from '@nestjs/common';
import { IUserRepository } from '@domain/repositories/user.repository.interface';
import {
  EmailNotVerifiedException,
  InvalidCredentialsException,
} from '@domain/exceptions/domain.exception';
import { IHashingService } from '@domain/services/hashing.service.interface';
import { IAccountLockService } from '@domain/services/account-lock.service.interface';
import { ISecurityMonitoringService } from '@domain/services/security-monitoring.service.interface';
import { SecurityEventType } from '@domain/entities/security-event.entity';

@Injectable()
export class LoginUseCase {
  private readonly logger = new Logger(LoginUseCase.name);

  constructor(
    private readonly userRepository: IUserRepository,
    private readonly hashingService: IHashingService,
    @Inject('IAccountLockService')
    private readonly accountLockService: IAccountLockService,
    @Inject('ISecurityMonitoringService')
    private readonly securityMonitoringService: ISecurityMonitoringService,
  ) {}

  async execute(
    email: string,
    password: string,
    ipAddress: string,
    userAgent: string,
  ) {
    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      // Log failed attempt without revealing user existence
      await this.securityMonitoringService.logSecurityEvent(
        SecurityEventType.LOGIN_FAILED,
        undefined, // Changé de null à undefined
        ipAddress,
        userAgent,
        { reason: 'User not found', email },
      );
      throw new InvalidCredentialsException();
    }

    // Check if account is locked
    if (user.isLocked()) {
      this.logger.warn(`Login attempt on locked account: ${user.id}`);
      throw new InvalidCredentialsException();
    }

    // Verify password
    const isPasswordValid = await this.hashingService.compare(
      password,
      user.password,
    );

    if (!isPasswordValid) {
      // Handle failed login
      const isLocked = await this.accountLockService.handleFailedLogin(user.id);

      await this.securityMonitoringService.logSecurityEvent(
        SecurityEventType.LOGIN_FAILED,
        user.id,
        ipAddress,
        userAgent,
        { reason: 'Invalid password' },
      );

      // Check for suspicious activity
      await this.securityMonitoringService.detectSuspiciousActivity(
        user.id,
        ipAddress,
      );

      throw new InvalidCredentialsException();
    }

    // Check email verification
    if (!user.isEmailVerified) {
      throw new EmailNotVerifiedException();
    }

    // Reset failed attempts on successful login
    if (user.failedLoginAttempts > 0) {
      await this.userRepository.update(user.id, {
        failedLoginAttempts: 0,
        lastFailedAttempt: null,
      });
    }

    // Log successful login
    await this.securityMonitoringService.logSecurityEvent(
      SecurityEventType.LOGIN_SUCCESS,
      user.id,
      ipAddress,
      userAgent,
    );

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
  }
}
