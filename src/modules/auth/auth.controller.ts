import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { LocalAuthGuard } from './guards/local-auth.guard';

import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordRequestDto } from './dto/reset-password-request.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import {
  TwoFactorAuthDto,
  TwoFactorAuthRecoveryDto,
} from './dto/two-factor-auth.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';

import { User } from '@prisma/client';
import { AuthThrottlerGuard } from './guards/auth-throttler.guard';
import { Tokens } from './interfaces/tokens.interface';

@ApiTags('auth')
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) { }

  @Public()
  @Post('register')
  @UseGuards(AuthThrottlerGuard)
  @ApiOperation({ summary: 'Enregistrer un nouvel utilisateur' })
  @ApiResponse({ status: 201, description: 'Utilisateur créé avec succès' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({ status: 409, description: 'Email déjà utilisé' })
  async register(@Body() registerDto: RegisterDto) {
    try {
      const { user, verificationToken } =
        await this.authService.register(registerDto);

      // En production, vous devriez envoyer un email avec le token
      // plutôt que de le retourner dans la réponse
      return {
        message:
          'Utilisateur enregistré avec succès, veuillez vérifier votre email',
        userId: user.id,
        verificationToken, // À supprimer en production
      };
    } catch (error) {
      this.logger.error(`Registration failed: ${error.message}`);
      throw error;
    }
  }

  @Public()
  @Post('login')
  @UseGuards(LocalAuthGuard, AuthThrottlerGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Connecter un utilisateur' })
  @ApiResponse({ status: 200, description: 'Authentification réussie' })
  @ApiResponse({ status: 401, description: 'Identifiants invalides' })
  async login(@Body() loginDto: LoginDto, @CurrentUser() user: User) {
    try {
      // Vérifier si l'utilisateur a activé l'authentification à deux facteurs
      if (user.isTwoFactorEnabled) {
        return {
          message: 'Authentification à deux facteurs requise',
          userId: user.id,
          requiresTwoFactor: true,
        };
      }

      // Générer les tokens JWT
      const tokens = await this.authService.generateTokens(user);

      return {
        message: 'Authentification réussie',
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          isVerified: user.isVerified,
          isTwoFactorEnabled: user.isTwoFactorEnabled,
        },
        ...tokens,
      };
    } catch (error) {
      this.logger.error(`Login failed: ${error.message}`);
      throw error;
    }
  }

  @Public()
  @Post('two-factor/authenticate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authentifier avec un code 2FA' })
  @ApiResponse({ status: 200, description: 'Authentification 2FA réussie' })
  @ApiResponse({ status: 401, description: 'Code 2FA invalide' })
  async authenticateWithTwoFactor(
    @Body() twoFactorAuthDto: TwoFactorAuthDto & { userId: string },
  ) {
    try {
      const { userId, code } = twoFactorAuthDto;
      const user = await this.authService.usersService.findOne(userId);

      if (!user) {
        throw new UnauthorizedException('Utilisateur non trouvé');
      }

      const isCodeValid = await this.authService.verifyTwoFactorAuthToken(
        userId,
        code,
      );

      if (!isCodeValid) {
        throw new UnauthorizedException("Code d'authentification invalide");
      }

      // Générer les tokens JWT avec l'indication de l'authentification 2FA
      const jwtPayload = {
        sub: user.id,
        email: user.email,
        isVerified: user.isVerified,
        isTwoFactorEnabled: user.isTwoFactorEnabled,
        twoFactorAuthenticated: true,
      };

      // Mettre à jour la date de dernière connexion
      await this.authService.usersService.updateLastLogin(user.id);

      const tokens = await this.authService.generateTokens({
        ...user,
        ...jwtPayload,
      } as User);

      return {
        message: 'Authentification à deux facteurs réussie',
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          isVerified: user.isVerified,
          isTwoFactorEnabled: user.isTwoFactorEnabled,
        },
        ...tokens,
      };
    } catch (error) {
      this.logger.error(`Two factor authentication failed: ${error.message}`);
      throw error;
    }
  }

  @Public()
  @Post('two-factor/recover')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Récupérer l'accès avec un code de récupération 2FA",
  })
  @ApiResponse({ status: 200, description: 'Récupération 2FA réussie' })
  @ApiResponse({ status: 401, description: 'Code de récupération invalide' })
  async recoverTwoFactorAuthentication(
    @Body() recoveryDto: TwoFactorAuthRecoveryDto & { userId: string },
  ) {
    try {
      const { userId, recoveryCode } = recoveryDto;
      const user = await this.authService.usersService.findOne(userId);

      if (!user) {
        throw new UnauthorizedException('Utilisateur non trouvé');
      }

      const isCodeValid = await this.authService.verifyTwoFactorRecoveryCode(
        userId,
        recoveryCode,
      );

      if (!isCodeValid) {
        throw new UnauthorizedException('Code de récupération invalide');
      }

      // Générer les tokens JWT avec l'indication de l'authentification 2FA
      const jwtPayload = {
        sub: user.id,
        email: user.email,
        isVerified: user.isVerified,
        isTwoFactorEnabled: user.isTwoFactorEnabled,
        twoFactorAuthenticated: true,
      };

      // Mettre à jour la date de dernière connexion
      await this.authService.usersService.updateLastLogin(user.id);

      const tokens = await this.authService.generateTokens({
        ...user,
        ...jwtPayload,
      } as User);

      return {
        message: 'Récupération avec code de secours réussie',
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          isVerified: user.isVerified,
          isTwoFactorEnabled: user.isTwoFactorEnabled,
        },
        ...tokens,
        warning:
          'Votre code de récupération a été utilisé. Veuillez en générer de nouveaux.',
      };
    } catch (error) {
      this.logger.error(`Two factor recovery failed: ${error.message}`);
      throw error;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Déconnecter un utilisateur' })
  @ApiResponse({ status: 200, description: 'Déconnexion réussie' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  async logout(@CurrentUser() user: User) {
    try {
      await this.authService.logout(user.id);
      return { message: 'Déconnexion réussie' };
    } catch (error) {
      this.logger.error(`Logout failed: ${error.message}`);
      throw error;
    }
  }

  @Public()
  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Rafraîchir les tokens JWT' })
  @ApiResponse({ status: 200, description: 'Tokens rafraîchis avec succès' })
  @ApiResponse({ status: 401, description: 'Refresh token invalide' })
  async refreshTokens(
    @CurrentUser() userWithToken: User & { refreshToken: string },
  ): Promise<Tokens> {
    try {
      return this.authService.refreshTokens(
        userWithToken.id,
        userWithToken.refreshToken,
      );
    } catch (error) {
      this.logger.error(`Token refresh failed: ${error.message}`);
      throw error;
    }
  }

  @Public()
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Vérifier l'adresse email" })
  @ApiResponse({ status: 200, description: 'Email vérifié avec succès' })
  @ApiResponse({ status: 400, description: 'Token invalide ou expiré' })
  async verifyEmail(@Body() verifyEmailDto: VerifyEmailDto) {
    try {
      await this.authService.verifyEmail(verifyEmailDto.token);
      return { message: 'Adresse email vérifiée avec succès' };
    } catch (error) {
      this.logger.error(`Email verification failed: ${error.message}`);
      throw error;
    }
  }

  @Public()
  @Post('reset-password-request')
  @UseGuards(AuthThrottlerGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Demander la réinitialisation du mot de passe' })
  @ApiResponse({ status: 200, description: 'Email de réinitialisation envoyé' })
  async requestPasswordReset(
    @Body() resetPasswordRequestDto: ResetPasswordRequestDto,
  ) {
    try {
      const { resetToken } = await this.authService.requestPasswordReset(
        resetPasswordRequestDto.email,
      );

      // En production, vous devriez envoyer un email avec le token
      // plutôt que de le retourner dans la réponse
      return {
        message:
          "Si l'adresse email existe, un lien de réinitialisation a été envoyé",
        // À supprimer en production
        resetToken: resetToken || 'No token generated (user not found)',
      };
    } catch (error) {
      this.logger.error(`Password reset request failed: ${error.message}`);
      throw error;
    }
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Réinitialiser le mot de passe' })
  @ApiResponse({
    status: 200,
    description: 'Mot de passe réinitialisé avec succès',
  })
  @ApiResponse({ status: 400, description: 'Token invalide ou expiré' })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    try {
      await this.authService.resetPassword(
        resetPasswordDto.token,
        resetPasswordDto.newPassword,
      );
      return { message: 'Mot de passe réinitialisé avec succès' };
    } catch (error) {
      this.logger.error(`Password reset failed: ${error.message}`);
      throw error;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('two-factor/generate')
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Générer un secret pour l'authentification à deux facteurs",
  })
  @ApiResponse({ status: 200, description: 'Secret généré avec succès' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  async generateTwoFactorAuthSecret(@CurrentUser() user: User) {
    try {
      const { secret, otpAuthUrl, qrCodeDataUrl } =
        await this.authService.generateTwoFactorAuthSecret(user);

      return {
        secret, // À supprimer en production
        otpAuthUrl, // À supprimer en production
        qrCodeDataUrl,
      };
    } catch (error) {
      this.logger.error(
        `Two factor secret generation failed: ${error.message}`,
      );
      throw error;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('two-factor/enable')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Activer l'authentification à deux facteurs" })
  @ApiResponse({
    status: 200,
    description: 'Authentification à deux facteurs activée',
  })
  @ApiResponse({ status: 401, description: 'Code invalide' })
  async enableTwoFactorAuth(
    @CurrentUser() user: User,
    @Body() twoFactorAuthDto: TwoFactorAuthDto,
  ) {
    try {
      const { recoveryCodes } = await this.authService.enableTwoFactorAuth(
        user.id,
        twoFactorAuthDto.code,
      );

      return {
        message: 'Authentification à deux facteurs activée avec succès',
        recoveryCodes,
        warning:
          'Conservez ces codes de récupération dans un endroit sûr. Ils ne seront plus jamais affichés.',
      };
    } catch (error) {
      this.logger.error(`Two factor activation failed: ${error.message}`);
      throw error;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('two-factor/disable')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Désactiver l'authentification à deux facteurs" })
  @ApiResponse({
    status: 200,
    description: 'Authentification à deux facteurs désactivée',
  })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  async disableTwoFactorAuth(@CurrentUser() user: User) {
    try {
      await this.authService.disableTwoFactorAuth(user.id);
      return {
        message: 'Authentification à deux facteurs désactivée avec succès',
      };
    } catch (error) {
      this.logger.error(`Two factor deactivation failed: ${error.message}`);
      throw error;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Obtenir les informations de l'utilisateur connecté",
  })
  @ApiResponse({
    status: 200,
    description: 'Informations récupérées avec succès',
  })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  async getProfile(@CurrentUser() user: User) {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      isVerified: user.isVerified,
      isTwoFactorEnabled: user.isTwoFactorEnabled,
      lastLogin: user.lastLogin,
    };
  }
}
