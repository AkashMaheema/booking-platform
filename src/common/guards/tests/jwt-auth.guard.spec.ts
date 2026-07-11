import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from '../jwt-auth.guard';
import { IS_PUBLIC_KEY } from '../../decorators/public.decorator';

// We have to mock the parent AuthGuard('jwt')
jest.mock('@nestjs/passport', () => {
  return {
    AuthGuard: jest.fn().mockImplementation(() => {
      class MockAuthGuard {
        canActivate() {
          return true;
        }
      }
      return MockAuthGuard;
    }),
  };
});

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let reflector: Reflector;

  const mockExecutionContext = {
    getHandler: jest.fn(),
    getClass: jest.fn(),
  } as unknown as ExecutionContext;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new JwtAuthGuard(reflector);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('canActivate', () => {
    it('should allow access if route is decorated with @Public()', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);

      const result = guard.canActivate(mockExecutionContext);

      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(IS_PUBLIC_KEY, [
        mockExecutionContext.getHandler(),
        mockExecutionContext.getClass(),
      ]);
      expect(result).toBe(true);
    });

    it('should delegate to super.canActivate if route is not public', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true); // Since we mocked super.canActivate to return true
    });
  });

  describe('handleRequest', () => {
    it('should throw UnauthorizedException if err is present', () => {
      const err = new Error('Some error');
      expect(() => guard.handleRequest(err, null, null)).toThrow(err);
    });

    it('should throw UnauthorizedException if user is absent', () => {
      expect(() => guard.handleRequest(null, null, null)).toThrow(UnauthorizedException);
    });

    it('should return user if no error and user is present', () => {
      const mockUser = { id: 1, email: 'test@example.com' };
      const result = guard.handleRequest(null, mockUser, null);
      expect(result).toEqual(mockUser);
    });
  });
});
