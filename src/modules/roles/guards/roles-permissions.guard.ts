import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../../prisma/prisma.service';
import { ROLES_KEY } from '../../auth/decorators/roles.decorator';
// Importons depuis le bon chemin, qui est au niveau des permissions
import { PERMISSIONS_KEY } from '../../../modules/permissions/decorators/permissions.decorator';

@Injectable()
export class RolesPermissionsGuard implements CanActivate {
  private readonly logger = new Logger(RolesPermissionsGuard.name);

  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Récupérer les rôles et permissions requis depuis les décorateurs
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Si aucun rôle ou permission n'est requis, autoriser l'accès
    if (
      (!requiredRoles || requiredRoles.length === 0) &&
      (!requiredPermissions || requiredPermissions.length === 0)
    ) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return false;
    }

    // Récupérer les rôles et permissions de l'utilisateur
    const userRoles = await this.prisma.userRole.findMany({
      where: { userId: user.id },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    // Vérifier les rôles
    let hasRequiredRole = true;
    if (requiredRoles && requiredRoles.length > 0) {
      hasRequiredRole = userRoles.some((userRole) =>
        requiredRoles.includes(userRole.role.name),
      );
    }

    // Vérifier les permissions
    let hasRequiredPermission = true;
    if (requiredPermissions && requiredPermissions.length > 0) {
      // Extraire toutes les permissions de tous les rôles de l'utilisateur
      const userPermissions = new Set<string>();
      userRoles.forEach((userRole) => {
        userRole.role.rolePermissions.forEach((rolePermission) => {
          userPermissions.add(rolePermission.permission.name);
        });
      });

      hasRequiredPermission = requiredPermissions.some((permission) =>
        userPermissions.has(permission),
      );
    }

    // Si l'utilisateur a au moins un des rôles requis ET au moins une des permissions requises
    const hasAccess = hasRequiredRole && hasRequiredPermission;

    if (!hasAccess) {
      // Log détaillé pour le débogage
      this.logger.warn(
        `Access denied for user ${user.id}. Required roles: ${requiredRoles?.join(', ')}, ` +
          `Required permissions: ${requiredPermissions?.join(', ')}`,
      );

      throw new ForbiddenException(
        'You do not have the required roles or permissions',
      );
    }

    return true;
  }
}
