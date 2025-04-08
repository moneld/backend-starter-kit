// src/modules/health/indicators/prisma.health.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class PrismaHealthIndicator {
    constructor(private readonly prismaService: PrismaService) { }

    async check(key: string) {
        try {
            // Exécuter une requête simple pour vérifier que la connexion à la base de données fonctionne
            await this.prismaService.$queryRaw`SELECT 1`;

            // Retourner un statut positif
            return {
                [key]: {
                    status: 'up',
                    message: 'Prisma connection is healthy'
                }
            };
        } catch (error) {
            // Retourner un statut négatif sans utiliser HealthCheckError
            return {
                [key]: {
                    status: 'down',
                    message: 'Prisma connection failed',
                    error: error.message,
                }
            };
        }
    }
}