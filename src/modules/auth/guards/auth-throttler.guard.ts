import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { FastifyRequest } from 'fastify';

@Injectable()
export class AuthThrottlerGuard extends ThrottlerGuard {
    // Surcharge pour utiliser la configuration spécifique à l'authentification
    protected async getTracker(req: FastifyRequest): Promise<string> {
        // Utiliser l'IP et éventuellement d'autres informations pour le tracking
        const ip = req.ip || (req.headers['x-forwarded-for'] as string) || 'unknown';

        // Accéder au corps de façon sécurisée
        // Il faut déclarer le type any pour avoir accès aux propriétés du body
        const reqWithBody = req as any;
        const username = reqWithBody.body?.email || 'anonymous';

        // Génère un identifiant unique pour le rate limiting
        return `auth-${ip}-${username}`;
    }

    // Définir manuellement le nom du throttler
    protected getName(): string {
        return 'auth';
    }
}