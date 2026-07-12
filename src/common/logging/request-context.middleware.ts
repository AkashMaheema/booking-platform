import { Injectable, NestMiddleware } from '@nestjs/common';
import { Response, NextFunction } from 'express';
import { RequestContextService } from './request-context.service';
import { RequestWithId } from '../middleware/request-id.middleware';

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  use(req: RequestWithId, res: Response, next: NextFunction): void {
    // req.id is guaranteed by RequestIdMiddleware which runs before this
    const context = {
      requestId: req.id,
      correlationId: (req.headers['x-correlation-id'] as string) ?? req.id,
      // userId might not be available here yet (before AuthGuard), but we'll set it later if needed,
      // or we can extract it from JWT if we decode manually, but usually it's set in the guard.
    };

    RequestContextService.run(context, () => {
      next();
    });
  }
}
