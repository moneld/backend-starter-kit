export class DomainException extends Error {
  constructor(
    message: string,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'DomainException';
  }
}

export class UserNotFoundException extends DomainException {
  constructor(identifier: string) {
    super(`User not found: ${identifier}`, 'USER_NOT_FOUND');
    this.name = 'UserNotFoundException';
  }
}

export class UserAlreadyExistsException extends DomainException {
  constructor(email: string) {
    super(`User with email ${email} already exists`, 'USER_ALREADY_EXISTS');
    this.name = 'UserAlreadyExistsException';
  }
}

export class InvalidCredentialsException extends DomainException {
  constructor() {
    super('Invalid credentials', 'INVALID_CREDENTIALS');
    this.name = 'InvalidCredentialsException';
  }
}

export class InvalidTokenException extends DomainException {
  constructor(reason: string = 'Invalid token') {
    super(reason, 'INVALID_TOKEN');
    this.name = 'InvalidTokenException';
  }
}

export class EmailNotVerifiedException extends DomainException {
  constructor() {
    super('Email not verified', 'EMAIL_NOT_VERIFIED');
    this.name = 'EmailNotVerifiedException';
  }
}

export class InvalidVerificationTokenException extends DomainException {
  constructor(reason: string = 'Invalid verification token') {
    super(reason, 'INVALID_VERIFICATION_TOKEN');
    this.name = 'InvalidVerificationTokenException';
  }
}
