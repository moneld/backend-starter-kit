import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor(private configService: ConfigService) {
    // Configuration simplifiée sans événements
    super({
      log:
        configService.get('app.nodeEnv') === 'development'
          ? [
              { level: 'query', emit: 'stdout' },
              { level: 'error', emit: 'stdout' },
            ]
          : [{ level: 'error', emit: 'stdout' }],
    });
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Prisma connected successfully');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Prisma disconnected successfully');
  }

  async cleanDatabase() {
    if (this.configService.get('app.nodeEnv') === 'production') {
      throw new Error('cleanDatabase not allowed in production');
    }

    // Liste des tables à nettoyer - mettre à jour selon votre schéma
    const tablesToClean = [
      'user_roles',
      'role_permissions',
      'permissions',
      'roles',
      'users',
    ];

    try {
      for (const table of tablesToClean) {
        await this.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE;`);
      }
      this.logger.log('Database cleaned successfully');
    } catch (error) {
      this.logger.error(`Error cleaning database: ${error.message}`);
      throw error;
    }
  }
}
