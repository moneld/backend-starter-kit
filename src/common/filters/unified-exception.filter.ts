
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
export class UnifiedExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(UnifiedExceptionFilter.name);

    constructor(
        private configService: ConfigService,
        private i18nService: I18nService,
    ) { }

    catch(exception: any, host: ArgumentsHost): void {
        const ctx = host.switchToHttp();
        const reply = ctx.getResponse<FastifyReply>();
        const request = ctx.getRequest<FastifyRequest>();

        // Récupérer la langue
        const acceptLang = request.headers['accept-language'];
        const customLang = request.headers['x-custom-lang'];
        const defaultLang = this.configService.get('app.defaultLanguage', 'fr');
        const lang = this.normalizeLangHeader(acceptLang) ||
            this.normalizeLangHeader(customLang) ||
            defaultLang;

        // Déterminer le statut HTTP
        const status = exception instanceof HttpException
            ? exception.getStatus()
            : HttpStatus.INTERNAL_SERVER_ERROR;

        // Obtenir et traduire le message d'erreur
        let message = exception instanceof HttpException
            ? exception.message
            : 'errors.internal_server_error';

        // Traduire le message si possible
        if (typeof message === 'string') {
            try {
                if (message.includes('.')) {
                    message = this.i18nService.translate(message, { lang });
                } else {
                    const genericKey = this.getGenericErrorKey(status);
                    if (genericKey) {
                        message = this.i18nService.translate(genericKey, { lang });
                    }
                }
            } catch (error) {
                // Garder le message original en cas d'erreur
            }
        }

        // Traiter les détails d'erreur
        let errorDetails: any = null;
        if (exception instanceof HttpException) {
            const response = exception.getResponse();
            if (typeof response === 'object' && response !== null) {
                if ('message' in response) {
                    const responseMessage = response['message'];
                    message = Array.isArray(responseMessage)
                        ? responseMessage.join(', ')
                        : String(responseMessage);
                }
                if ('error' in response) {
                    errorDetails = response['error'];
                }
            }
        }

        // Log de l'erreur
        this.logError(request, status, message, errorDetails, exception);

        // Formatage de la réponse d'erreur
        const isProduction = this.configService.get('app.nodeEnv') === 'production';
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

    private normalizeLangHeader(header: string | string[] | undefined): string | undefined {
        if (!header) return undefined;
        if (Array.isArray(header)) return header[0];
        return header;
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

    private logError(request: FastifyRequest, status: number, message: string,
        errorDetails: any, exception: any): void {
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
    }
}