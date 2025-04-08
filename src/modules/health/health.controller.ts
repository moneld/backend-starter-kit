// src/modules/health/health.controller.ts
import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
    DiskHealthIndicator,
    HealthCheck,
    HealthCheckService,
    HttpHealthIndicator,
    MemoryHealthIndicator
} from '@nestjs/terminus';
import { PrismaService } from '../../prisma/prisma.service';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('Health')
@Controller({ path: 'health', version: '1' })
export class HealthController {
    constructor(
        private health: HealthCheckService,
        private http: HttpHealthIndicator,
        private disk: DiskHealthIndicator,
        private memory: MemoryHealthIndicator,
        private prisma: PrismaService,
        private configService: ConfigService,
    ) { }

    @Public()
    @Get()
    @ApiOperation({ summary: 'Vérifier la santé de l\'application' })
    @ApiResponse({ status: 200, description: 'L\'application est en bonne santé' })
    @ApiResponse({ status: 503, description: 'L\'application a des problèmes de santé' })
    @HealthCheck()
    check() {
        const externalServiceUrl = this.configService.get('app.externalServiceUrl');

        return this.health.check([
            // Vérification de la base de données
            async () => {
                try {
                    await this.prisma.$queryRaw`SELECT 1`;
                    return {
                        database: {
                            status: 'up',
                            message: 'Prisma connection is healthy'
                        }
                    };
                } catch (error) {
                    return {
                        database: {
                            status: 'down',
                            message: 'Prisma connection failed',
                            error: error.message
                        }
                    };
                }
            },

            // Vérification du disque
            () => this.disk.checkStorage('storage', { path: '/', threshold: 250 * 1024 * 1024 }),

            // Vérification de la mémoire
            () => this.memory.checkHeap('memory_heap', 300 * 1024 * 1024),

            // Vérification des services externes, si configuré
            ...(externalServiceUrl ? [
                () => this.http.pingCheck('external_api', externalServiceUrl),
            ] : []),
        ]);
    }

    @Public()
    @Get('liveness')
    @ApiOperation({ summary: 'Vérifier que l\'application est en vie' })
    @ApiResponse({ status: 200, description: 'L\'application est en vie' })
    liveness() {
        return {
            status: 'ok',
            timestamp: new Date().toISOString(),
        };
    }

    @Public()
    @Get('readiness')
    @ApiOperation({ summary: 'Vérifier que l\'application est prête à servir des requêtes' })
    @ApiResponse({ status: 200, description: 'L\'application est prête' })
    @ApiResponse({ status: 503, description: 'L\'application n\'est pas prête' })
    @HealthCheck()
    readiness() {
        return this.health.check([
            // Vérifier seulement la base de données
            async () => {
                try {
                    await this.prisma.$queryRaw`SELECT 1`;
                    return {
                        database: {
                            status: 'up',
                            message: 'Prisma connection is healthy'
                        }
                    };
                } catch (error) {
                    return {
                        database: {
                            status: 'down',
                            message: 'Prisma connection failed',
                            error: error.message
                        }
                    };
                }
            }
        ]);
    }
}