import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import { PrismaService } from '../../prisma/prisma.service';
import { HashService } from '../auth/services/hash.service';

@Injectable()
export class InitializationService implements OnModuleInit {
  private readonly logger = new Logger(InitializationService.name);

  constructor(
    private prisma: PrismaService,
    private hashService: HashService,
    private configService: ConfigService,
  ) { }

  async onModuleInit() {
    // En production, n'initialiser que si c'est explicitement demandé
    const forceInit = this.configService.get<boolean>('app.forceInit', false);
    const isProduction = this.configService.get<string>('app.nodeEnv') === 'production';

    if (isProduction && !forceInit) {
      this.logger.log('Skipping initialization in production mode');
      return;
    }

    try {
      // Vérifier d'abord si des données existent déjà
      const userCount = await this.prisma.user.count();
      const roleCount = await this.prisma.role.count();

      if (userCount > 0 && roleCount > 0) {
        this.logger.log('Database already contains users and roles, skipping initialization');
        return;
      }

      if (roleCount === 0) {
        await this.initializeRoles();
      } else {
        this.logger.log('Roles already exist, skipping role initialization');
      }

      if (userCount === 0) {
        await this.initializeAdmin();
      } else {
        this.logger.log('Users already exist, skipping admin initialization');
      }

      this.logger.log('Initialization completed successfully');
    } catch (error) {
      this.logger.error(`Initialization failed: ${error.message}`);
      this.logger.error(error.stack);
    }
  }

  private async initializeRoles() {
    this.logger.log('Initializing default roles and permissions');

    try {
      // Créer les permissions
      const permissions = await Promise.all([
        this.prisma.permission.create({
          data: { name: 'create:user', description: 'Create users' },
        }),
        this.prisma.permission.create({
          data: { name: 'read:user', description: 'Read users' },
        }),
        this.prisma.permission.create({
          data: { name: 'update:user', description: 'Update users' },
        }),
        this.prisma.permission.create({
          data: { name: 'delete:user', description: 'Delete users' },
        }),
        this.prisma.permission.create({
          data: {
            name: 'manage:roles',
            description: 'Manage roles and permissions',
          },
        }),
        this.prisma.permission.create({
          data: { name: 'access:admin', description: 'Access admin dashboard' },
        }),
      ]);

      this.logger.log(`Created ${permissions.length} permissions`);

      // Créer les rôles avec leurs permissions
      const roles = await Promise.all([
        // Rôle utilisateur
        this.prisma.role.create({
          data: {
            name: 'user',
            description: 'Regular user',
            rolePermissions: {
              create: [{ permissionId: permissions[1].id }], // read:user seulement
            },
          },
        }),

        // Rôle modérateur
        this.prisma.role.create({
          data: {
            name: 'moderator',
            description: 'Moderator',
            rolePermissions: {
              create: [
                { permissionId: permissions[1].id }, // read:user
                { permissionId: permissions[2].id }, // update:user
              ],
            },
          },
        }),

        // Rôle admin
        this.prisma.role.create({
          data: {
            name: 'admin',
            description: 'Administrator',
            rolePermissions: {
              create: permissions.map((p) => ({ permissionId: p.id })),
            },
          },
        }),
      ]);

      this.logger.log(`Created ${roles.length} roles`);
      return roles;
    } catch (error) {
      this.logger.error(`Failed to initialize roles: ${error.message}`);
      throw error;
    }
  }

  private async initializeAdmin() {
    this.logger.log('Creating default admin user');

    try {
      // Récupérer le rôle admin
      const adminRole = await this.prisma.role.findUnique({
        where: { name: 'admin' },
      });

      if (!adminRole) {
        throw new Error(
          'Admin role not found. Make sure to run initializeRoles first.',
        );
      }

      // Créer l'admin avec un mot de passe plus sécurisé
      const securePassword = this.generateSecurePassword();
      this.logger.log(`Generated secure password for admin: ${securePassword}`);

      // Créer l'admin avec Argon2
      const hashedPassword = await argon2.hash(securePassword, {
        type: argon2.argon2id,
        memoryCost: this.configService.get<number>('auth.argon2.memoryCost', 4096),
        timeCost: this.configService.get<number>('auth.argon2.timeCost', 3),
        parallelism: this.configService.get<number>('auth.argon2.parallelism', 1),
        hashLength: this.configService.get<number>('auth.argon2.hashLength', 32),
      });

      const adminUser = await this.prisma.user.create({
        data: {
          email: 'admin@example.com',
          password: hashedPassword,
          firstName: 'Admin',
          lastName: 'User',
          isActive: true,
          isVerified: true,
          userRoles: {
            create: [{ roleId: adminRole.id }],
          },
        },
      });

      this.logger.log(`Created admin user with ID: ${adminUser.id}`);
      return adminUser;
    } catch (error) {
      this.logger.error(`Failed to initialize admin user: ${error.message}`);
      throw error;
    }
  }

  /**
   * Génère un mot de passe sécurisé aléatoire
   * Au lieu d'utiliser "admin123" codé en dur
   */
  private generateSecurePassword(): string {
    const length = 16;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+=-';
    let password = '';

    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      password += charset[randomIndex];
    }

    return password;
  }
}