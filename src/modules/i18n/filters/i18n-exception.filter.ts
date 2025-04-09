import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FastifyReply, FastifyRequest } from 'fastify';
import { I18nService } from 'nestjs-i18n';

@Catch()
export class I18nExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(I18nExceptionFilter.name);

  constructor(
    private configService: ConfigService,
    private i18nService: I18nService,
  ) {}

  catch(exception: any, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const reply = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest<FastifyRequest>();

    // Récupérer la langue depuis les headers et s'assurer que c'est une string
    const acceptLang = request.headers['accept-language'];
    const customLang = request.headers['x-custom-lang'];
    const defaultLang = this.configService.get('app.defaultLanguage', 'fr');

    // Normaliser les headers pour obtenir une seule langue
    const lang =
      this.normalizeLangHeader(acceptLang) ||
      this.normalizeLangHeader(customLang) ||
      defaultLang;

    // Déterminer le statut HTTP
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    // Obtenir le message d'erreur
    let message =
      exception instanceof HttpException
        ? exception.message
        : 'errors.internal_server_error';

    // Traduire le message d'erreur si possible
    if (typeof message === 'string') {
      try {
        // Si le message ressemble à une clé de traduction, on essaie de le traduire
        if (message.includes('.')) {
          message = this.i18nService.translate(message, { lang });
        } else {
          // Essayer de trouver une traduction générique basée sur le code HTTP
          const genericKey = this.getGenericErrorKey(status);
          if (genericKey) {
            message = this.i18nService.translate(genericKey, { lang });
          }
        }
      } catch (error) {
        // Ignorer les erreurs de traduction, garder le message original
      }
    }

    // Obtenir les détails de l'erreur pour les réponses HTTP standard
    let errorDetails: any = null;

    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      if (typeof response === 'object' && response !== null) {
        errorDetails = response;

        // Traduire les messages de validation si présents
        if (Array.isArray(errorDetails.message)) {
          errorDetails.message = errorDetails.message.map((msg: string) => {
            try {
              return this.i18nService.translate(msg, { lang });
            } catch (error) {
              return msg;
            }
          });
        }
      }
    }

    // Log de l'erreur
    const errorLog = {
      status,
      message,
      path: request.url,
      method: request.method,
      timestamp: new Date().toISOString(),
      errorDetails: errorDetails,
      stack: exception.stack,
    };

    if (status >= 500) {
      this.logger.error(`${request.method} ${request.url}`, errorLog);
    } else {
      this.logger.warn(`${request.method} ${request.url}`, errorLog);
    }

    // Ne jamais retourner les détails de stack en production
    const isProduction = this.configService.get('app.nodeEnv') === 'production';

    // Formatage de la réponse d'erreur
    const responseBody = {
      statusCode: status,
      message: message,
      error: errorDetails,
      timestamp: new Date().toISOString(),
      path: request.url,
      ...(isProduction ? {} : { stack: exception.stack }),
    };

    reply.status(status).send(responseBody);
  }

  private getGenericErrorKey(status: number): string | null {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return 'errors.bad_request';
      case HttpStatus.UNAUTHORIZED:
        return 'errors.unauthorized';
      case HttpStatus.FORBIDDEN:
        return 'errors.forbidden';
      case HttpStatus.NOT_FOUND:
        return 'errors.not_found';
      case HttpStatus.INTERNAL_SERVER_ERROR:
        return 'errors.internal_server_error';
      default:
        return null;
    }
  }

  /**
   * Normalise un header de langue qui peut être string ou string[]
   * Renvoie la première langue ou undefined
   */
  private normalizeLangHeader(
    header: string | string[] | undefined,
  ): string | undefined {
    if (!header) return undefined;
    if (Array.isArray(header)) return header[0];
    return header;
  }
}
