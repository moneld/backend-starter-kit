// src/modules/admin/guards/admin.guard.ts
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsService } from '../../permissions/permissions.service';

/**
 * Guard qui vérifie si l'utilisateur a les permissions d'administration nécessaires
 */
@Injectable()
export class AdminGuard implements CanActivate {
  private readonly logger = new Logger(AdminGuard.name);
  private readonly ADMIN_PERMISSION = 'access:admin';

  constructor(
    private reflector: Reflector,
    private permissionsService: PermissionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      this.logger.warn('User not found in request');
      return false;
    }

    try {
      // Vérifier si l'utilisateur a la permission 'access:admin'
      const hasPermission = await this.permissionsService.userHasPermission(
        user.id,
        this.ADMIN_PERMISSION,
      );

      if (!hasPermission) {
        this.logger.warn(
          `User ${user.id} tried to access admin area without permission`,
        );
        throw new ForbiddenException(
          'You do not have permission to access the admin area',
        );
      }

      return true;
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }

      this.logger.error(`Error checking admin permissions: ${error.message}`);
      return false;
    }
  }
}
