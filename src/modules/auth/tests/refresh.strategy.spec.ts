import { Test, TestingModule } from '@nestjs/testing';
import { RefreshStrategy } from '../refresh.strategy';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';

describe('RefreshStrategy', () => {
  let strategy: RefreshStrategy;

  const mockConfigService = {
    get: jest.fn().mockReturnValue('refresh-secret'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RefreshStrategy, { provide: ConfigService, useValue: mockConfigService }],
    }).compile();

    strategy = module.get<RefreshStrategy>(RefreshStrategy);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  it('should throw if secret is missing', () => {
    const configWithNoSecret = { get: jest.fn().mockReturnValue(undefined) };
    expect(() => new RefreshStrategy(configWithNoSecret as any)).toThrow();
  });

  describe('validate', () => {
    it('should validate and return payload with refreshToken', () => {
      const payload = { sub: 'uuid', email: 'test@example.com', role: 'STAFF' };
      const req = { body: { refreshToken: 'valid-refresh-token' } } as Request;

      const result = strategy.validate(req, payload);
      expect(result).toEqual({ ...payload, refreshToken: 'valid-refresh-token' });
    });

    it('should throw UnauthorizedException if refreshToken is missing in body', () => {
      const payload = { sub: 'uuid', email: 'test@example.com', role: 'STAFF' };
      const req = { body: {} } as Request;

      expect(() => strategy.validate(req, payload)).toThrow(UnauthorizedException);
    });
  });
});
