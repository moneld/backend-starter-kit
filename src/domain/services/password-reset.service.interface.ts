export interface IPasswordResetService {
  generateResetToken(userId: string): Promise<string>;
  validateResetToken(token: string): Promise<string>;
  invalidateResetToken(token: string): Promise<void>;
  invalidateAllUserResetTokens(userId: string): Promise<void>;
}
