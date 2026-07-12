import { Test, TestingModule } from '@nestjs/testing';
import { AuthRepository } from '../auth.repository';
import { PrismaService } from '../../../database/prisma.service';
import { Prisma } from '@prisma/client';

describe('AuthRepository', () => {
  let repository: AuthRepository;
  let prisma: PrismaService;

  const mockPrismaService = {
    user: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },
    refreshToken: {
      create: jest.fn(),
      delete: jest.fn(),
      updateMany: jest.fn(),
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthRepository,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    repository = module.get<AuthRepository>(AuthRepository);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('createUser', () => {
    it('should create a user with lowercased email', async () => {
      const data: Prisma.UserCreateInput = {
        email: ' TEST@example.com ',
        password: 'hash',
        name: 'Test User',
      };
      mockPrismaService.user.create.mockResolvedValue({
        id: 'uuid',
        ...data,
        email: 'test@example.com',
      });

      await repository.createUser(data);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          ...data,
          email: 'test@example.com',
        },
      });
    });
  });

  describe('findUserByEmail', () => {
    it('should find user by lowercased email', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ id: 'uuid' });

      await repository.findUserByEmail(' TEST@example.com ');
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
    });
  });

  describe('findUserById', () => {
    it('should find user by id', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ id: 'uuid' });

      await repository.findUserById('uuid');
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'uuid' },
      });
    });
  });

  describe('saveRefreshToken', () => {
    it('should save refresh token', async () => {
      const date = new Date();
      await repository.saveRefreshToken('userId', 'hashedToken', date);
      expect(prisma.refreshToken.create).toHaveBeenCalledWith({
        data: {
          userId: 'userId',
          token: 'hashedToken',
          expiresAt: date,
        },
      });
    });
  });

  describe('deleteRefreshToken', () => {
    it('should delete refresh token by hash', async () => {
      await repository.deleteRefreshToken('hash');
      expect(prisma.refreshToken.delete).toHaveBeenCalledWith({
        where: { token: 'hash' },
      });
    });
  });

  describe('revokeAllUserRefreshTokens', () => {
    it('should revoke all user refresh tokens', async () => {
      await repository.revokeAllUserRefreshTokens('userId');
      expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { userId: 'userId', isRevoked: false },
        data: { isRevoked: true },
      });
    });
  });

  describe('findRefreshToken', () => {
    it('should find refresh token by hash', async () => {
      await repository.findRefreshToken('hash');
      expect(prisma.refreshToken.findUnique).toHaveBeenCalledWith({
        where: { token: 'hash' },
      });
    });
  });
});
