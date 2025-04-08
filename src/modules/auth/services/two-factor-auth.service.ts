import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { User } from '@prisma/client';
import * as crypto from 'crypto';
import { authenticator } from 'otplib';
import * as QRCode from 'qrcode';

@Injectable()
export class TwoFactorAuthService {
  private readonly logger = new Logger(TwoFactorAuthService.name);

  constructor(private configService: ConfigService) {
    // Configuration de la bibliothèque otplib
    authenticator.options = {
      step: 30, // Période de validité du code (30 secondes)
      digits: 6, // Nombre de chiffres dans le code
      window: 1, // Tolérance de 1 pas avant/après pour la validation (soit +/- 30 secondes)
    };
  }

  /**
   * Générer un secret pour l'authentification à deux facteurs
   */
  async generateSecret(
    user: User,
  ): Promise<{ secret: string; otpAuthUrl: string }> {
    const appName =
      this.configService.get<string>('auth.twoFactorAuthenticationAppName') ||
      'NestJS App';
    const secret = authenticator.generateSecret();
    const otpAuthUrl = authenticator.keyuri(user.email, appName, secret);

    return {
      secret,
      otpAuthUrl,
    };
  }

  /**
   * Valider un code 2FA
   */
  async verifyToken(token: string, secret: string): Promise<boolean> {
    try {
      return authenticator.verify({
        token,
        secret,
      });
    } catch (error) {
      this.logger.error(`Error verifying 2FA token: ${error.message}`);
      return false;
    }
  }

  /**
   * Générer un QR code pour l'enregistrement de l'authentification à deux facteurs
   */
  async generateQrCodeDataURL(otpAuthUrl: string): Promise<string> {
    try {
      return QRCode.toDataURL(otpAuthUrl);
    } catch (error) {
      this.logger.error(`Error generating QR code: ${error.message}`);
      throw new Error('QR code generation failed');
    }
  }

  /**
   * Générer des codes de récupération pour l'authentification à deux facteurs
   */
  generateRecoveryCodes(count: number = 10): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      // Format: 4 groupes de 4 caractères alphanumériques séparés par des tirets
      const code = `${this.generateRandomString(4)}-${this.generateRandomString(4)}-${this.generateRandomString(4)}-${this.generateRandomString(4)}`;
      codes.push(code);
    }
    return codes;
  }

  /**
   * Vérifier si un code de récupération est valide
   */
  isValidRecoveryCode(code: string, userRecoveryCodes: string[]): boolean {
    return userRecoveryCodes.includes(code);
  }

  /**
   * Retirer un code de récupération utilisé
   */
  removeUsedRecoveryCode(code: string, userRecoveryCodes: string[]): string[] {
    return userRecoveryCodes.filter((recoveryCode) => recoveryCode !== code);
  }

  /**
   * Générer une chaîne aléatoire pour les codes de récupération
   */
  private generateRandomString(length: number): string {
    // Caractères alphanumériques sans ambiguïtés (pas de 0/O, 1/I/l, etc.)
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const randomBytes = crypto.randomBytes(length);
    let result = '';

    for (let i = 0; i < length; i++) {
      const randomIndex = randomBytes[i] % chars.length;
      result += chars.charAt(randomIndex);
    }

    return result;
  }
}
