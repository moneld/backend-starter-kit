import { DomainException } from '../exceptions/domain.exception';

export class Password {
  private readonly value: string;

  constructor(password: string) {
    this.validate(password);
    this.value = password;
  }

  private validate(password: string): void {
    if (password.length < 8) {
      throw new InvalidPasswordException(
        'Password must be at least 8 characters long',
      );
    }

    if (!/[A-Z]/.test(password)) {
      throw new InvalidPasswordException(
        'Password must contain at least one uppercase letter',
      );
    }

    if (!/[a-z]/.test(password)) {
      throw new InvalidPasswordException(
        'Password must contain at least one lowercase letter',
      );
    }

    if (!/[0-9]/.test(password)) {
      throw new InvalidPasswordException(
        'Password must contain at least one number',
      );
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      throw new InvalidPasswordException(
        'Password must contain at least one special character',
      );
    }
  }

  getValue(): string {
    return this.value;
  }
}

export class InvalidPasswordException extends DomainException {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidPasswordException';
  }
}
