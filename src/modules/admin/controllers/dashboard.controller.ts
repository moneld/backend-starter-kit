// src/modules/admin/controllers/dashboard.controller.ts
import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AdminService, RecentActivity } from '../admin.service';
import { AdminGuard } from '../guards/admin.guard';

interface DashboardStats {
  stats: {
    totalUsers: number;
    activeUsers: number;
    verifiedUsers: number;
    totalRoles: number;
    totalPermissions: number;
  };
  recentUsers: any[]; // You might want to create a more specific type
  recentActivity: RecentActivity[];
}

@ApiTags('Admin Dashboard')
@Controller({ path: 'admin/dashboard', version: '1' })
@UseGuards(JwtAuthGuard, AdminGuard)
@ApiBearerAuth()
export class DashboardController {
  constructor(private readonly adminService: AdminService) {}

  @Get()
  @ApiOperation({ summary: 'Obtenir les statistiques du tableau de bord' })
  @ApiResponse({
    status: 200,
    description: 'Statistiques récupérées avec succès',
  })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 403, description: 'Accès non autorisé' })
  async getDashboardStats(): Promise<DashboardStats> {
    return this.adminService.getDashboardStats();
  }
}
