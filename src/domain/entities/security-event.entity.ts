export enum SecurityEventType {
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILED = 'LOGIN_FAILED',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  ACCOUNT_UNLOCKED = 'ACCOUNT_UNLOCKED',
  PASSWORD_CHANGED = 'PASSWORD_CHANGED',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
  FORCED_LOGOUT = 'FORCED_LOGOUT',
  SESSION_CREATED = 'SESSION_CREATED',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
}

export class SecurityEvent {
  constructor(
    private readonly _id: string,
    private readonly _type: SecurityEventType,
    private readonly _userId: string | null,
    private readonly _ipAddress: string | null,
    private readonly _userAgent: string | null,
    private readonly _metadata: Record<string, any> | null,
    private readonly _createdAt: Date,
  ) {}

 
  get id(): string {
    return this._id;
  }

  get type(): SecurityEventType {
    return this._type;
  }

  get userId(): string | null {
    return this._userId;
  }

  get ipAddress(): string | null {
    return this._ipAddress;
  }

  get userAgent(): string | null {
    return this._userAgent;
  }

  get metadata(): Record<string, any> | null {
    return this._metadata;
  }

  get createdAt(): Date {
    return this._createdAt;
  }
}
