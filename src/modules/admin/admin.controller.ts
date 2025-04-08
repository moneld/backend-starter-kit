// src/modules/admin/admin.controller.ts
import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from './guards/admin.guard';
import { AdminService } from './admin.service';

@ApiTags('Admin')
@Controller({ path: 'admin', version: '1' })
@UseGuards(JwtAuthGuard, AdminGuard)
@ApiBearerAuth()
export class AdminController {
    constructor(private readonly adminService: AdminService) { }

    @Get()
    @ApiOperation({ summary: 'Obtenir les informations générales du module d\'administration' })
    @ApiResponse({ status: 200, description: 'Informations récupérées avec succès' })
    @ApiResponse({ status: 401, description: 'Non authentifié' })
    @ApiResponse({ status: 403, description: 'Accès non autorisé' })
    async getAdminInfo() {
        return {
            name: 'Admin Dashboard',
            version: '1.0.0',
            description: 'Administration interface for the NestJS API',
            endpoints: [
                { path: '/admin/dashboard', description: 'Dashboard overview' },
                { path: '/admin/users', description: 'User management' },
                { path: '/admin/roles', description: 'Role management' },
                { path: '/admin/settings', description: 'System settings' },
            ],
        };
    }

    @Get('system')
    @ApiOperation({ summary: 'Obtenir les statistiques système' })
    @ApiResponse({ status: 200, description: 'Statistiques récupérées avec succès' })
    @ApiResponse({ status: 401, description: 'Non authentifié' })
    @ApiResponse({ status: 403, description: 'Accès non autorisé' })
    async getSystemStats() {
        return this.adminService.getSystemStats();
    }

    @Get('settings')
    @ApiOperation({ summary: 'Obtenir les paramètres système' })
    @ApiResponse({ status: 200, description: 'Paramètres récupérés avec succès' })
    @ApiResponse({ status: 401, description: 'Non authentifié' })
    @ApiResponse({ status: 403, description: 'Accès non autorisé' })
    async getSystemSettings() {
        return this.adminService.getSystemSettings();
    }
}