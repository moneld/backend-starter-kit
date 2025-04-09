import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FastifyReply, FastifyRequest } from 'fastify';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class SecurityInterceptor implements NestInterceptor {
  constructor(private configService: ConfigService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<FastifyRequest>();
    const response = ctx.getResponse<FastifyReply>();

    // Ajout de headers de sécurité supplémentaires
    this.addSecurityHeaders(response);

    // Ajout de trace ID pour le suivi des requêtes
    this.addTraceId(request, response);

    return next.handle().pipe(
      map((data) => {
        // Pour les flux (comme les téléchargements de fichiers), retourner tel quel
        if (
          data &&
          typeof data === 'object' &&
          data.pipe &&
          typeof data.pipe === 'function'
        ) {
          return data;
        }

        // Ajouter des méta-données de sécurité aux réponses si nécessaire
        return data;
      }),
    );
  }

  private addSecurityHeaders(response: FastifyReply): void {
    // Seulement en production ou si explicitement activé
    if (
      this.configService.get('app.nodeEnv') === 'production' ||
      this.configService.get('app.enableStrictSecurity', false)
    ) {
      // Cache-Control - Éviter la mise en cache des données sensibles
      response.headers({
        'Cache-Control':
          'no-store, no-cache, must-revalidate, proxy-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
        'Surrogate-Control': 'no-store',
        // Empêcher le navigateur de faire du MIME-sniffing
        'X-Content-Type-Options': 'nosniff',
        // Protection contre les attaques clickjacking
        'X-Frame-Options': 'DENY',
        // Protection contre le XSS
        'X-XSS-Protection': '1; mode=block',
      });
    }
  }

  private addTraceId(request: FastifyRequest, response: FastifyReply): void {
    // Générer ou réutiliser un ID de trace pour le suivi des requêtes
    const traceId =
      request.headers['x-trace-id'] ||
      request.headers['x-request-id'] ||
      this.generateTraceId();

    // Ajouter l'ID de trace à la réponse
    response.header('X-Trace-ID', traceId);
  }

  private generateTraceId(): string {
    // Générer un ID unique pour le suivi des requêtes
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }
}
