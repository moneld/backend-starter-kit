import { Injectable } from '@nestjs/common';
import { IVerificationTokenRepository } from '@domain/repositories/verification-token.repository.interface';
import { IEmailService } from '@domain/services/email.service.interface';
import { IUserRepository } from '@domain/repositories/user.repository.interface';
import { UserNotFoundException } from '@domain/exceptions/domain.exception';
import { TokenType } from '@domain/entities/verification-token.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class SendVerificationEmailUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly verificationTokenRepository: IVerificationTokenRepository,
    private readonly emailService: IEmailService,
  ) {}

  async execute(userId: string): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UserNotFoundException(userId);
    }

    if (user.isEmailVerified) {
      return; // Already verified
    }

    // Invalidate previous tokens
    await this.verificationTokenRepository.invalidateUserTokensByType(
      userId,
      TokenType.EMAIL_VERIFICATION,
    );

    // Generate new token
    const token = uuidv4();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours

    await this.verificationTokenRepository.create(
      userId,
      token,
      TokenType.EMAIL_VERIFICATION,
      expiresAt,
    );

    // Send email
    await this.emailService.sendVerificationEmail(user.email, user.name, token);
  }
}
