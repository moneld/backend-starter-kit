import { Injectable, UnauthorizedException } from '@nestjs/common';
import { IUserRepository } from '@domain/repositories/user.repository.interface';
import * as bcrypt from 'bcrypt';

@Injectable()
export class LoginUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(email: string, password: string) {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return {
      id: user.id,
      email: user.email,
    };
  }
}
