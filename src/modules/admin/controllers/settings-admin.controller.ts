// src/modules/admin/controllers/settings-admin.controller.ts
import { Body, Controller, Get, Logger, Post, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AdminService } from '../admin.service';
import { AdminGuard } from '../guards/admin.guard';

// DTO pour la modification des paramètres
class UpdateSettingsDto {
  app?: {
    name?: string;
    defaultLanguage?: string;
    supportedLanguages?: string[];
  };
  security?: {
    rateLimitLimit?: number;
    maxLoginAttempts?: number;
    accountLockDurationMinutes?: number;
  };
  email?: {
    fromEmail?: string;
    fromName?: string;
  };
}

@ApiTags('Admin Settings')
@Controller({ path: 'admin/settings', version: '1' })
@UseGuards(JwtAuthGuard, AdminGuard)
@ApiBearerAuth()
export class SettingsAdminController {
  private readonly logger = new Logger(SettingsAdminController.name);

  constructor(
    private readonly adminService: AdminService,
    private readonly configService: ConfigService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Obtenir les paramètres système' })
  @ApiResponse({ status: 200, description: 'Paramètres récupérés avec succès' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 403, description: 'Accès non autorisé' })
  async getSettings() {
    return this.adminService.getSystemSettings();
  }

  @Post()
  @ApiOperation({ summary: 'Mettre à jour les paramètres système' })
  @ApiResponse({
    status: 200,
    description: 'Paramètres mis à jour avec succès',
  })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 403, description: 'Accès non autorisé' })
  async updateSettings(@Body() updateSettingsDto: UpdateSettingsDto) {
    // Note: Cette méthode est un placeholder
    // Dans une implémentation réelle, vous devriez mettre à jour les paramètres
    // dans un fichier de configuration ou une base de données

    this.logger.log(
      `Settings update requested: ${JSON.stringify(updateSettingsDto)}`,
    );

    // Simuler une mise à jour réussie
    return {
      success: true,
      message: 'Settings updated successfully',
      // Renvoyer les paramètres actuels (qui ne sont pas réellement modifiés)
      settings: this.adminService.getSystemSettings(),
    };
  }

  @Get('logs')
  @ApiOperation({ summary: 'Obtenir les logs système' })
  @ApiResponse({ status: 200, description: 'Logs récupérés avec succès' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 403, description: 'Accès non autorisé' })
  async getLogs() {
    // Note: Cette méthode est un placeholder
    // Dans une implémentation réelle, vous récupéreriez les logs du système

    return {
      logs: [
        {
          timestamp: new Date().toISOString(),
          level: 'info',
          message: 'Application started',
          context: 'AppModule',
        },
        {
          timestamp: new Date(Date.now() - 60000).toISOString(),
          level: 'warn',
          message: 'Rate limit exceeded for IP 192.168.1.1',
          context: 'ThrottlerGuard',
        },
        {
          timestamp: new Date(Date.now() - 120000).toISOString(),
          level: 'error',
          message: 'Database connection failed',
          context: 'PrismaService',
        },
      ],
    };
  }
}
