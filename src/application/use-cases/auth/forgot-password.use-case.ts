import { Injectable, Logger } from '@nestjs/common';
import { IUserRepository } from '@domain/repositories/user.repository.interface';
import { IVerificationTokenRepository } from '@domain/repositories/verification-token.repository.interface';
import { IEmailService } from '@domain/services/email.service.interface';
import { TokenType } from '@domain/entities/verification-token.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ForgotPasswordUseCase {
  private readonly logger = new Logger(ForgotPasswordUseCase.name);

  constructor(
    private readonly userRepository: IUserRepository,
    private readonly verificationTokenRepository: IVerificationTokenRepository,
    private readonly emailService: IEmailService,
  ) {}

  async execute(email: string): Promise<void> {
    // Always return success to prevent email enumeration
    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      // Log the attempt but don't reveal to the user
      this.logger.warn(
        `Password reset requested for non-existent email: ${email}`,
      );
      return;
    }

    // Invalidate previous reset tokens
    await this.verificationTokenRepository.invalidateUserTokensByType(
      user.id,
      TokenType.PASSWORD_RESET,
    );

    // Generate new token
    const token = uuidv4();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour expiration

    await this.verificationTokenRepository.create(
      user.id,
      token,
      TokenType.PASSWORD_RESET,
      expiresAt,
    );

    // Send email
    try {
      await this.emailService.sendPasswordResetEmail(
        user.email,
        user.name,
        token,
      );
      this.logger.log(`Password reset email sent to user: ${user.id}`);
    } catch (error) {
      this.logger.error(
        `Failed to send password reset email to user: ${user.id}`,
        error,
      );
      // Don't throw - security best practice
    }
  }
}
