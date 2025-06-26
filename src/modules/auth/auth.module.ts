import { Module } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from '@infrastructure/web/controllers/auth.controller';
import { JwtStrategy } from '@infrastructure/web/guards/jwt.strategy';
import { LoginUseCase } from '@application/use-cases/auth/login.use-case';
import { GetProfileUseCase } from '@application/use-cases/auth/get-profile.use-case';
import { RefreshTokenUseCase } from '@application/use-cases/auth/refresh-token.use-case';
import { LogoutUseCase } from '@application/use-cases/auth/logout.use-case';
import { UserRepository } from '@infrastructure/persistence/repositories/user.repository';
import { RefreshTokenRepository } from '@infrastructure/persistence/repositories/refresh-token.repository';
import { Argon2HashingService } from '@infrastructure/security/argon2-hashing.service';
import { PrismaModule } from '@infrastructure/persistence/prisma/prisma.module';
import { RegisterUseCase } from '@application/use-cases/auth/register.use-case';
import { ScheduleModule } from '@nestjs/schedule';
import { VerificationTokenRepository } from '@infrastructure/persistence/repositories/verification-token.repository';
import { EmailService } from '@infrastructure/email/email.service';
import { CleanupVerificationTokensTask } from '@infrastructure/tasks/cleanup-verification-tokens.task';
import { SendVerificationEmailUseCase } from '@application/use-cases/auth/send-verification-email.use-case';
import { VerifyEmailUseCase } from '@application/use-cases/auth/verify-email.use-case';

@Module({
  imports: [
    PrismaModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('security.jwt.accessTokenSecret'),
        signOptions: {
          expiresIn: configService.get<string>(
            'security.jwt.accessTokenExpiresIn',
          ),
        },
      }),
      inject: [ConfigService],
    }),
    ScheduleModule.forRoot(),
  ],
  controllers: [AuthController],
  providers: [
    // Guards and Strategies
    JwtStrategy,

    // Repositories
    {
      provide: 'IUserRepository',
      useClass: UserRepository,
    },
    {
      provide: 'IRefreshTokenRepository',
      useClass: RefreshTokenRepository,
    },

    {
      provide: 'IVerificationTokenRepository',
      useClass: VerificationTokenRepository,
    },

    // Services
    {
      provide: 'IHashingService',
      useClass: Argon2HashingService,
    },

    {
      provide: 'IEmailService',
      useClass: EmailService,
    },

    CleanupVerificationTokensTask,

    // Use Cases
    {
      provide: RegisterUseCase,
      useFactory: (
        userRepository: UserRepository,
        hashingService: Argon2HashingService,
      ) => {
        return new RegisterUseCase(userRepository, hashingService);
      },
      inject: ['IUserRepository', 'IHashingService'],
    },
    {
      provide: LoginUseCase,
      useFactory: (
        userRepository: UserRepository,
        hashingService: Argon2HashingService,
      ) => {
        return new LoginUseCase(userRepository, hashingService);
      },
      inject: ['IUserRepository', 'IHashingService'],
    },
    {
      provide: GetProfileUseCase,
      useFactory: (userRepository: UserRepository) => {
        return new GetProfileUseCase(userRepository);
      },
      inject: ['IUserRepository'],
    },
    {
      provide: RefreshTokenUseCase,
      useFactory: (
        refreshTokenRepository: RefreshTokenRepository,
        userRepository: UserRepository,
        jwtService: JwtService,
        configService: ConfigService,
      ) => {
        return new RefreshTokenUseCase(
          refreshTokenRepository,
          userRepository,
          jwtService,
          configService,
        );
      },
      inject: [
        'IRefreshTokenRepository',
        'IUserRepository',
        JwtService,
        ConfigService,
      ],
    },
    {
      provide: LogoutUseCase,
      useFactory: (refreshTokenRepository: RefreshTokenRepository) => {
        return new LogoutUseCase(refreshTokenRepository);
      },
      inject: ['IRefreshTokenRepository'],
    },
    {
      provide: SendVerificationEmailUseCase,
      useFactory: (
        userRepository: UserRepository,
        verificationTokenRepository: VerificationTokenRepository,
        emailService: EmailService,
      ) => {
        return new SendVerificationEmailUseCase(
          userRepository,
          verificationTokenRepository,
          emailService,
        );
      },
      inject: [
        'IUserRepository',
        'IVerificationTokenRepository',
        'IEmailService',
      ],
    },
    {
      provide: VerifyEmailUseCase,
      useFactory: (
        verificationTokenRepository: VerificationTokenRepository,
        userRepository: UserRepository,
        emailService: EmailService,
      ) => {
        return new VerifyEmailUseCase(
          verificationTokenRepository,
          userRepository,
          emailService,
        );
      },
      inject: [
        'IVerificationTokenRepository',
        'IUserRepository',
        'IEmailService',
      ],
    },
  ],
  exports: [
    JwtModule,
    'IUserRepository',
    'IRefreshTokenRepository',
    'IVerificationTokenRepository',
  ],
})
export class AuthModule {}
