import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request } from 'express';

@Injectable()
export class PerformanceInterceptor implements NestInterceptor {
  private readonly logger = new Logger(PerformanceInterceptor.name);

  // Threshold in milliseconds for logging slow requests
  private readonly SLOW_REQUEST_THRESHOLD = 500;

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const { method, url } = request;
    const now = Date.now();

    return next.handle().pipe(
      tap(() => {
        const executionTime = Date.now() - now;

        // Log only if the execution time exceeds the threshold
        if (executionTime > this.SLOW_REQUEST_THRESHOLD) {
          this.logger.warn(`Slow Request Detected: [${method}] ${url} - ${executionTime}ms`);
        }
      }),
    );
  }
}
