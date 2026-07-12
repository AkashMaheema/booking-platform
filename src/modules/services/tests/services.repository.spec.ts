import { Test, TestingModule } from '@nestjs/testing';
import { ServicesRepository } from '../services.repository';
import { PrismaService } from '../../../database/prisma.service';

describe('ServicesRepository', () => {
  let repository: ServicesRepository;
  let prisma: PrismaService;

  const mockPrismaService: any = {
    service: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
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
        ServicesRepository,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    repository = module.get<ServicesRepository>(ServicesRepository);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('create', () => {
    it('should create a service', async () => {
      const data = { title: 'Test', description: 'Desc', price: 10, duration: 60 };
      await repository.create(data);
      expect(prisma.service.create).toHaveBeenCalledWith({ data });
    });
  });

  describe('findAll', () => {
    it('should return services and count', async () => {
      mockPrismaService.service.findMany.mockResolvedValue([]);
      mockPrismaService.service.count.mockResolvedValue(0);

      const res = await repository.findAll({ page: 1, limit: 10, search: '', order: 'asc' });
      expect(prisma.service.findMany).toHaveBeenCalled();
      expect(prisma.service.count).toHaveBeenCalled();
      expect(res).toEqual({ data: [], total: 0 });
    });
  });

  describe('findById', () => {
    it('should find service by id', async () => {
      mockPrismaService.service.findUnique.mockResolvedValue({ id: 'uuid' });
      await repository.findById('uuid');
      expect(prisma.service.findUnique).toHaveBeenCalledWith({ where: { id: 'uuid' } });
    });
  });

  describe('update', () => {
    it('should update service', async () => {
      const data = { price: 20 };
      await repository.update('uuid', data);
      expect(prisma.service.update).toHaveBeenCalledWith({ where: { id: 'uuid' }, data });
    });
  });

  describe('delete', () => {
    it('should delete service', async () => {
      await repository.delete('uuid');
      expect(prisma.service.delete).toHaveBeenCalledWith({ where: { id: 'uuid' } });
    });
  });
});
