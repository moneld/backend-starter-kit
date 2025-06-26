import { Injectable, Logger } from '@nestjs/common';
import { IUserRepository } from '@domain/repositories/user.repository.interface';
import { IRefreshTokenRepository } from '@domain/repositories/refresh-token.repository.interface';
import { IHashingService } from '@domain/services/hashing.service.interface';
import {
  InvalidCredentialsException,
  UserNotFoundException,
} from '@domain/exceptions/domain.exception';
import { Password } from '@domain/value-objects/password.value-object';

@Injectable()
export class ChangePasswordUseCase {
  private readonly logger = new Logger(ChangePasswordUseCase.name);

  constructor(
    private readonly userRepository: IUserRepository,
    private readonly refreshTokenRepository: IRefreshTokenRepository,
    private readonly hashingService: IHashingService,
  ) {}

  async execute(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new UserNotFoundException(userId);
    }

    // Verify current password
    const isPasswordValid = await this.hashingService.compare(
      currentPassword,
      user.password,
    );

    if (!isPasswordValid) {
      this.logger.warn(`Invalid current password for user: ${userId}`);
      throw new InvalidCredentialsException();
    }

    // Validate new password
    const passwordVO = new Password(newPassword);

    // Ensure new password is different from current
    const isSamePassword = await this.hashingService.compare(
      newPassword,
      user.password,
    );

    if (isSamePassword) {
      throw new InvalidCredentialsException();
    }

    // Hash new password
    const hashedPassword = await this.hashingService.hash(
      passwordVO.getValue(),
    );

    // Update user password
    await this.userRepository.update(userId, {
      password: hashedPassword,
    });

    // Revoke all refresh tokens (force re-login on all devices)
    await this.refreshTokenRepository.revokeAllUserTokens(userId);

    this.logger.log(`Password changed successfully for user: ${userId}`);
  }
}
