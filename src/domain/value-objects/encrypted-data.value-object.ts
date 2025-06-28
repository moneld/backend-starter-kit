import { DomainException } from '../exceptions/domain.exception';

export class EncryptedData {
  private readonly _version: number;
  private readonly _iv: string;
  private readonly _authTag: string;
  private readonly _ciphertext: string;

  constructor(serializedData: string) {
    const parts = serializedData.split(':');

    if (parts.length !== 4) {
      throw new InvalidEncryptedDataException(
        'Invalid encrypted data format'
      );
    }

    const [version, iv, authTag, ciphertext] = parts;

    if (!version || !iv || !authTag || !ciphertext) {
      throw new InvalidEncryptedDataException(
        'Missing encrypted data components'
      );
    }

    this._version = parseInt(version, 10);
    this._iv = iv;
    this._authTag = authTag;
    this._ciphertext = ciphertext;

    if (isNaN(this._version)) {
      throw new InvalidEncryptedDataException(
        'Invalid key version'
      );
    }
  }

  static create(
    version: number,
    iv: string,
    authTag: string,
    ciphertext: string,
  ): EncryptedData {
    const serialized = `${version}:${iv}:${authTag}:${ciphertext}`;
    return new EncryptedData(serialized);
  }

  get version(): number {
    return this._version;
  }

  get iv(): string {
    return this._iv;
  }

  get authTag(): string {
    return this._authTag;
  }

  get ciphertext(): string {
    return this._ciphertext;
  }

  serialize(): string {
    return `${this._version}:${this._iv}:${this._authTag}:${this._ciphertext}`;
  }
}

export class InvalidEncryptedDataException extends DomainException {
  constructor(message: string) {
    super(message, 'INVALID_ENCRYPTED_DATA');
    this.name = 'InvalidEncryptedDataException';
  }
}