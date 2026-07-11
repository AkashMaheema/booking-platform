import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from '../auth.service';
import { AuthRepository } from '../auth.repository';

// Mock bcrypt
jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let authRepository: AuthRepository;
  let jwtService: JwtService;
  let configService: ConfigService;

  const mockUser = {
    id: 'user-id-123',
    name: 'Test User',
    email: 'test@example.com',
    password: 'hashedpassword',
    role: 'STAFF',
    isActive: true,
  };

  const mockTokens = {
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: AuthRepository,
          useValue: {
            findUserByEmail: jest.fn(),
            createUser: jest.fn(),
            findUserById: jest.fn(),
            saveRefreshToken: jest.fn(),
            findRefreshToken: jest.fn(),
            deleteRefreshToken: jest.fn(),
            revokeAllUserRefreshTokens: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockImplementation((payload, options) => {
              if (options?.secret === 'secret') {
                return 'refresh-token';
              }
              return 'access-token';
            }),
            decode: jest.fn().mockReturnValue({ exp: 1234567890 }),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('secret'),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    authRepository = module.get<AuthRepository>(AuthRepository);
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    const registerDto = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'Password123!',
    };

    it('should throw ConflictException if user exists', async () => {
      jest.spyOn(authRepository, 'findUserByEmail').mockResolvedValue(mockUser as any);

      await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
    });

    it('should register user and return user without password', async () => {
      jest.spyOn(authRepository, 'findUserByEmail').mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedpassword');
      jest.spyOn(authRepository, 'createUser').mockResolvedValue(mockUser as any);

      const result = await service.register(registerDto);

      expect(result).not.toHaveProperty('password');
      expect(result.email).toBe(mockUser.email);
    });
  });

  describe('login', () => {
    const loginDto = { email: 'test@example.com', password: 'Password123!' };

    it('should throw UnauthorizedException if user not found', async () => {
      jest.spyOn(authRepository, 'findUserByEmail').mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password incorrect', async () => {
      jest.spyOn(authRepository, 'findUserByEmail').mockResolvedValue(mockUser as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if user inactive', async () => {
      jest.spyOn(authRepository, 'findUserByEmail').mockResolvedValue({ ...mockUser, isActive: false } as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should return tokens if login is successful', async () => {
      jest.spyOn(authRepository, 'findUserByEmail').mockResolvedValue(mockUser as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login(loginDto);

      expect(result).toEqual(mockTokens);
      expect(jwtService.sign).toHaveBeenCalled();
      expect(authRepository.saveRefreshToken).toHaveBeenCalled();
    });
  });

  describe('refreshTokens', () => {
    const userId = 'user-id-123';
    const rawRefreshToken = 'refresh-token';
    const existingToken = {
      id: 'token-id',
      userId,
      token: 'hashed-token',
      expiresAt: new Date(Date.now() + 10000), // future
      isRevoked: false,
      createdAt: new Date(),
    };

    it('should throw UnauthorizedException if token not found or revoked', async () => {
      jest.spyOn(authRepository, 'findRefreshToken').mockResolvedValue(null);
      await expect(service.refreshTokens(userId, rawRefreshToken)).rejects.toThrow(UnauthorizedException);

      jest.spyOn(authRepository, 'findRefreshToken').mockResolvedValue({ ...existingToken, isRevoked: true });
      await expect(service.refreshTokens(userId, rawRefreshToken)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if token expired', async () => {
      jest.spyOn(authRepository, 'findRefreshToken').mockResolvedValue({
        ...existingToken,
        expiresAt: new Date(Date.now() - 10000), // past
      });

      await expect(service.refreshTokens(userId, rawRefreshToken)).rejects.toThrow(UnauthorizedException);
      expect(authRepository.deleteRefreshToken).toHaveBeenCalled();
    });

    it('should refresh tokens successfully', async () => {
      jest.spyOn(authRepository, 'findRefreshToken').mockResolvedValue(existingToken);
      jest.spyOn(authRepository, 'findUserById').mockResolvedValue(mockUser as any);

      const result = await service.refreshTokens(userId, rawRefreshToken);

      expect(authRepository.deleteRefreshToken).toHaveBeenCalled();
      expect(authRepository.saveRefreshToken).toHaveBeenCalled();
      expect(result).toEqual(mockTokens);
    });
  });
});
