// src/modules/auth/auth.module.ts
import { forwardRef, Module } from '@nestjs/common';
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
import { SendVerificationEmailUseCase } from '@application/use-cases/auth/send-verification-email.use-case';
import { VerifyEmailUseCase } from '@application/use-cases/auth/verify-email.use-case';
import { VerificationTokenRepository } from '@infrastructure/persistence/repositories/verification-token.repository';
import { EmailService } from '@infrastructure/email/email.service';
import { ForgotPasswordUseCase } from '@application/use-cases/auth/forgot-password.use-case';
import { ResetPasswordUseCase } from '@application/use-cases/auth/reset-password.use-case';
import { ChangePasswordUseCase } from '@application/use-cases/auth/change-password.use-case';
import { PasswordResetService } from '@infrastructure/services/password-reset.service';
import { SecurityModule } from '@modules/security/security.module';

@Module({
  imports: [
    PrismaModule,
    PassportModule,
    forwardRef(() => SecurityModule), // Utiliser forwardRef pour éviter la dépendance circulaire
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
  ],
  controllers: [AuthController],
  providers: [
    // Guards and Strategies
    JwtStrategy,

    // Repositories (seulement ceux qui ne sont pas déjà dans SecurityModule)
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
    {
      provide: 'IPasswordResetService',
      useFactory: (
        verificationTokenRepository: VerificationTokenRepository,
      ) => {
        return new PasswordResetService(verificationTokenRepository);
      },
      inject: ['IVerificationTokenRepository'],
    },

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
        accountLockService: any,
        securityMonitoringService: any,
      ) => {
        return new LoginUseCase(
          userRepository,
          hashingService,
          accountLockService,
          securityMonitoringService,
        );
      },
      inject: [
        'IUserRepository',
        'IHashingService',
        'IAccountLockService',
        'ISecurityMonitoringService',
      ],
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
    {
      provide: ForgotPasswordUseCase,
      useFactory: (
        userRepository: UserRepository,
        verificationTokenRepository: VerificationTokenRepository,
        emailService: EmailService,
      ) => {
        return new ForgotPasswordUseCase(
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
      provide: ResetPasswordUseCase,
      useFactory: (
        verificationTokenRepository: VerificationTokenRepository,
        userRepository: UserRepository,
        refreshTokenRepository: RefreshTokenRepository,
        hashingService: Argon2HashingService,
      ) => {
        return new ResetPasswordUseCase(
          verificationTokenRepository,
          userRepository,
          refreshTokenRepository,
          hashingService,
        );
      },
      inject: [
        'IVerificationTokenRepository',
        'IUserRepository',
        'IRefreshTokenRepository',
        'IHashingService',
      ],
    },
    {
      provide: ChangePasswordUseCase,
      useFactory: (
        userRepository: UserRepository,
        refreshTokenRepository: RefreshTokenRepository,
        hashingService: Argon2HashingService,
      ) => {
        return new ChangePasswordUseCase(
          userRepository,
          refreshTokenRepository,
          hashingService,
        );
      },
      inject: ['IUserRepository', 'IRefreshTokenRepository', 'IHashingService'],
    },
  ],
  exports: [
    JwtModule,
    'IUserRepository',
    'IRefreshTokenRepository',
    'IVerificationTokenRepository',
    'IPasswordResetService',
  ],
})
export class AuthModule {}
