import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  HttpCode,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { RegisterDto } from '@application/dto/auth/register.dto';
import { LoginDto } from '@application/dto/auth/login.dto';
import { RefreshTokenDto } from '@application/dto/auth/refresh-token.dto';
import { RegisterUseCase } from '@application/use-cases/auth/register.use-case';
import { LoginUseCase } from '@application/use-cases/auth/login.use-case';
import { GetProfileUseCase } from '@application/use-cases/auth/get-profile.use-case';
import { RefreshTokenUseCase } from '@application/use-cases/auth/refresh-token.use-case';
import { LogoutUseCase } from '@application/use-cases/auth/logout.use-case';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';
import { IRefreshTokenRepository } from '@domain/repositories/refresh-token.repository.interface';
import { Throttle } from '@nestjs/throttler';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly registerUseCase: RegisterUseCase,
    private readonly loginUseCase: LoginUseCase,
    private readonly getProfileUseCase: GetProfileUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    private readonly logoutUseCase: LogoutUseCase,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @Inject('IRefreshTokenRepository')
    private readonly refreshTokenRepository: IRefreshTokenRepository,
  ) {}

  @Post('register')
  @Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 requests per minute
  async register(@Body() registerDto: RegisterDto) {
    const user = await this.registerUseCase.execute(
      registerDto.email,
      registerDto.name,
      registerDto.password,
    );

    const tokens = await this.generateTokens(user);

    return {
      ...tokens,
      user,
    };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 3, ttl: 60000 } }) // 5 requests per minute
  async login(@Body() loginDto: LoginDto) {
    const user = await this.loginUseCase.execute(
      loginDto.email,
      loginDto.password,
    );

    const tokens = await this.generateTokens(user);

    return {
      ...tokens,
      user,
    };
  }

  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    const result = await this.refreshTokenUseCase.execute(
      refreshTokenDto.refreshToken,
    );

    const accessToken = this.generateAccessToken(result.user);
    const newRefreshToken = await this.generateRefreshToken(result.user);

    return {
      accessToken,
      refreshToken: newRefreshToken,
      user: result.user,
    };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@CurrentUser() user: CurrentUser) {
    await this.logoutUseCase.execute(user.userId);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@CurrentUser() user: CurrentUser) {
    return await this.getProfileUseCase.execute(user.userId);
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
