import { Module } from '@nestjs/common';
import { PermissionsModule } from '../permissions/permissions.module';
import { RolesModule } from '../roles/roles.module';
import { UsersModule } from '../users/users.module';
import { AdminSeedService } from './admin-seed.service';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { DashboardController } from './controllers/dashboard.controller';
import { RolesAdminController } from './controllers/roles-admin.controller';
import { SettingsAdminController } from './controllers/settings-admin.controller';
import { UsersAdminController } from './controllers/users-admin.controller';
import { AdminGuard } from './guards/admin.guard';

@Module({
  imports: [UsersModule, RolesModule, PermissionsModule],
  controllers: [
    AdminController,
    DashboardController,
    UsersAdminController,
    RolesAdminController,
    SettingsAdminController,
  ],
  providers: [
    AdminService,
    AdminGuard,
    AdminSeedService, // Ajout du service de seed
  ],
  exports: [AdminService, AdminGuard],
})
export class AdminModule {}
