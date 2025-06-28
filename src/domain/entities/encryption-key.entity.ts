export class EncryptionKey {
  constructor(
    private readonly _id: string,
    private readonly _version: number,
    private readonly _key: string,
    private readonly _algorithm: string,
    private readonly _isActive: boolean,
    private readonly _rotatedAt: Date | null,
    private readonly _createdAt: Date,
    private readonly _expiresAt: Date,
  ) {}

  get id(): string {
    return this._id;
  }

  get version(): number {
    return this._version;
  }

  get key(): string {
    return this._key;
  }

  get algorithm(): string {
    return this._algorithm;
  }

  get isActive(): boolean {
    return this._isActive;
  }

  get rotatedAt(): Date | null {
    return this._rotatedAt;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get expiresAt(): Date {
    return this._expiresAt;
  }

  isExpired(): boolean {
    return new Date() > this._expiresAt;
  }

  shouldRotate(): boolean {
    if (this.isExpired()) return true;

    const daysSinceCreation =
      (Date.now() - this._createdAt.getTime()) / (1000 * 60 * 60 * 24);

    return daysSinceCreation >= 90; // Rotation après 90 jours
  }
}