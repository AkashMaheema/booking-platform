import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse } from '../interfaces/api-response.interface';

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  intercept(
    _context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((data: T & { message?: string }) => {
        const message =
          data && typeof data === 'object' && 'message' in data
            ? (data as { message: string }).message
            : 'Request successful';

        const responseData =
          data && typeof data === 'object' && 'data' in data
            ? (data as { data: T }).data
            : data;

        return {
          success: true,
          message,
          data: responseData,
        };
      }),
    );
  }
}
