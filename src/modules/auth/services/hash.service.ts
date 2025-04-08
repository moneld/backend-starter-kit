import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';

@Injectable()
export class HashService {
  private readonly logger = new Logger(HashService.name);
  private readonly memoryCost: number;
  private readonly timeCost: number;
  private readonly parallelism: number;
  private readonly hashLength: number;

  constructor(private configService: ConfigService) {
    this.memoryCost = this.configService.get<number>(
      'auth.argon2.memoryCost',
      4096,
    );
    this.timeCost = this.configService.get<number>('auth.argon2.timeCost', 3);
    this.parallelism = this.configService.get<number>(
      'auth.argon2.parallelism',
      1,
    );
    this.hashLength = this.configService.get<number>(
      'auth.argon2.hashLength',
      32,
    );
  }

  /**
   * Hashage d'un mot de passe avec Argon2id (recommandé pour la sécurité maximale)
   */
  async hash(password: string): Promise<string> {
    try {
      return await argon2.hash(password, {
        type: argon2.argon2id, // Meilleur équilibre entre résistance aux attaques
        memoryCost: this.memoryCost,
        timeCost: this.timeCost,
        parallelism: this.parallelism,
        hashLength: this.hashLength,
      });
    } catch (error) {
      this.logger.error(`Error hashing password: ${error.message}`);
      throw new Error('Password hashing failed');
    }
  }

  /**
   * Vérification d'un mot de passe contre un hash
   */
  async verify(hash: string, password: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, password);
    } catch (error) {
      this.logger.error(`Error verifying password: ${error.message}`);
      throw new Error('Password verification failed');
    }
  }

  /**
   * Vérification si un hash doit être recalculé (suite à un changement de paramètres)
   */
  async needsRehash(hash: string): Promise<boolean> {
    try {
      // Extraction des options du hash existant
      const params = await argon2.needsRehash(hash, {
        memoryCost: this.memoryCost,
        timeCost: this.timeCost,
        parallelism: this.parallelism,
      });

      return params;
    } catch (error) {
      this.logger.error(
        `Error checking if password needs rehash: ${error.message}`,
      );
      return true; // En cas d'erreur, on préfère rehacher
    }
  }
}
