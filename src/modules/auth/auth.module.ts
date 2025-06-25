import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from '@infrastructure/web/controllers/auth.controller';
import { JwtStrategy } from '@infrastructure/web/guards/jwt.strategy';
import { RegisterUseCase } from '@application/use-cases/auth/register.use-case';
import { LoginUseCase } from '@application/use-cases/auth/login.use-case';
import { GetProfileUseCase } from '@application/use-cases/auth/get-profile.use-case';
import { UserRepository } from '@infrastructure/persistence/repositories/user.repository';
import { PrismaModule } from '@infrastructure/persistence/prisma/prisma.module';

const userRepositoryProvider = {
  provide: 'IUserRepository',
  useClass: UserRepository,
};

@Module({
  imports: [
    PrismaModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secret'),
        signOptions: {
          expiresIn: configService.get<string>('jwt.expiresIn'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    JwtStrategy,
    userRepositoryProvider,
    {
      provide: RegisterUseCase,
      useFactory: (userRepository: UserRepository) => {
        return new RegisterUseCase(userRepository);
      },
      inject: [userRepositoryProvider.provide],
    },
    {
      provide: LoginUseCase,
      useFactory: (userRepository: UserRepository) => {
        return new LoginUseCase(userRepository);
      },
      inject: [userRepositoryProvider.provide],
    },
    {
      provide: GetProfileUseCase,
      useFactory: (userRepository: UserRepository) => {
        return new GetProfileUseCase(userRepository);
      },
      inject: [userRepositoryProvider.provide],
    },
  ],
})
export class AuthModule {}
