import { Injectable } from '@nestjs/common';
import { IUserRepository } from '@domain/repositories/user.repository.interface';
import { UserAlreadyExistsException } from '@domain/exceptions/domain.exception';
import { IHashingService } from '@domain/services/hashing.service.interface';
import { Password } from '@domain/value-objects/password.value-object';
import { UserRole } from 'generated/prisma';

@Injectable()
export class RegisterUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly hashingService: IHashingService,
  ) {}

  async execute(
    email: string,
    name: string,
    password: string,
    role: UserRole = UserRole.USER,
  ) {
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new UserAlreadyExistsException(email);
    }

    // Validate password strength
    const passwordVO = new Password(password);

    const hashedPassword = await this.hashingService.hash(
      passwordVO.getValue(),
    );
    const user = await this.userRepository.create(
      email,
      name,
      hashedPassword,
      role,
    );

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
  }
}
