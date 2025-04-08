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

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  constructor(private configService: ConfigService) {}

  catch(exception: any, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const reply = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest<FastifyRequest>();

    // Déterminer le statut HTTP
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    // Obtenir le message d'erreur
    let message =
      exception instanceof HttpException
        ? exception.message
        : 'Internal server error';

    // Obtenir les détails de l'erreur pour les réponses HTTP standard
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
}
