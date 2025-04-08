// src/modules/admin/admin.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { RolesService } from '../roles/roles.service';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminService {
    private readonly logger = new Logger(AdminService.name);

    constructor(
        private readonly usersService: UsersService,
        private readonly rolesService: RolesService,
        private readonly prisma: PrismaService,
        private readonly configService: ConfigService,
    ) { }

    /**
     * Obtenir un résumé des statistiques pour le tableau de bord admin
     */
    async getDashboardStats() {
        try {
            // Compteurs utilisateurs
            const totalUsers = await this.prisma.user.count();
            const activeUsers = await this.prisma.user.count({
                where: { isActive: true }
            });
            const verifiedUsers = await this.prisma.user.count({
                where: { isVerified: true }
            });

            // Compteurs rôles et permissions
            const totalRoles = await this.prisma.role.count();
            const totalPermissions = await this.prisma.permission.count();

            // Utilisateurs récents
            const recentUsers = await this.prisma.user.findMany({
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    createdAt: true,
                    isActive: true,
                    isVerified: true,
                },
                orderBy: { createdAt: 'desc' },
                take: 5,
            });

            // Activité récente (à implémenter si vous avez une table d'activité/logs)
            const recentActivity = [];

            return {
                stats: {
                    totalUsers,
                    activeUsers,
                    verifiedUsers,
                    totalRoles,
                    totalPermissions,
                },
                recentUsers,
                recentActivity,
            };
        } catch (error) {
            this.logger.error(`Error getting dashboard stats: ${error.message}`);
            throw error;
        }
    }

    /**
     * Obtenir des statistiques système
     */
    async getSystemStats() {
        const startTime = process.uptime();
        const memoryUsage = process.memoryUsage();

        return {
            environment: this.configService.get('app.nodeEnv', 'development'),
            uptime: {
                seconds: startTime,
                formatted: this.formatUptime(startTime),
            },
            memory: {
                rss: this.formatBytes(memoryUsage.rss),
                heapTotal: this.formatBytes(memoryUsage.heapTotal),
                heapUsed: this.formatBytes(memoryUsage.heapUsed),
                external: this.formatBytes(memoryUsage.external),
            },
            process: {
                pid: process.pid,
                version: process.version,
                platform: process.platform,
                arch: process.arch,
            },
        };
    }

    /**
     * Obtenir les paramètres du système
     */
    getSystemSettings() {
        return {
            app: {
                name: this.configService.get('app.name', 'NestJS API'),
                version: this.configService.get('app.apiVersion', '1.0'),
                environment: this.configService.get('app.nodeEnv', 'development'),
            },
            security: {
                rateLimiting: this.configService.get('app.rateLimitLimit', 100),
                maxLoginAttempts: this.configService.get('app.maxLoginAttempts', 5),
                twoFactorAuthEnabled: true,
            },
            email: {
                provider: 'SMTP',
                fromEmail: this.configService.get('email.fromEmail', 'noreply@example.com'),
                fromName: this.configService.get('email.fromName', 'NestJS API'),
            },
            i18n: {
                defaultLanguage: this.configService.get('app.defaultLanguage', 'fr'),
                supportedLanguages: this.configService.get('app.supportedLanguages', ['fr', 'en']),
            },
        };
    }

    /**
     * Formatter les octets en unités lisibles
     */
    private formatBytes(bytes: number): string {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Formatter le temps d'exécution
     */
    private formatUptime(seconds: number): string {
        const days = Math.floor(seconds / (3600 * 24));
        const hours = Math.floor((seconds % (3600 * 24)) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);

        let result = '';
        if (days > 0) result += `${days}d `;
        if (hours > 0) result += `${hours}h `;
        if (minutes > 0) result += `${minutes}m `;
        result += `${secs}s`;

        return result;
    }
}