export class Session {
  constructor(
    private readonly _id: string,
    private readonly _userId: string,
    private readonly _ipAddress: string,
    private readonly _userAgent: string,
    private readonly _lastActivity: Date,
    private readonly _createdAt: Date,
  ) {}

  get id(): string {
    return this._id;
  }

  get userId(): string {
    return this._userId;
  }

  get ipAddress(): string {
    return this._ipAddress;
  }

  get userAgent(): string {
    return this._userAgent;
  }

  get lastActivity(): Date {
    return this._lastActivity;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  isExpired(maxInactivityMinutes: number = 30): boolean {
    const inactivityMs = Date.now() - this._lastActivity.getTime();
    const maxInactivityMs = maxInactivityMinutes * 60 * 1000;
    return inactivityMs > maxInactivityMs;
  }
}
