import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { RequestWithId } from '../middleware/request-id.middleware';
import { Response } from 'express';
import { RequestContextService } from './request-context.service';

@Injectable()
export class LoggerInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggerInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<RequestWithId & { user?: any }>();
    const response = ctx.getResponse<Response>();

    const method = request.method;
    const url = request.url;
    const now = Date.now();
    const requestId = request.id;
    
    // Update userId in context if available (from AuthGuard)
    if (request.user?.id) {
      RequestContextService.set('userId', request.user.id);
    }
    const userId = request.user?.id;

    // Mask sensitive data in body
    const body = this.maskSensitiveData(request.body);

    // We log the incoming request in DEBUG mode to avoid spamming INFO logs
    this.logger.debug({
      message: `Incoming Request: ${method} ${url}`,
      method,
      url,
      requestId,
      userId,
      body,
      clientIp: request.ip,
      userAgent: request.headers['user-agent'],
    });

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - now;
          const statusCode = response.statusCode;

          const logData = {
            message: `Request Completed: ${method} ${url} ${statusCode} - ${duration}ms`,
            method,
            path: url,
            statusCode,
            duration,
            requestId,
            userId,
          };

          if (duration > 500) {
            this.logger.warn({
              ...logData,
              message: `Slow Request Detected: ${method} ${url} - ${duration}ms`,
            });
          } else {
            this.logger.log(logData);
          }
        },
        error: (error) => {
          const duration = Date.now() - now;
          this.logger.error({
            message: `Request Failed: ${method} ${url} - ${duration}ms`,
            method,
            path: url,
            duration,
            requestId,
            userId,
            error: error.message,
          });
        },
      }),
    );
  }

  private maskSensitiveData(body: any): any {
    if (!body || typeof body !== 'object') return body;

    const maskedBody = { ...body };
    const sensitiveKeys = ['password', 'token', 'accessToken', 'refreshToken', 'authorization', 'secret'];

    for (const key of Object.keys(maskedBody)) {
      if (sensitiveKeys.includes(key.toLowerCase())) {
        maskedBody[key] = '***MASKED***';
      } else if (typeof maskedBody[key] === 'object' && maskedBody[key] !== null) {
        maskedBody[key] = this.maskSensitiveData(maskedBody[key]);
      }
    }

    return maskedBody;
  }
}
