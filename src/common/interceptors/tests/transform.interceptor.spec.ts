import { TransformInterceptor } from '../transform.interceptor';
import { of } from 'rxjs';
import { ExecutionContext } from '@nestjs/common';

describe('TransformInterceptor', () => {
  let interceptor: TransformInterceptor<any>;

  beforeEach(() => {
    interceptor = new TransformInterceptor();
  });

  it('should transform response without message/data correctly', (done) => {
    const next = {
      handle: () => of({ test: 'value' }),
    };

    const observable = interceptor.intercept({} as ExecutionContext, next as any);

    observable.subscribe({
      next: (val) => {
        expect(val).toEqual({
          success: true,
          message: 'Request successful',
          data: { test: 'value' },
        });
      },
      complete: () => done(),
    });
  });

  it('should transform response with message and data correctly', (done) => {
    const next = {
      handle: () => of({ message: 'Custom message', data: { test: 'value' } }),
    };

    const observable = interceptor.intercept({} as ExecutionContext, next as any);

    observable.subscribe({
      next: (val) => {
        expect(val).toEqual({
          success: true,
          message: 'Custom message',
          data: { test: 'value' },
        });
      },
      complete: () => done(),
    });
  });
});
