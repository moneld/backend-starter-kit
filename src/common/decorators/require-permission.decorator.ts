// src/common/decorators/require-permission.decorator.ts
import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiForbiddenResponse, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../modules/auth/guards/jwt-auth.guard';
import { PERMISSIONS_KEY } from '../../modules/permissions/decorators/permissions.decorator';
import { PermissionsGuard } from '../../modules/permissions/guards/permissions.guard';

export function RequirePermission(...permissions: string[]) {
    return applyDecorators(
        SetMetadata(PERMISSIONS_KEY, permissions),
        UseGuards(JwtAuthGuard, PermissionsGuard),
        ApiBearerAuth(),
        ApiUnauthorizedResponse({ description: 'Non authentifié' }),
        ApiForbiddenResponse({ description: 'Permissions insuffisantes' }),
    );
}