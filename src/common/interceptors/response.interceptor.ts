import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FastifyRequest } from 'fastify';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  statusCode: number;
  message: string;
  data: T;
  timestamp: string;
  path: string;
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, Response<T>> {
  private readonly logger = new Logger(ResponseInterceptor.name);

  constructor(private configService: ConfigService) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T> | any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<FastifyRequest>();
    const now = Date.now();

    return next.handle().pipe(
      map((data: any) => {
        // Ne pas transformer les flux (comme les téléchargements de fichiers)
        if (
          data &&
          typeof data === 'object' &&
          data.pipe &&
          typeof data.pipe === 'function'
        ) {
          return data;
        }

        const elapsed = Date.now() - now;

        // Log des requêtes longues (> 1000ms)
        if (elapsed > 1000) {
          this.logger.warn(
            `Long request: ${request.method} ${request.url} - ${elapsed}ms`,
          );
        }

        // Détecter si la réponse est déjà formatée
        if (
          data &&
          typeof data === 'object' &&
          'statusCode' in data &&
          'message' in data &&
          'data' in data
        ) {
          return {
            ...data,
            timestamp: new Date().toISOString(),
            path: request.url,
          };
        }

        // Formater la réponse
        return {
          statusCode: context.switchToHttp().getResponse().statusCode || 200,
          message: 'success',
          data,
          timestamp: new Date().toISOString(),
          path: request.url,
        };
      }),
    );
  }
}
