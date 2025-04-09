import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { FastifyRequest } from 'fastify';
import { I18nService } from 'nestjs-i18n';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class I18nResponseInterceptor implements NestInterceptor {
  private readonly logger = new Logger(I18nResponseInterceptor.name);

  constructor(private readonly i18n: I18nService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<FastifyRequest>();

    return next.handle().pipe(
      map((data) => {
        // Ne pas transformer les flux (comme les téléchargements de fichiers)
        if (
          data &&
          typeof data === 'object' &&
          data.pipe &&
          typeof data.pipe === 'function'
        ) {
          return data;
        }

        // Détecter si la réponse est déjà formatée
        if (
          data &&
          typeof data === 'object' &&
          'statusCode' in data &&
          'message' in data
        ) {
          // Traduire le message si c'est une clé de traduction
          if (typeof data.message === 'string' && data.message.includes('.')) {
            try {
              // Normaliser le header de langue
              const acceptLang = request.headers['accept-language'];
              const lang = Array.isArray(acceptLang)
                ? acceptLang[0]
                : acceptLang || 'fr';

              data.message = this.i18n.translate(data.message, {
                lang,
              });
            } catch (error) {
              // Ignorer les erreurs de traduction, garder le message original
            }
          }
          return data;
        }

        // Retourner les données sans transformation
        return data;
      }),
    );
  }
}
