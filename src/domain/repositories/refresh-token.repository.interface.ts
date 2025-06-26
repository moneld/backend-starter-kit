import { RefreshToken } from '../entities/refresh-token.entity';

export interface IRefreshTokenRepository {
  create(userId: string, token: string, expiresAt: Date): Promise<RefreshToken>;

  findByToken(token: string): Promise<RefreshToken | null>;

  revokeToken(token: string): Promise<void>;

  revokeAllUserTokens(userId: string): Promise<void>;

  deleteExpiredTokens(): Promise<void>;
}
