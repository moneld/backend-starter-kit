import { DomainException } from './domain.exception';

export class EncryptionException extends DomainException {
  constructor(message: string) {
    super(message, 'ENCRYPTION_ERROR');
    this.name = 'EncryptionException';
  }
}

export class DecryptionException extends DomainException {
  constructor(message: string) {
    super(message, 'DECRYPTION_ERROR');
    this.name = 'DecryptionException';
  }
}

export class KeyNotFoundException extends DomainException {
  constructor(identifier: string) {
    super(`Encryption key not found: ${identifier}`, 'KEY_NOT_FOUND');
    this.name = 'KeyNotFoundException';
  }
}

export class KeyRotationException extends DomainException {
  constructor(message: string) {
    super(message, 'KEY_ROTATION_ERROR');
    this.name = 'KeyRotationException';
  }
}