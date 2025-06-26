import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { FastifyReply } from 'fastify';
import { DomainException } from '@domain/exceptions/domain.exception';

interface ErrorResponse {
  statusCode: number;
  message: string;
  error?: string;
  code?: string;
  timestamp: string;
  path?: string;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let code: string | undefined;
    let error: string | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null
      ) {
        message = (exceptionResponse as any).message || message;
        error = (exceptionResponse as any).error;
      }
    } else if (exception instanceof DomainException) {
      status = this.mapDomainExceptionToHttpStatus(exception);
      message = exception.message;
      code = exception.code;
      error = exception.name;
    } else if (exception instanceof Error) {
      message = 'An unexpected error occurred';
      this.logger.error('Unexpected error:', exception.stack);
    }

    const errorResponse: ErrorResponse = {
      statusCode: status,
      message,
      error,
      code,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    // Log security-related errors
    if (status === HttpStatus.UNAUTHORIZED || status === HttpStatus.FORBIDDEN) {
      this.logger.warn(`Security exception: ${message}`, {
        path: request.url,
        method: request.method,
        ip: request.ip,
        userAgent: request.headers['user-agent'],
      });
    }

    response.status(status).send(errorResponse);
  }

  private mapDomainExceptionToHttpStatus(exception: DomainException): number {
    const mapping: Record<string, number> = {
      UserNotFoundException: HttpStatus.NOT_FOUND,
      UserAlreadyExistsException: HttpStatus.CONFLICT,
      InvalidCredentialsException: HttpStatus.UNAUTHORIZED,
      InvalidTokenException: HttpStatus.UNAUTHORIZED,
      InvalidPasswordException: HttpStatus.BAD_REQUEST,
      EmailNotVerifiedException: HttpStatus.FORBIDDEN,
      InvalidVerificationTokenException: HttpStatus.BAD_REQUEST,
    };

    return mapping[exception.constructor.name] || HttpStatus.BAD_REQUEST;
  }
}
