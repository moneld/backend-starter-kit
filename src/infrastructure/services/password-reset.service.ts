import { Inject, Injectable } from '@nestjs/common';
import { IPasswordResetService } from '@domain/services/password-reset.service.interface';
import { IVerificationTokenRepository } from '@domain/repositories/verification-token.repository.interface';
import { TokenType } from '@domain/entities/verification-token.entity';
import { InvalidVerificationTokenException } from '@domain/exceptions/domain.exception';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class PasswordResetService implements IPasswordResetService {
  constructor(
    @Inject('IVerificationTokenRepository')
    private readonly verificationTokenRepository: IVerificationTokenRepository,
  ) {}

  async generateResetToken(userId: string): Promise<string> {
    // Invalidate previous tokens
    await this.verificationTokenRepository.invalidateUserTokensByType(
      userId,
      TokenType.PASSWORD_RESET,
    );

    // Generate new token
    const token = uuidv4();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour

    await this.verificationTokenRepository.create(
      userId,
      token,
      TokenType.PASSWORD_RESET,
      expiresAt,
    );

    return token;
  }

  async validateResetToken(token: string): Promise<string> {
    const verificationToken =
      await this.verificationTokenRepository.findByToken(token);

    if (!verificationToken || !verificationToken.isValid()) {
      throw new InvalidVerificationTokenException('Invalid or expired token');
    }

    if (verificationToken.type !== TokenType.PASSWORD_RESET) {
      throw new InvalidVerificationTokenException('Invalid token type');
    }

    return verificationToken.userId;
  }

  async invalidateResetToken(token: string): Promise<void> {
    await this.verificationTokenRepository.markAsUsed(token);
  }

  async invalidateAllUserResetTokens(userId: string): Promise<void> {
    await this.verificationTokenRepository.invalidateUserTokensByType(
      userId,
      TokenType.PASSWORD_RESET,
    );
  }
}
