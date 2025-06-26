import { Injectable, Logger } from '@nestjs/common';
import { IVerificationTokenRepository } from '@domain/repositories/verification-token.repository.interface';
import { IUserRepository } from '@domain/repositories/user.repository.interface';
import { IRefreshTokenRepository } from '@domain/repositories/refresh-token.repository.interface';
import { IHashingService } from '@domain/services/hashing.service.interface';
import { InvalidVerificationTokenException } from '@domain/exceptions/domain.exception';
import { TokenType } from '@domain/entities/verification-token.entity';
import { Password } from '@domain/value-objects/password.value-object';

@Injectable()
export class ResetPasswordUseCase {
  private readonly logger = new Logger(ResetPasswordUseCase.name);

  constructor(
    private readonly verificationTokenRepository: IVerificationTokenRepository,
    private readonly userRepository: IUserRepository,
    private readonly refreshTokenRepository: IRefreshTokenRepository,
    private readonly hashingService: IHashingService,
  ) {}

  async execute(token: string, newPassword: string): Promise<void> {
    // Validate token
    const verificationToken =
      await this.verificationTokenRepository.findByToken(token);

    if (!verificationToken) {
      this.logger.warn(`Invalid password reset token attempted: ${token}`);
      throw new InvalidVerificationTokenException(
        'Invalid or expired reset token',
      );
    }

    if (!verificationToken.isValid()) {
      this.logger.warn(
        `Expired or used password reset token attempted: ${token}`,
      );
      throw new InvalidVerificationTokenException(
        'Invalid or expired reset token',
      );
    }

    if (verificationToken.type !== TokenType.PASSWORD_RESET) {
      this.logger.warn(`Wrong token type used for password reset: ${token}`);
      throw new InvalidVerificationTokenException('Invalid token type');
    }

    // Validate new password
    const passwordVO = new Password(newPassword);

    // Hash new password
    const hashedPassword = await this.hashingService.hash(
      passwordVO.getValue(),
    );

    // Update user password
    await this.userRepository.update(verificationToken.userId, {
      password: hashedPassword,
    });

    // Mark token as used
    await this.verificationTokenRepository.markAsUsed(token);

    // Revoke all refresh tokens (force re-login)
    await this.refreshTokenRepository.revokeAllUserTokens(
      verificationToken.userId,
    );

    this.logger.log(
      `Password reset completed for user: ${verificationToken.userId}`,
    );
  }
}
