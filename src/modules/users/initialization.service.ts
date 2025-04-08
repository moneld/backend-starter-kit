import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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
        // En production, on ne veut pas initialiser automatiquement
        if (this.configService.get<string>('app.nodeEnv') === 'production') {
            this.logger.log('Skipping initialization in production mode');
            return;
        }

        try {
            await this.initializeRoles();
            await this.initializeAdmin();
            this.logger.log('Initialization completed successfully');
        } catch (error) {
            this.logger.error(`Initialization failed: ${error.message}`);
        }
    }

    private async initializeRoles() {
        const existingRoles = await this.prisma.role.count();

        if (existingRoles > 0) {
            this.logger.log('Roles already exist, skipping role initialization');
            return;
        }

        this.logger.log('Initializing default roles');

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
                data: { name: 'manage:roles', description: 'Manage roles and permissions' },
            }),
            this.prisma.permission.create({
                data: { name: 'access:admin', description: 'Access admin dashboard' },
            }),
        ]);

        // Créer les rôles avec leurs permissions
        await Promise.all([
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
                        create: permissions.map(p => ({ permissionId: p.id })),
                    },
                },
            }),
        ]);
    }

    private async initializeAdmin() {
        // Vérifier si un admin existe déjà
        const adminExists = await this.prisma.user.findFirst({
            where: {
                userRoles: {
                    some: {
                        role: {
                            name: 'admin',
                        },
                    },
                },
            },
        });

        if (adminExists) {
            this.logger.log('Admin user already exists, skipping admin initialization');
            return;
        }

        this.logger.log('Creating default admin user');

        // Récupérer le rôle admin
        const adminRole = await this.prisma.role.findUnique({
            where: { name: 'admin' },
        });

        if (!adminRole) {
            throw new Error('Admin role not found. Make sure to run initializeRoles first.');
        }

        // Créer l'admin
        const hashedPassword = await this.hashService.hash('Admin@123');

        await this.prisma.user.create({
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
    }
}