import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from '../users.controller';
import { UsersService } from '../users.service';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UserQueryDto } from '../dto/user-query.dto';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: UsersService;

  const mockUsersService = {
    getProfile: jest.fn(),
    updateProfile: jest.fn(),
    changePassword: jest.fn(),
    findUsers: jest.fn(),
    findUser: jest.fn(),
    deactivateUser: jest.fn(),
    activateUser: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    usersService = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getProfile', () => {
    it('should return the current user profile', async () => {
      const mockUser = { id: 'uuid' } as any;
      const result = { id: 'uuid', email: 'test@test.com' };
      mockUsersService.getProfile.mockResolvedValue(result);

      const res = await controller.getProfile(mockUser);
      expect(usersService.getProfile).toHaveBeenCalledWith('uuid');
      expect(res).toEqual({
        success: true,
        data: result,
      });
    });
  });

  describe('updateProfile', () => {
    it('should update and return the current user profile', async () => {
      const mockUser = { id: 'uuid' } as any;
      const dto: UpdateUserDto = { name: 'Updated' };
      const result = { id: 'uuid', name: 'Updated' };
      mockUsersService.updateProfile.mockResolvedValue(result);

      const res = await controller.updateProfile(mockUser, dto);
      expect(usersService.updateProfile).toHaveBeenCalledWith('uuid', dto);
      expect(res).toEqual({
        success: true,
        data: result,
      });
    });
  });

  describe('changePassword', () => {
    it('should change the user password', async () => {
      const mockUser = { id: 'uuid' } as any;
      const dto: ChangePasswordDto = {
        currentPassword: 'old',
        newPassword: 'new',
        confirmPassword: 'new',
      };
      mockUsersService.changePassword.mockResolvedValue(undefined);

      const res = await controller.changePassword(mockUser, dto);
      expect(usersService.changePassword).toHaveBeenCalledWith('uuid', dto);
      expect(res).toEqual({
        success: true,
        message: 'Password changed successfully',
      });
    });
  });

  describe('findUsers', () => {
    it('should return a paginated list of users', async () => {
      const query: UserQueryDto = { page: 1, limit: 10 };
      const result = { data: [], meta: { page: 1, limit: 10, total: 0 } };
      mockUsersService.findUsers.mockResolvedValue(result);

      const res = await controller.findUsers(query);
      expect(usersService.findUsers).toHaveBeenCalledWith(query);
      expect(res).toEqual({
        success: true,
        data: [],
        meta: result.meta,
      });
    });
  });

  describe('findUser', () => {
    it('should return a single user by id', async () => {
      const result = { id: 'user-id' };
      mockUsersService.findUser.mockResolvedValue(result);

      const res = await controller.findUser('user-id');
      expect(usersService.findUser).toHaveBeenCalledWith('user-id');
      expect(res).toEqual({
        success: true,
        data: result,
      });
    });
  });

  describe('deactivateUser', () => {
    it('should deactivate a user', async () => {
      const result = { id: 'user-id', isActive: false };
      mockUsersService.deactivateUser.mockResolvedValue(result);

      const res = await controller.deactivateUser('user-id');
      expect(usersService.deactivateUser).toHaveBeenCalledWith('user-id');
      expect(res).toEqual({
        success: true,
        data: result,
      });
    });
  });

  describe('activateUser', () => {
    it('should activate a user', async () => {
      const result = { id: 'user-id', isActive: true };
      mockUsersService.activateUser.mockResolvedValue(result);

      const res = await controller.activateUser('user-id');
      expect(usersService.activateUser).toHaveBeenCalledWith('user-id');
      expect(res).toEqual({
        success: true,
        data: result,
      });
    });
  });
});
