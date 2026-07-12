import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../auth.controller';
import { AuthService } from '../auth.service';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { RefreshDto } from '../dto/refresh.dto';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
    refreshTokens: jest.fn(),
    logout: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('should call authService.register and return success', async () => {
      const dto: RegisterDto = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      };
      const result = { id: 'uuid', email: dto.email };
      mockAuthService.register.mockResolvedValue(result);

      const response = await controller.register(dto);
      expect(authService.register).toHaveBeenCalledWith(dto);
      expect(response).toEqual({
        success: true,
        message: 'User registered successfully.',
        data: result,
      });
    });
  });

  describe('login', () => {
    it('should call authService.login and return tokens', async () => {
      const dto: LoginDto = { email: 'test@example.com', password: 'Password123!' };
      const tokens = { accessToken: 'acc', refreshToken: 'ref' };
      mockAuthService.login.mockResolvedValue(tokens);

      const response = await controller.login(dto);
      expect(authService.login).toHaveBeenCalledWith(dto);
      expect(response).toEqual({
        success: true,
        message: 'Login successful.',
        data: tokens,
      });
    });
  });

  describe('refresh', () => {
    it('should call authService.refreshTokens and return new tokens', async () => {
      const dto: RefreshDto = { refreshToken: 'old-ref' };
      const user = { sub: 'uuid', email: 'a@a.com', role: 'USER' };
      const tokens = { accessToken: 'new-acc', refreshToken: 'new-ref' };
      mockAuthService.refreshTokens.mockResolvedValue(tokens);

      const response = await controller.refresh(dto, user);
      expect(authService.refreshTokens).toHaveBeenCalledWith(user.sub, dto.refreshToken);
      expect(response).toEqual({
        success: true,
        message: 'Token refreshed successfully.',
        data: tokens,
      });
    });
  });

  describe('logout', () => {
    it('should call authService.logout and return success', async () => {
      const mockUser = { id: 'user-uuid' } as any;
      mockAuthService.logout.mockResolvedValue(undefined);

      const response = await controller.logout(mockUser);
      expect(authService.logout).toHaveBeenCalledWith('user-uuid');
      expect(response).toEqual({
        success: true,
        message: 'Logged out successfully.',
      });
    });
  });
});
