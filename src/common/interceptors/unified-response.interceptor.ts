// src/common/interceptors/unified-response.interceptor.ts
import {
    CallHandler,
    ExecutionContext,
    Injectable,
    NestInterceptor,
} from '@nestjs/common';
import { FastifyRequest } from 'fastify';
import { I18nService } from 'nestjs-i18n';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse } from '../responses/api-response';

@Injectable()
export class UnifiedResponseInterceptor implements NestInterceptor {
    constructor(private readonly i18nService: I18nService) { }

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const ctx = context.switchToHttp();
        const request = ctx.getRequest<FastifyRequest>();
        const now = Date.now();

        return next.handle().pipe(
            map((data) => {
                // Ne pas transformer les flux (comme les téléchargements de fichiers)
                if (data && typeof data === 'object' && data.pipe && typeof data.pipe === 'function') {
                    return data;
                }

                const elapsed = Date.now() - now;
                if (elapsed > 1000) {
                    console.warn(`Long request: ${request.method} ${request.url} - ${elapsed}ms`);
                }

                // Si c'est déjà une réponse ApiResponse, la retourner avec les champs supplémentaires
                if (data instanceof ApiResponse) {
                    data.path = request.url;
                    data.timestamp = new Date().toISOString();
                    return data;
                }

                // Si c'est une réponse déjà formatée, la convertir en ApiResponse
                if (data && typeof data === 'object' && 'statusCode' in data && 'message' in data) {
                    // Traduire le message si c'est une clé de traduction
                    let message = data.message;
                    if (typeof message === 'string' && message.includes('.')) {
                        try {
                            const lang = this.getLangFromRequest(request);
                            message = this.i18nService.translate(message, { lang });
                        } catch (error) {
                            // En cas d'erreur, garder le message original
                        }
                    }

                    return {
                        ...data,
                        message,
                        timestamp: new Date().toISOString(),
                        path: request.url,
                    };
                }

                // Formater une nouvelle réponse
                return ApiResponse.success(data, 'success', request.url);
            }),
        );
    }

    private getLangFromRequest(request: FastifyRequest): string {
        const acceptLang = request.headers['accept-language'];
        const customLang = request.headers['x-custom-lang'];

        if (Array.isArray(acceptLang)) return acceptLang[0] || 'fr';
        if (Array.isArray(customLang)) return customLang[0] || 'fr';

        return acceptLang || customLang || 'fr';
    }
}