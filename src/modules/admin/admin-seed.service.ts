// src/modules/admin/admin-seed.service.ts
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminSeedService implements OnModuleInit {
    private readonly logger = new Logger(AdminSeedService.name);

    constructor(
        private prisma: PrismaService,
        private configService: ConfigService,
    ) { }

    async onModuleInit() {
        // Ne pas initialiser en production sauf si forcé
        if (
            this.configService.get<string>('app.nodeEnv') === 'production' &&
            !this.configService.get<boolean>('app.forceInitAdmin', false)
        ) {
            this.logger.log('Skipping admin permissions initialization in production mode');
            return;
        }

        await this.ensureAdminPermission();
    }

    /**
     * S'assure que la permission 'access:admin' existe
     * Cette permission est nécessaire pour le module d'administration
     */
    private async ensureAdminPermission() {
        try {
            // Vérifier si la permission admin existe déjà
            const adminPermission = await this.prisma.permission.findUnique({
                where: { name: 'access:admin' },
            });

            if (!adminPermission) {
                // Créer la permission si elle n'existe pas
                await this.prisma.permission.create({
                    data: {
                        name: 'access:admin',
                        description: 'Access admin dashboard and management features',
                    },
                });
                this.logger.log('Created admin permission');
            } else {
                this.logger.log('Admin permission already exists');
            }

            // S'assurer que le rôle admin a cette permission
            const adminRole = await this.prisma.role.findUnique({
                where: { name: 'admin' },
                include: {
                    rolePermissions: {
                        include: { permission: true },
                    },
                },
            });

            if (adminRole) {
                // Vérifier si le rôle admin a déjà la permission
                const hasAdminPermission = adminRole.rolePermissions.some(
                    rp => rp.permission.name === 'access:admin'
                );

                if (!hasAdminPermission) {
                    // Récupérer l'ID de la permission
                    const permission = await this.prisma.permission.findUnique({
                        where: { name: 'access:admin' },
                    });

                    if (permission) {
                        // Ajouter la permission au rôle admin
                        await this.prisma.rolePermission.create({
                            data: {
                                roleId: adminRole.id,
                                permissionId: permission.id,
                            },
                        });
                        this.logger.log('Added admin permission to admin role');
                    }
                } else {
                    this.logger.log('Admin role already has admin permission');
                }
            } else {
                this.logger.warn('Admin role not found, cannot assign admin permission');
            }
        } catch (error) {
            this.logger.error(`Failed to ensure admin permission: ${error.message}`);
        }
    }
}