import { ExecutionContext, LoggerService } from '@nestjs/common';
import { LoggingInterceptor } from '../logging.interceptor';
import { of } from 'rxjs';

describe('LoggingInterceptor', () => {
  let interceptor: LoggingInterceptor;
  let logger: LoggerService;

  beforeEach(() => {
    logger = {
      log: jest.fn(),
    } as unknown as LoggerService;

    interceptor = new LoggingInterceptor(logger);
  });

  it('should log request details', (done) => {
    const mockRequest = { method: 'GET', url: '/test' };
    const mockResponse = { statusCode: 200 };

    const context = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(mockRequest),
        getResponse: jest.fn().mockReturnValue(mockResponse),
      }),
    } as unknown as ExecutionContext;

    const next = {
      handle: jest.fn().mockReturnValue(of('response')),
    };

    const observable = interceptor.intercept(context, next as any);

    observable.subscribe({
      next: (val) => {
        expect(val).toBe('response');
      },
      complete: () => {
        expect(logger.log).toHaveBeenCalled();
        expect(logger.log).toHaveBeenCalledWith(expect.stringContaining('GET /test 200'), 'HTTP');
        done();
      },
    });
  });
});
