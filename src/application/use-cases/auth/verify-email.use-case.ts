import { Injectable } from '@nestjs/common';
import { IVerificationTokenRepository } from '@domain/repositories/verification-token.repository.interface';
import { IUserRepository } from '@domain/repositories/user.repository.interface';
import { IEmailService } from '@domain/services/email.service.interface';
import { InvalidVerificationTokenException } from '@domain/exceptions/domain.exception';
import { TokenType } from '@domain/entities/verification-token.entity';

@Injectable()
export class VerifyEmailUseCase {
  constructor(
    private readonly verificationTokenRepository: IVerificationTokenRepository,
    private readonly userRepository: IUserRepository,
    private readonly emailService: IEmailService,
  ) {}

  async execute(token: string): Promise<void> {
    const verificationToken =
      await this.verificationTokenRepository.findByToken(token);

    if (!verificationToken) {
      throw new InvalidVerificationTokenException('Token not found');
    }

    if (!verificationToken.isValid()) {
      throw new InvalidVerificationTokenException(
        'Token is expired or already used',
      );
    }

    if (verificationToken.type !== TokenType.EMAIL_VERIFICATION) {
      throw new InvalidVerificationTokenException('Invalid token type');
    }

    // Mark token as used
    await this.verificationTokenRepository.markAsUsed(token);

    // Update user
    const user = await this.userRepository.update(verificationToken.userId, {
      isEmailVerified: true,
    });

    // Send welcome email
    await this.emailService.sendWelcomeEmail(user.email, user.name);
  }
}
