import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users.service';
import { UsersRepository } from '../users.repository';
import { Role } from '@prisma/client';
import { AuditService } from '../../../common/logging/audit.service';

jest.mock('bcrypt');

describe('UsersService', () => {
  let service: UsersService;
  let repository: UsersRepository;

  const mockUser = {
    id: 'user-id-123',
    name: 'Test User',
    email: 'test@example.com',
    password: 'hashedpassword',
    role: Role.STAFF,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: UsersRepository,
          useValue: {
            findById: jest.fn(),
            update: jest.fn(),
            changePassword: jest.fn(),
            activate: jest.fn(),
            deactivate: jest.fn(),
            deleteRefreshTokens: jest.fn(),
            findAll: jest.fn(),
          },
        },
        {
          provide: AuditService,
          useValue: {
            log: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get<UsersRepository>(UsersRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getProfile', () => {
    it('should throw NotFoundException if user not found', async () => {
      jest.spyOn(repository, 'findById').mockResolvedValue(null);
      await expect(service.getProfile('123')).rejects.toThrow(NotFoundException);
    });

    it('should return UserResponseDto on success', async () => {
      jest.spyOn(repository, 'findById').mockResolvedValue(mockUser);
      const result = await service.getProfile('123');
      expect(result).not.toHaveProperty('password');
      expect(result.id).toBe(mockUser.id);
    });
  });

  describe('updateProfile', () => {
    it('should throw NotFoundException if user not found', async () => {
      jest.spyOn(repository, 'findById').mockResolvedValue(null);
      await expect(service.updateProfile('123', { name: 'New Name' })).rejects.toThrow(NotFoundException);
    });

    it('should update user and return safe response', async () => {
      jest.spyOn(repository, 'findById').mockResolvedValue(mockUser);
      jest.spyOn(repository, 'update').mockResolvedValue({ ...mockUser, name: 'New Name' });
      
      const result = await service.updateProfile('123', { name: 'New Name' });
      
      expect(result.name).toBe('New Name');
      expect(repository.update).toHaveBeenCalledWith('123', { name: 'New Name' });
    });
  });

  describe('changePassword', () => {
    const dto = {
      currentPassword: 'old-password',
      newPassword: 'new-password',
      confirmPassword: 'new-password',
    };

    it('should throw BadRequestException if passwords do not match', async () => {
      await expect(service.changePassword('123', { ...dto, confirmPassword: 'different' }))
        .rejects.toThrow(BadRequestException);
    });

    it('should throw UnauthorizedException if current password is wrong', async () => {
      jest.spyOn(repository, 'findById').mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.changePassword('123', dto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw BadRequestException if new password equals old password', async () => {
      jest.spyOn(repository, 'findById').mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockImplementation(async (a, b) => true); // Both current validation and reused check returns true

      await expect(service.changePassword('123', dto)).rejects.toThrow(BadRequestException);
    });

    it('should hash new password, save it, and revoke tokens', async () => {
      jest.spyOn(repository, 'findById').mockResolvedValue(mockUser);
      // first call (validate current) returns true, second call (reused check) returns false
      (bcrypt.compare as jest.Mock).mockImplementation(async (pwd, hash) => pwd === dto.currentPassword);
      (bcrypt.hash as jest.Mock).mockResolvedValue('new-hashed-password');

      await service.changePassword('123', dto);

      expect(repository.changePassword).toHaveBeenCalledWith('123', 'new-hashed-password');
      expect(repository.deleteRefreshTokens).toHaveBeenCalledWith('123');
    });
  });

  describe('Admin actions', () => {
    it('deactivateUser should set isActive false', async () => {
      jest.spyOn(repository, 'findById').mockResolvedValue(mockUser);
      jest.spyOn(repository, 'deactivate').mockResolvedValue({ ...mockUser, isActive: false });

      const result = await service.deactivateUser('123');
      expect(result.isActive).toBe(false);
      expect(repository.deactivate).toHaveBeenCalledWith('123');
    });

    it('findUsers should return paginated list', async () => {
      jest.spyOn(repository, 'findAll').mockResolvedValue({ data: [mockUser], total: 1 });

      const result = await service.findUsers({ page: 1, limit: 10 });
      expect(result.data.length).toBe(1);
      expect(result.meta.total).toBe(1);
      expect(result.data[0]).not.toHaveProperty('password');
    });
  });
});
