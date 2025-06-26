import { UserRole } from 'generated/prisma';

export class User {
  constructor(
    private readonly _id: string,
    private readonly _email: string,
    private readonly _name: string,
    private readonly _password: string,
    private readonly _role: UserRole,
    private readonly _isEmailVerified: boolean,
    private readonly _createdAt: Date,
    private readonly _updatedAt: Date,
  ) {}

  get id(): string {
    return this._id;
  }

  get email(): string {
    return this._email;
  }

  get name(): string {
    return this._name;
  }

  get password(): string {
    return this._password;
  }

  get role(): UserRole {
    return this._role;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  get isEmailVerified(): boolean {
    return this._isEmailVerified;
  }

  isAdmin(): boolean {
    return this._role === UserRole.ADMIN;
  }

  canLogin(): boolean {
    return this._isEmailVerified;
  }
}
