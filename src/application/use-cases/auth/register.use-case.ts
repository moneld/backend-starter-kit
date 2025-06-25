import { Injectable } from '@nestjs/common';
import { IUserRepository } from '@domain/repositories/user.repository.interface';
import { UserAlreadyExistsException } from '@domain/exceptions/domain.exception';
import * as bcrypt from 'bcrypt';

@Injectable()
export class RegisterUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(email: string, name: string, password: string) {
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new UserAlreadyExistsException(email);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await this.userRepository.create(email, name, hashedPassword);

    return {
      id: user.id,
      email: user.email,
      name: user.name,
    };
  }
}
