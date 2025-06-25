import { UserRole } from 'generated/prisma';
import { User } from '../entities/user.entity';

export interface IUserRepository {
  create(
    email: string,
    name: string,
    hashedPassword: string,
    role?: UserRole,
  ): Promise<User>;

  findById(id: string): Promise<User | null>;

  findByEmail(email: string): Promise<User | null>;

  update(
    id: string,
    data: Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt'>>,
  ): Promise<User>;

  delete(id: string): Promise<void>;
}
