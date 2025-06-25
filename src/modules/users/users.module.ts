import { Module } from '@nestjs/common';
import { UserRepository } from '@infrastructure/persistence/repositories/user.repository';

@Module({
  providers: [
    {
      provide: 'IUserRepository',
      useClass: UserRepository,
    },
  ],
  exports: ['IUserRepository'],
})
export class UsersModule {}
