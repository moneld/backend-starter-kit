
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IUserRepository } from '@domain/repositories/user.repository.interface';
import { User } from '@domain/entities/user.entity';
import { UserRole } from 'generated/prisma';

@Injectable()
export class UserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    email: string,
    name: string,
    hashedPassword: string,
    role: UserRole = UserRole.USER,
  ): Promise<User> {
    const userRecord = await this.prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role,
      },
    });

    return this.mapToEntity(userRecord);
  }

  async findById(id: string): Promise<User | null> {
    const userRecord = await this.prisma.user.findUnique({
      where: { id },
    });

    return userRecord ? this.mapToEntity(userRecord) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const userRecord = await this.prisma.user.findUnique({
      where: { email },
    });

    return userRecord ? this.mapToEntity(userRecord) : null;
  }

  async update(
    id: string,
    data: Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt'>>,
  ): Promise<User> {
    const updateData: any = {};
    if (data.email !== undefined) updateData.email = data.email;
    if (data.name !== undefined) updateData.name = data.name;
    if (data.password !== undefined) updateData.password = data.password;
    if (data.role !== undefined) updateData.role = data.role;
    if (data.isEmailVerified !== undefined)
      updateData.isEmailVerified = data.isEmailVerified;
    if (data.failedLoginAttempts !== undefined)
      updateData.failedLoginAttempts = data.failedLoginAttempts;
    if (data.lockedUntil !== undefined)
      updateData.lockedUntil = data.lockedUntil;
    if (data.lastFailedAttempt !== undefined)
      updateData.lastFailedAttempt = data.lastFailedAttempt;

    const userRecord = await this.prisma.user.update({
      where: { id },
      data: updateData,
    });

    return this.mapToEntity(userRecord);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.user.delete({
      where: { id },
    });
  }

  private mapToEntity(userRecord: any): User {
    return new User(
      userRecord.id,
      userRecord.email,
      userRecord.name,
      userRecord.password,
      userRecord.role,
      userRecord.isEmailVerified,
      userRecord.failedLoginAttempts || 0,
      userRecord.lockedUntil || null,
      userRecord.lastFailedAttempt || null,
      userRecord.createdAt,
      userRecord.updatedAt,
    );
  }
}
