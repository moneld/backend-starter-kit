import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  NotFoundException,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { RegisterDto } from '@application/dto/auth/register.dto';
import { LoginDto } from '@application/dto/auth/login.dto';
import { RefreshTokenDto } from '@application/dto/auth/refresh-token.dto';
import { RegisterUseCase } from '@application/use-cases/auth/register.use-case';
import { LoginUseCase } from '@application/use-cases/auth/login.use-case';
import { GetProfileUseCase } from '@application/use-cases/auth/get-profile.use-case';
import { RefreshTokenUseCase } from '@application/use-cases/auth/refresh-token.use-case';
import { LogoutUseCase } from '@application/use-cases/auth/logout.use-case';
import { SendVerificationEmailUseCase } from '@application/use-cases/auth/send-verification-email.use-case';
import { VerifyEmailUseCase } from '@application/use-cases/auth/verify-email.use-case';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';
import { IRefreshTokenRepository } from '@domain/repositories/refresh-token.repository.interface';
import { Throttle } from '@nestjs/throttler';

import { ForgotPasswordDto } from '@application/dto/auth/forgot-password.dto';
import { ResetPasswordDto } from '@application/dto/auth/reset-password.dto';
import { ChangePasswordDto } from '@application/dto/auth/change-password.dto';
import { ForgotPasswordUseCase } from '@application/use-cases/auth/forgot-password.use-case';
import { ResetPasswordUseCase } from '@application/use-cases/auth/reset-password.use-case';
import { ChangePasswordUseCase } from '@application/use-cases/auth/change-password.use-case';

import { FastifyRequest } from 'fastify';
import { ISessionManagerService } from '@domain/services/session-manager.service.interface';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly registerUseCase: RegisterUseCase,
    private readonly loginUseCase: LoginUseCase,
    private readonly getProfileUseCase: GetProfileUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    private readonly logoutUseCase: LogoutUseCase,
    private readonly sendVerificationEmailUseCase: SendVerificationEmailUseCase,
    private readonly verifyEmailUseCase: VerifyEmailUseCase,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @Inject('IRefreshTokenRepository')
    private readonly refreshTokenRepository: IRefreshTokenRepository,
    private readonly forgotPasswordUseCase: ForgotPasswordUseCase,
    private readonly resetPasswordUseCase: ResetPasswordUseCase,
    private readonly changePasswordUseCase: ChangePasswordUseCase,
    @Inject('ISessionManagerService')
    private readonly sessionManagerService: ISessionManagerService,
  ) {}

  @Post('register')
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  async register(@Body() registerDto: RegisterDto) {
    const user = await this.registerUseCase.execute(
      registerDto.email,
      registerDto.name,
      registerDto.password,
    );

    // Send verification email
    await this.sendVerificationEmailUseCase.execute(user.id);

    const tokens = await this.generateTokens(user);

    return {
      ...tokens,
      user,
      message:
        'Registration successful. Please check your email to verify your account.',
    };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  async login(@Body() loginDto: LoginDto, @Req() request: FastifyRequest) {
    const ipAddress = request.ip || 'unknown';
    const userAgent = request.headers['user-agent'] || 'unknown';

    const user = await this.loginUseCase.execute(
      loginDto.email,
      loginDto.password,
      ipAddress,
      userAgent,
    );

    // Créer la session
    const sessionId = await this.sessionManagerService.createSession(
      user.id,
      ipAddress,
      userAgent,
    );

    const tokens = await this.generateTokens(user);

    return {
      ...tokens,
      user,
      sessionId, // Important : le client doit stocker ce sessionId
      message:
        'Login successful. Please include sessionId in x-session-id header for all requests.',
    };
  }

  @Get('verify-email')
  async verifyEmail(@Query('token') token: string) {
    await this.verifyEmailUseCase.execute(token);

    return {
      message: 'Email verified successfully. You can now login.',
    };
  }

  @Post('resend-verification')
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 1, ttl: 300000 } })
  async resendVerification(@CurrentUser() user: CurrentUser) {
    await this.sendVerificationEmailUseCase.execute(user.userId);

    return {
      message: 'Verification email sent successfully.',
    };
  }

  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  async refreshToken(
    @Body() refreshTokenDto: RefreshTokenDto,
    @Req() request: FastifyRequest,
  ) {
    const result = await this.refreshTokenUseCase.execute(
      refreshTokenDto.refreshToken,
    );

    const accessToken = this.generateAccessToken(result.user);
    const newRefreshToken = await this.generateRefreshToken(result.user);

    // Optionnel : prolonger la session si un sessionId est fourni
    const sessionId = request.headers['x-session-id'] as string;
    if (sessionId) {
      await this.sessionManagerService.validateSession(sessionId);
    }

    return {
      accessToken,
      refreshToken: newRefreshToken,
      user: result.user,
      sessionId, // Retourner le même sessionId
    };
  }

  @Get('session/status')
  @UseGuards(JwtAuthGuard)
  async getSessionStatus(@CurrentUser() user: CurrentUser) {
    if (!user.sessionId) {
      return {
        active: false,
        message: 'No session ID provided',
      };
    }

    const sessions = await this.sessionManagerService.getActiveSessions(
      user.userId,
    );
    const currentSession = sessions.find((s) => s.id === user.sessionId);

    return {
      active: !!currentSession,
      session: currentSession || null,
      totalActiveSessions: sessions.length,
    };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@CurrentUser() user: CurrentUser) {
    // Révoquer les tokens
    await this.logoutUseCase.execute(user.userId);

    // Terminer la session si elle existe
    if (user.sessionId) {
      await this.sessionManagerService.terminateSession(user.sessionId);
    }
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@CurrentUser() user: CurrentUser) {
    return await this.getProfileUseCase.execute(user.userId);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 3, ttl: 3600000 } }) // 3 requests per hour
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    await this.forgotPasswordUseCase.execute(forgotPasswordDto.email);

    // Always return success to prevent email enumeration
    return {
      message:
        'If an account exists with this email, you will receive a password reset link.',
    };
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 3, ttl: 3600000 } }) // 5 attempts per hour
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    await this.resetPasswordUseCase.execute(
      resetPasswordDto.token,
      resetPasswordDto.newPassword,
    );

    return {
      message:
        'Password has been reset successfully. Please login with your new password.',
    };
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @CurrentUser() user: CurrentUser,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    await this.changePasswordUseCase.execute(
      user.userId,
      changePasswordDto.currentPassword,
      changePasswordDto.newPassword,
    );

    return {
      message: 'Password changed successfully. Please login again.',
    };
  }

  @Get('sessions')
  @UseGuards(JwtAuthGuard)
  async getActiveSessions(@CurrentUser() user: CurrentUser) {
    return await this.sessionManagerService.getActiveSessions(user.userId);
  }

  @Delete('sessions/:sessionId')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async terminateSession(
    @CurrentUser() user: CurrentUser,
    @Param('sessionId') sessionId: string,
  ) {
    const sessions = await this.sessionManagerService.getActiveSessions(
      user.userId,
    );
    const session = sessions.find((s) => s.id === sessionId);

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    await this.sessionManagerService.terminateSession(sessionId);
  }

  @Post('logout-all-devices')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async logoutAllDevices(@CurrentUser() user: CurrentUser) {
    await this.sessionManagerService.terminateAllUserSessions(user.userId);
    await this.refreshTokenRepository.revokeAllUserTokens(user.userId);
  }

  private async generateTokens(user: any) {
    const accessToken = this.generateAccessToken(user);
    const refreshToken = await this.generateRefreshToken(user);

    return {
      accessToken,
      refreshToken,
    };
  }

  private generateAccessToken(user: any): string {
    const payload = {
      email: user.email,
      sub: user.id,
      role: user.role,
    };

    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>('security.jwt.accessTokenSecret'),
      expiresIn: this.configService.get<string>(
        'security.jwt.accessTokenExpiresIn',
      ),
    });
  }

  private async generateRefreshToken(user: any): Promise<string> {
    const payload = {
      sub: user.id,
      type: 'refresh',
    };

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('security.jwt.refreshTokenSecret'),
      expiresIn: this.configService.get<string>(
        'security.jwt.refreshTokenExpiresIn',
      ),
    });

    // Store refresh token in database
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await this.refreshTokenRepository.create(user.id, refreshToken, expiresAt);

    return refreshToken;
  }
}
