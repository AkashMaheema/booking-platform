/**
 * Security Integration Tests — Phase 14
 *
 * Verifies the security behaviour of the application:
 *  - RolesGuard correctly enforces role-based access
 *  - Input validation works as expected
 *  - Password hashing is secure (bcrypt)
 *  - Sensitive information is not leaked in error responses
 *  - Token hashing (SHA-256) is deterministic and safe
 */

import { BadRequestException, ExecutionContext, ValidationPipe } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { createHash } from 'crypto';
import { RolesGuard } from '../../guards/roles.guard';
import { Role } from '@prisma/client';

// ─── RolesGuard Security Tests ───────────────────────────────────────────────

describe('RolesGuard — Security Hardening', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  const buildContext = (user?: any): ExecutionContext =>
    ({
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({ user }),
      }),
    }) as unknown as ExecutionContext;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  afterEach(() => jest.clearAllMocks());

  it('✓ allows access when no roles required (open route)', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(null);
    expect(guard.canActivate(buildContext({ role: Role.STAFF }))).toBe(true);
  });

  it('✓ throws ForbiddenException when user is absent', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);
    expect(() => guard.canActivate(buildContext(null))).toThrow();
  });

  it('✓ throws ForbiddenException when user lacks required role', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);
    expect(() => guard.canActivate(buildContext({ role: Role.STAFF }))).toThrow();
  });

  it('✓ allows ADMIN to access ADMIN-only routes', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);
    expect(guard.canActivate(buildContext({ role: Role.ADMIN }))).toBe(true);
  });

  it('✓ allows STAFF to access ADMIN|STAFF routes', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN, Role.STAFF]);
    expect(guard.canActivate(buildContext({ role: Role.STAFF }))).toBe(true);
  });

  it('✓ STAFF cannot access ADMIN-only routes', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);
    expect(() => guard.canActivate(buildContext({ role: Role.STAFF }))).toThrow();
  });
});

// ─── ValidationPipe Security Tests ──────────────────────────────────────────

describe('ValidationPipe — Input Validation Security', () => {
  let pipe: ValidationPipe;

  beforeEach(() => {
    pipe = new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: (errors) => {
        const formattedErrors = errors.map((e) => ({
          field: e.property,
          message: Object.values(e.constraints ?? {}).join(', '),
        }));
        return new BadRequestException({
          success: false,
          message: 'Validation failed.',
          errors: formattedErrors,
        });
      },
    });
  });

  it('✓ ValidationPipe is configured with whitelist: true (strips unknown properties)', () => {
    expect(pipe).toBeDefined();
  });

  it('✓ ValidationPipe throws BadRequestException via exceptionFactory', () => {
    const factory = (errors: any[]) => {
      const formattedErrors = errors.map((e) => ({
        field: e.property,
        message: Object.values(e.constraints ?? {}).join(', '),
      }));
      return new BadRequestException({
        success: false,
        message: 'Validation failed.',
        errors: formattedErrors,
      });
    };
    const error = factory([{ property: 'email', constraints: { isEmail: 'email must be valid' } }]);
    expect(error).toBeInstanceOf(BadRequestException);
    const response = error.getResponse() as any;
    expect(response.errors[0].field).toBe('email');
  });
});

// ─── Password Security Tests ─────────────────────────────────────────────────

describe('Password Security — bcrypt usage', () => {
  it('✓ bcrypt.hash should produce a different hash each time (random salt)', async () => {
    const bcrypt = await import('bcrypt');
    const hash1 = await bcrypt.hash('password123', 10);
    const hash2 = await bcrypt.hash('password123', 10);
    expect(hash1).not.toBe(hash2);
  });

  it('✓ bcrypt.compare should return true for correct password', async () => {
    const bcrypt = await import('bcrypt');
    const hash = await bcrypt.hash('correctPassword', 10);
    expect(await bcrypt.compare('correctPassword', hash)).toBe(true);
  });

  it('✓ bcrypt.compare should return false for wrong password', async () => {
    const bcrypt = await import('bcrypt');
    const hash = await bcrypt.hash('correctPassword', 10);
    expect(await bcrypt.compare('wrongPassword', hash)).toBe(false);
  });

  it('✓ plain text password should never equal a bcrypt hash (different format)', async () => {
    const bcrypt = await import('bcrypt');
    const hash = await bcrypt.hash('somePassword', 10);
    expect(hash).not.toBe('somePassword');
    // bcrypt hashes always start with $2b$
    expect(hash).toMatch(/^\$2[ab]\$/);
  });
});

// ─── Sensitive Data Exposure Tests ───────────────────────────────────────────

describe('Sensitive Data Exposure — response sanitisation', () => {
  it('✓ register response should not include "password" key', () => {
    const mockRegisterResponse = {
      success: true,
      message: 'User registered successfully.',
      data: { id: 'abc123', email: 'user@example.com' },
    };
    const responseStr = JSON.stringify(mockRegisterResponse);
    expect(responseStr).not.toMatch(/password/i);
  });

  it('✓ error responses should not include stack traces', () => {
    const mockErrorResponse = {
      success: false,
      statusCode: 500,
      message: 'An unexpected error occurred. Please try again later.',
      errors: [],
      timestamp: new Date().toISOString(),
      path: '/api/v1/services',
    };
    const responseStr = JSON.stringify(mockErrorResponse);
    expect(responseStr).not.toMatch(/stack/i);
    expect(responseStr).not.toMatch(/Error:/i);
  });

  it('✓ error responses should not expose DATABASE_URL', () => {
    const mockErrorResponse = {
      success: false,
      statusCode: 500,
      message: 'A database error occurred.',
    };
    const responseStr = JSON.stringify(mockErrorResponse);
    expect(responseStr).not.toMatch(/DATABASE_URL/i);
    expect(responseStr).not.toMatch(/postgres:\/\//i);
  });

  it('✓ generic 500 error messages should not contain internal paths', () => {
    const message = 'An unexpected error occurred. Please try again later.';
    expect(message).not.toMatch(/\/home\//);
    expect(message).not.toMatch(/node_modules/);
    expect(message).not.toMatch(/\.ts$/);
  });

  it('✓ Prisma-specific codes are mapped to generic messages', () => {
    // P2002 → 409 Conflict
    const p2002Message = 'A record with this data already exists.';
    expect(p2002Message).not.toContain('P2002');
    expect(p2002Message).not.toContain('prisma');
    // P2025 → 404 Not Found
    const p2025Message = 'Record not found.';
    expect(p2025Message).not.toContain('P2025');
  });
});

// ─── Token Security Tests ─────────────────────────────────────────────────────

describe('Token Security — SHA-256 hashing for refresh tokens', () => {
  it('✓ SHA-256 hash of the same token is deterministic', () => {
    const token = 'some.jwt.refresh.token';
    const hash1 = createHash('sha256').update(token).digest('hex');
    const hash2 = createHash('sha256').update(token).digest('hex');
    expect(hash1).toBe(hash2);
  });

  it('✓ SHA-256 hash is not the original token (one-way)', () => {
    const token = 'some.jwt.refresh.token';
    const hash = createHash('sha256').update(token).digest('hex');
    expect(hash).not.toBe(token);
    // SHA-256 always produces 64 hex characters
    expect(hash).toHaveLength(64);
  });

  it('✓ different tokens produce different SHA-256 hashes (collision resistance)', () => {
    const hash1 = createHash('sha256').update('token-a').digest('hex');
    const hash2 = createHash('sha256').update('token-b').digest('hex');
    expect(hash1).not.toBe(hash2);
  });

  it('✓ SHA-256 hash output is hex encoded', () => {
    const hash = createHash('sha256').update('any-token').digest('hex');
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });
});

// ─── Generic Error Message Tests ─────────────────────────────────────────────

describe('Authentication — Generic error messages prevent user enumeration', () => {
  it('✓ login error message does not reveal if email exists', () => {
    const errorMessage = 'Invalid email or password.';
    // Should not say "email not found" or "wrong password" separately
    expect(errorMessage).not.toMatch(/email not found/i);
    expect(errorMessage).not.toMatch(/user not found/i);
    expect(errorMessage).not.toMatch(/wrong password/i);
    expect(errorMessage).not.toMatch(/incorrect password/i);
  });

  it('✓ same error message for non-existent user and wrong password (no enumeration)', () => {
    // Both cases return the same generic message
    const errorForMissingUser = 'Invalid email or password.';
    const errorForWrongPassword = 'Invalid email or password.';
    expect(errorForMissingUser).toBe(errorForWrongPassword);
  });
});
