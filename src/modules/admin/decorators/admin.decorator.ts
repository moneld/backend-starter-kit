// src/modules/admin/decorators/admin.decorator.ts
import { applyDecorators, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../guards/admin.guard';

/**
 * Décorateur pour protéger les routes d'administration
 * Combine l'authentification JWT et la vérification des permissions admin
 */
export function Admin() {
  return applyDecorators(
    UseGuards(JwtAuthGuard, AdminGuard),
    ApiBearerAuth(),
    ApiUnauthorizedResponse({ description: 'Non authentifié' }),
    ApiForbiddenResponse({ description: 'Accès administrateur requis' }),
  );
}
