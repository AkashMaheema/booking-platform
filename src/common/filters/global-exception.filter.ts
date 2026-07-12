import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { RequestWithId } from '../middleware/request-id.middleware';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<RequestWithId>();

    const isHttpException = exception instanceof HttpException;
    const status = isHttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    let message = 'An unexpected error occurred. Please try again later.';
    let errors: unknown[] = [];
    let errorCode: string | undefined;

    if (isHttpException) {
      const exceptionResponse = exception.getResponse();
      message = this.extractMessage(exceptionResponse);
      errors = this.extractErrors(exceptionResponse);
      // If it's our custom BaseBusinessException, it has an errorCode
      errorCode = (exception as Error & { errorCode?: string }).errorCode;
    } else {
      this.logger.error(
        `Unhandled exception on ${request.method} ${request.url}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    if (isHttpException) {
      this.logger.warn(`HTTP ${status} - ${request.method} ${request.url} - ${message}`);
    }

    response.status(status).json({
      success: false,
      statusCode: status,
      ...(errorCode ? { errorCode } : {}),
      message,
      errors,
      timestamp: new Date().toISOString(),
      path: request.url,
      requestId: request.id,
    });
  }

  private extractMessage(exceptionResponse: unknown): string {
    if (typeof exceptionResponse === 'string') {
      return exceptionResponse;
    }
    if (
      typeof exceptionResponse === 'object' &&
      exceptionResponse !== null &&
      'message' in exceptionResponse
    ) {
      const msg = exceptionResponse.message;
      return Array.isArray(msg) ? String(msg[0]) : String(msg);
    }
    return 'An error occurred';
  }

  private extractErrors(exceptionResponse: unknown): unknown[] {
    if (
      typeof exceptionResponse === 'object' &&
      exceptionResponse !== null &&
      'errors' in exceptionResponse
    ) {
      return (exceptionResponse as { errors: unknown[] }).errors ?? [];
    }
    return [];
  }
}
