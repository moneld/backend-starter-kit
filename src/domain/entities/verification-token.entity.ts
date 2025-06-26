export enum TokenType {
  EMAIL_VERIFICATION = 'EMAIL_VERIFICATION',
  PASSWORD_RESET = 'PASSWORD_RESET',
}

export class VerificationToken {
  constructor(
    private readonly _id: string,
    private readonly _token: string,
    private readonly _userId: string,
    private readonly _type: TokenType,
    private readonly _expiresAt: Date,
    private readonly _usedAt: Date | null,
    private readonly _createdAt: Date,
  ) {}

  get id(): string {
    return this._id;
  }

  get token(): string {
    return this._token;
  }

  get userId(): string {
    return this._userId;
  }

  get type(): TokenType {
    return this._type;
  }

  get expiresAt(): Date {
    return this._expiresAt;
  }

  get usedAt(): Date | null {
    return this._usedAt;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  isExpired(): boolean {
    return new Date() > this._expiresAt;
  }

  isUsed(): boolean {
    return this._usedAt !== null;
  }

  isValid(): boolean {
    return !this.isExpired() && !this.isUsed();
  }
}