
import { Injectable, Inject } from '@nestjs/common';
import { IUserRepository } from '@domain/repositories/user.repository.interface';
import { IAccountLockService } from '@domain/services/account-lock.service.interface';
import { UserNotFoundException } from '@domain/exceptions/domain.exception';

@Injectable()
export class UnlockUserUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    @Inject('IAccountLockService')
    private readonly accountLockService: IAccountLockService,
  ) {}

  async execute(adminId: string, targetUserId: string): Promise<void> {
    const user = await this.userRepository.findById(targetUserId);

    if (!user) {
      throw new UserNotFoundException(targetUserId);
    }

    await this.accountLockService.unlockAccount(targetUserId);
  }
}