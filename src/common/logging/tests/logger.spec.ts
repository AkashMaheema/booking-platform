import { AuditService, AuditAction } from '../audit.service';
import { RequestContextService } from '../request-context.service';
import { LoggerInterceptor } from '../logger.interceptor';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of, throwError } from 'rxjs';

describe('Logging & Audit Module', () => {
  describe('RequestContextService', () => {
    it('should store and retrieve data from AsyncLocalStorage', (done) => {
      RequestContextService.run({ requestId: 'test-123' }, () => {
        expect(RequestContextService.get('requestId')).toBe('test-123');
        RequestContextService.set('userId', 'user-456');
        expect(RequestContextService.get('userId')).toBe('user-456');
        done();
      });
    });

    it('should return undefined if called outside context', () => {
      expect(RequestContextService.get('requestId')).toBeUndefined();
    });
  });

  describe('AuditService', () => {
    let auditService: AuditService;

    beforeEach(() => {
      auditService = new AuditService();
      // Spy on internal logger
      jest.spyOn((auditService as any).logger, 'log').mockImplementation();
    });

    it('should log audit event with context', (done) => {
      RequestContextService.run({ requestId: 'req-1', userId: 'user-1' }, () => {
        auditService.log({
          action: AuditAction.USER_LOGGED_IN,
          resource: 'User',
          resourceId: 'user-1',
        });

        expect((auditService as any).logger.log).toHaveBeenCalledWith(
          expect.objectContaining({
            isAudit: true,
            action: AuditAction.USER_LOGGED_IN,
            resource: 'User',
            resourceId: 'user-1',
            requestId: 'req-1',
            userId: 'user-1',
          }),
        );
        done();
      });
    });
  });

  describe('LoggerInterceptor', () => {
    let interceptor: LoggerInterceptor;
    let mockExecutionContext: ExecutionContext;
    let mockCallHandler: CallHandler;

    beforeEach(() => {
      interceptor = new LoggerInterceptor();
      jest.spyOn((interceptor as any).logger, 'log').mockImplementation();
      jest.spyOn((interceptor as any).logger, 'warn').mockImplementation();
      jest.spyOn((interceptor as any).logger, 'error').mockImplementation();
      jest.spyOn((interceptor as any).logger, 'debug').mockImplementation();

      mockExecutionContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            method: 'POST',
            url: '/test',
            id: 'req-test',
            body: { password: 'secretpassword', normalField: 'value' },
            ip: '127.0.0.1',
            headers: { 'user-agent': 'test-agent' },
            user: { id: 'u-1' }
          }),
          getResponse: jest.fn().mockReturnValue({
            statusCode: 201,
          }),
        }),
      } as unknown as ExecutionContext;

      mockCallHandler = {
        handle: jest.fn().mockReturnValue(of('test data')),
      };
    });

    it('should log incoming request, mask body, and log completion', (done) => {
      RequestContextService.run({ requestId: 'req-test' }, () => {
        interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe(() => {
          expect((interceptor as any).logger.debug).toHaveBeenCalledWith(
            expect.objectContaining({
              requestId: 'req-test',
              body: { password: '***MASKED***', normalField: 'value' },
            }),
          );
          
          expect((interceptor as any).logger.log).toHaveBeenCalledWith(
            expect.objectContaining({
              statusCode: 201,
              requestId: 'req-test',
              userId: 'u-1',
            }),
          );
          done();
        });
      });
    });

    it('should log failures as errors', (done) => {
      mockCallHandler = {
        handle: jest.fn().mockReturnValue(throwError(() => new Error('Test Error'))),
      };

      RequestContextService.run({ requestId: 'req-test' }, () => {
        interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
          error: (err) => {
            expect((interceptor as any).logger.error).toHaveBeenCalledWith(
              expect.objectContaining({
                error: 'Test Error',
                requestId: 'req-test',
              }),
            );
            done();
          },
        });
      });
    });
  });
});
