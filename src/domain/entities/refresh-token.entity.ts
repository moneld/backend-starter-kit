export class RefreshToken {
  constructor(
    private readonly _id: string,
    private readonly _token: string,
    private readonly _userId: string,
    private readonly _expiresAt: Date,
    private readonly _revokedAt: Date | null,
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

  get expiresAt(): Date {
    return this._expiresAt;
  }

  get revokedAt(): Date | null {
    return this._revokedAt;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  isExpired(): boolean {
    return new Date() > this._expiresAt;
  }

  isRevoked(): boolean {
    return this._revokedAt !== null;
  }

  isValid(): boolean {
    return !this.isExpired() && !this.isRevoked();
  }
}
