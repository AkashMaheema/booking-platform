import { Test, TestingModule } from '@nestjs/testing';
import { UsersRepository } from '../users.repository';
import { PrismaService } from '../../../database/prisma.service';

describe('UsersRepository', () => {
  let repository: UsersRepository;
  let prisma: PrismaService;

  const mockPrismaService: any = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn((args) => {
      if (typeof args === 'function') {
        return args(mockPrismaService);
      }
      return Promise.all(args);
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersRepository,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    repository = module.get<UsersRepository>(UsersRepository);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('findById', () => {
    it('should find user by id', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ id: 'uuid' });
      await repository.findById('uuid');
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'uuid' },
      });
    });
  });

  describe('update', () => {
    it('should update user', async () => {
      await repository.update('uuid', { name: 'Updated' });
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'uuid' },
        data: { name: 'Updated' },
      });
    });
  });

  describe('changePassword', () => {
    it('should update user password', async () => {
      await repository.changePassword('uuid', 'new-hash');
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'uuid' },
        data: { password: 'new-hash' },
      });
    });
  });

  describe('findAll', () => {
    it('should return users and count', async () => {
      mockPrismaService.user.findMany.mockResolvedValue([]);
      mockPrismaService.user.count.mockResolvedValue(0);

      const params = { page: 1, limit: 10 };
      const res = await repository.findAll(params);

      expect(prisma.user.findMany).toHaveBeenCalled();
      expect(prisma.user.count).toHaveBeenCalled();
      expect(res).toEqual({ data: [], total: 0 });
    });
  });

  describe('activate', () => {
    it('should activate user', async () => {
      await repository.activate('uuid');
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'uuid' },
        data: { isActive: true },
      });
    });
  });

  describe('deactivate', () => {
    it('should deactivate user', async () => {
      await repository.deactivate('uuid');
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'uuid' },
        data: { isActive: false },
      });
    });
  });
});
