import { Test, TestingModule } from '@nestjs/testing';
import { JwtStrategy } from '../jwt.strategy';
import { ConfigService } from '@nestjs/config';
import { AuthRepository } from '../auth.repository';
import { UnauthorizedException } from '@nestjs/common';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;

  const mockConfigService = {
    get: jest.fn().mockReturnValue('secret'),
  };

  const mockAuthRepository = {
    findUserById: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: AuthRepository, useValue: mockAuthRepository },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  it('should throw if secret is missing', () => {
    const configWithNoSecret = { get: jest.fn().mockReturnValue(undefined) };
    expect(() => new JwtStrategy(configWithNoSecret as any, mockAuthRepository as any)).toThrow();
  });

  describe('validate', () => {
    it('should validate and return user without password', async () => {
      const payload = { sub: 'uuid', email: 'test@example.com', role: 'STAFF' };
      const user = { id: 'uuid', isActive: true, password: 'hash', email: 'test@example.com' };
      mockAuthRepository.findUserById.mockResolvedValue(user);

      const result = await strategy.validate(payload);
      expect(result).toEqual({ id: 'uuid', isActive: true, email: 'test@example.com' });
    });

    it('should throw UnauthorizedException if user not found or inactive', async () => {
      const payload = { sub: 'uuid', email: 'test@example.com', role: 'STAFF' };
      mockAuthRepository.findUserById.mockResolvedValue(null);

      await expect(strategy.validate(payload)).rejects.toThrow(UnauthorizedException);
    });
  });
});
