import {
  VerificationToken,
  TokenType,
} from '../entities/verification-token.entity';

export interface IVerificationTokenRepository {
  create(
    userId: string,
    token: string,
    type: TokenType,
    expiresAt: Date,
  ): Promise<VerificationToken>;

  findByToken(token: string): Promise<VerificationToken | null>;

  markAsUsed(token: string): Promise<void>;

  deleteExpiredTokens(): Promise<void>;

  findActiveByUserAndType(
    userId: string,
    type: TokenType,
  ): Promise<VerificationToken | null>;

  invalidateUserTokensByType(userId: string, type: TokenType): Promise<void>;
}
