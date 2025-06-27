export interface IAccountLockService {
  handleFailedLogin(userId: string): Promise<boolean>; // Returns true if account is locked

  unlockAccount(userId: string): Promise<void>;

  isAccountLocked(userId: string): Promise<boolean>;

  getLockedAccounts(): Promise<Array<{
    userId: string;
    lockedUntil: Date;
    failedAttempts: number;
  }>>;
}