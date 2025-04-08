import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { Tokens } from './interfaces/tokens.interface';
import { HashService } from './services/hash.service';
import { TwoFactorAuthService } from './services/two-factor-auth.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly jwtAccessExpiration: string;
  private readonly jwtRefreshExpiration: string;
  private readonly maxLoginAttempts: number = 5;
  private readonly lockDuration: number = 15 * 60; // 15 minutes en secondes

  constructor(
    public readonly usersService: UsersService,
    private jwtService: JwtService,
    private hashService: HashService,
    private twoFactorAuthService: TwoFactorAuthService,
    private configService: ConfigService,
  ) {
    this.jwtAccessExpiration = this.configService.get<string>(
      'auth.jwtAccessExpiration',
      '15m',
    );
    this.jwtRefreshExpiration = this.configService.get<string>(
      'auth.jwtRefreshExpiration',
      '7d',
    );
  }

  /**
   * Valider les identifiants de l'utilisateur pour la stratégie locale
   */
  async validateUser(email: string, password: string): Promise<User> {
    const user = await this.usersService.findByEmail(email);

    // Vérifier si l'utilisateur existe
    if (!user) {
      // On ne précise pas si l'utilisateur existe ou non pour des raisons de sécurité
      throw new UnauthorizedException('Invalid credentials');
    }

    // Vérifier si le compte est actif
    if (!user.isActive) {
      throw new UnauthorizedException('Account is inactive');
    }

    // Vérifier si le compte est verrouillé
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const remainingTimeMs = user.lockedUntil.getTime() - Date.now();
      const remainingMinutes = Math.ceil(remainingTimeMs / 60000);
      throw new UnauthorizedException(
        `Account is locked. Please try again in ${remainingMinutes} minute(s)`,
      );
    }

    // Vérifier le mot de passe
    const isPasswordValid = await this.hashService.verify(
      user.password,
      password,
    );

    if (!isPasswordValid) {
      // Incrémenter le compteur de tentatives de connexion
      const updatedUser = await this.usersService.incrementLoginAttempts(email);

      // Vérifier si le compte doit être verrouillé
      if (updatedUser.loginAttempts >= this.maxLoginAttempts) {
        await this.usersService.lockAccount(email, this.lockDuration);
        throw new UnauthorizedException(
          `Too many failed login attempts. Account is locked for ${this.lockDuration / 60} minutes`,
        );
      }

      throw new UnauthorizedException('Invalid credentials');
    }

    // Réinitialiser le compteur de tentatives de connexion en cas de succès
    await this.usersService.resetLoginAttempts(email);

    // Mettre à jour la date de dernière connexion
    await this.usersService.updateLastLogin(user.id);

    // Si le mot de passe doit être recalculé (par exemple, si les paramètres de hachage ont changé)
    if (await this.hashService.needsRehash(user.password)) {
      const newHash = await this.hashService.hash(password);
      await this.usersService.update(user.id, { password: newHash });
    }

    return user;
  }

  /**
   * Enregistrer un nouvel utilisateur
   */
  async register(
    registerDto: RegisterDto,
  ): Promise<{ user: User; verificationToken: string }> {
    const { email, password, firstName, lastName } = registerDto;

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    // Hacher le mot de passe
    const hashedPassword = await this.hashService.hash(password);

    // Générer un token de vérification
    const verificationToken = uuidv4();
    const tokenExpiration = 24 * 60 * 60; // 24 heures en secondes

    // Créer l'utilisateur
    const user = await this.usersService.create({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      isActive: true,
      isVerified: false,
    });

    // Attacher le token de vérification
    await this.usersService.setVerificationToken(
      email,
      verificationToken,
      tokenExpiration,
    );

    return { user, verificationToken };
  }

  /**
   * Générer des tokens JWT (access et refresh)
   */
  async generateTokens(user: User): Promise<Tokens> {
    const jwtPayload: JwtPayload = {
      sub: user.id,
      email: user.email,
      isVerified: user.isVerified,
      isTwoFactorEnabled: user.isTwoFactorEnabled,
    };

    // Générer le token d'accès
    const accessToken = this.jwtService.sign(jwtPayload, {
      secret: this.configService.get<string>('auth.jwtAccessSecret'),
      expiresIn: this.jwtAccessExpiration,
    });

    // Générer le token de rafraîchissement
    const refreshToken = this.jwtService.sign(jwtPayload, {
      secret: this.configService.get<string>('auth.jwtRefreshSecret'),
      expiresIn: this.jwtRefreshExpiration,
    });

    // Mettre à jour le token de rafraîchissement dans la base de données
    await this.usersService.updateRefreshToken(user.id, refreshToken);

    return {
      accessToken,
      refreshToken,
      expiresIn: this.parseJwtExpiration(this.jwtAccessExpiration),
    };
  }

  /**
   * Rafraîchir les tokens
   */
  async refreshTokens(userId: string, refreshToken: string): Promise<Tokens> {
    // Vérifier si l'utilisateur existe et si le token de rafraîchissement correspond
    const user = await this.usersService.getUserIfRefreshTokenMatches(
      userId,
      refreshToken,
    );

    if (!user) {
      throw new ForbiddenException('Invalid refresh token');
    }

    // Générer de nouveaux tokens
    return this.generateTokens(user);
  }

  /**
   * Déconnexion (révocation du refresh token)
   */
  async logout(userId: string): Promise<void> {
    await this.usersService.updateRefreshToken(userId, null);
  }

  /**
   * Vérifier l'email d'un utilisateur
   */
  async verifyEmail(token: string): Promise<User> {
    return this.usersService.verifyEmail(token);
  }

  /**
   * Demander la réinitialisation du mot de passe
   */
  async requestPasswordReset(email: string): Promise<{ resetToken: string }> {
    const user = await this.usersService.findByEmail(email);

    // Pour des raisons de sécurité, on ne révèle pas si l'email existe ou non
    if (!user) {
      return { resetToken: '' };
    }

    // Générer un token de réinitialisation
    const resetToken = uuidv4();
    const tokenExpiration = 1 * 60 * 60; // 1 heure en secondes

    // Attacher le token à l'utilisateur
    await this.usersService.setResetPasswordToken(
      email,
      resetToken,
      tokenExpiration,
    );

    return { resetToken };
  }

  /**
   * Réinitialiser le mot de passe
   */
  async resetPassword(token: string, newPassword: string): Promise<User> {
    // Hacher le nouveau mot de passe
    const hashedPassword = await this.hashService.hash(newPassword);

    // Mettre à jour le mot de passe et révoquer le token
    return this.usersService.resetPassword(token, hashedPassword);
  }

  /**
   * Configurer l'authentification à deux facteurs
   */
  async generateTwoFactorAuthSecret(
    user: User,
  ): Promise<{ secret: string; otpAuthUrl: string; qrCodeDataUrl: string }> {
    const { secret, otpAuthUrl } =
      await this.twoFactorAuthService.generateSecret(user);
    const qrCodeDataUrl =
      await this.twoFactorAuthService.generateQrCodeDataURL(otpAuthUrl);

    // Sauvegarder le secret dans la base de données
    await this.usersService.setTwoFactorAuthSecret(user.id, secret);

    return {
      secret,
      otpAuthUrl,
      qrCodeDataUrl,
    };
  }

  /**
   * Activer l'authentification à deux facteurs
   */
  async enableTwoFactorAuth(
    userId: string,
    token: string,
  ): Promise<{ recoveryCodes: string[] }> {
    const user = await this.usersService.findOne(userId);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (!user.twoFactorAuthSecret) {
      throw new BadRequestException(
        'Two-factor authentication has not been initialized',
      );
    }

    // Vérifier le code 2FA
    const isCodeValid = await this.twoFactorAuthService.verifyToken(
      token,
      user.twoFactorAuthSecret,
    );

    if (!isCodeValid) {
      throw new UnauthorizedException('Invalid authentication code');
    }

    // Générer des codes de récupération
    const recoveryCodes = this.twoFactorAuthService.generateRecoveryCodes();

    // Activer l'authentification à deux facteurs
    await this.usersService.enableTwoFactorAuth(userId, recoveryCodes);

    return { recoveryCodes };
  }

  /**
   * Vérifier le code d'authentification à deux facteurs
   */
  async verifyTwoFactorAuthToken(
    userId: string,
    token: string,
  ): Promise<boolean> {
    const user = await this.usersService.findOne(userId);

    if (!user || !user.twoFactorAuthSecret) {
      return false;
    }

    return this.twoFactorAuthService.verifyToken(
      token,
      user.twoFactorAuthSecret,
    );
  }

  /**
   * Vérifier un code de récupération 2FA
   */
  async verifyTwoFactorRecoveryCode(
    userId: string,
    recoveryCode: string,
  ): Promise<boolean> {
    const user = await this.usersService.findOne(userId);

    if (!user || !user.twoFactorRecoveryCodes) {
      return false;
    }

    const isValid = this.twoFactorAuthService.isValidRecoveryCode(
      recoveryCode,
      user.twoFactorRecoveryCodes,
    );

    if (isValid) {
      // Retirer le code de récupération utilisé
      const updatedCodes = this.twoFactorAuthService.removeUsedRecoveryCode(
        recoveryCode,
        user.twoFactorRecoveryCodes,
      );

      // Mettre à jour les codes restants
      await this.usersService.update(userId, {
        twoFactorRecoveryCodes: updatedCodes,
      });
    }

    return isValid;
  }

  /**
   * Désactiver l'authentification à deux facteurs
   */
  async disableTwoFactorAuth(userId: string): Promise<void> {
    await this.usersService.disableTwoFactorAuth(userId);
  }

  /**
   * Convertir une chaîne d'expiration JWT en secondes
   */
  private parseJwtExpiration(expiration: string): number {
    const unit = expiration.slice(-1);
    const value = parseInt(expiration.slice(0, -1), 10);

    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 60 * 60;
      case 'd':
        return value * 60 * 60 * 24;
      default:
        return 900; // 15 minutes par défaut
    }
  }
}
