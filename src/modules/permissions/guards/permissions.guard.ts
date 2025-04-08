import { CanActivate, ExecutionContext, ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { PermissionsService } from '../permissions.service';

@Injectable()
export class PermissionsGuard implements CanActivate {
    private readonly logger = new Logger(PermissionsGuard.name);

    constructor(
        private reflector: Reflector,
        private permissionsService: PermissionsService,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        // Si aucune permission n'est requise, autoriser l'accès
        if (!requiredPermissions || requiredPermissions.length === 0) {
            return true;
        }

        const request = context.switchToHttp().getRequest();
        const user = request.user;

        if (!user) {
            return false;
        }

        // Récupérer toutes les permissions de l'utilisateur
        const userPermissions = await this.permissionsService.getUserPermissions(user.id);

        // Vérifier si l'utilisateur a au moins une des permissions requises
        const hasPermission = requiredPermissions.some(permission =>
            userPermissions.some(p => p.name === permission)
        );

        if (!hasPermission) {
            this.logger.warn(`User ${user.id} tried to access a resource requiring permissions: ${requiredPermissions.join(', ')}`);
            throw new ForbiddenException('You do not have the required permissions to access this resource');
        }

        return true;
    }
}