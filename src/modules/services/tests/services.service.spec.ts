import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { ServicesService } from '../services.service';
import { ServicesRepository } from '../services.repository';
import { AuditService } from '../../../common/logging/audit.service';

describe('ServicesService', () => {
  let service: ServicesService;
  let repository: ServicesRepository;

  const mockService = {
    id: 'service-1',
    title: 'Haircut',
    description: 'Professional haircut',
    duration: 30,
    price: 25.5,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServicesService,
        {
          provide: ServicesRepository,
          useValue: {
            create: jest.fn(),
            findById: jest.fn(),
            findByTitle: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            findAll: jest.fn(),
            checkBookingsExist: jest.fn(),
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

    service = module.get<ServicesService>(ServicesService);
    repository = module.get<ServicesRepository>(ServicesRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createService', () => {
    it('should throw ConflictException if title already exists', async () => {
      jest.spyOn(repository, 'findByTitle').mockResolvedValue(mockService as any);

      await expect(
        service.createService({
          title: 'Haircut',
          duration: 30,
          price: 25.5,
          isActive: true,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should create and return the new service', async () => {
      jest.spyOn(repository, 'findByTitle').mockResolvedValue(null);
      jest.spyOn(repository, 'create').mockResolvedValue(mockService as any);

      const result = await service.createService({
        title: 'Haircut',
        duration: 30,
        price: 25.5,
        isActive: true,
      });

      expect(result.id).toBe('service-1');
      expect(result.title).toBe('Haircut');
      expect(repository.create).toHaveBeenCalled();
    });
  });

  describe('getService', () => {
    it('should throw NotFoundException if service not found', async () => {
      jest.spyOn(repository, 'findById').mockResolvedValue(null);
      await expect(service.getService('invalid-id')).rejects.toThrow(NotFoundException);
    });

    it('should return service data', async () => {
      jest.spyOn(repository, 'findById').mockResolvedValue(mockService as any);
      const result = await service.getService('service-1');
      expect(result.id).toBe('service-1');
    });
  });

  describe('updateService', () => {
    it('should throw NotFoundException if service not found', async () => {
      jest.spyOn(repository, 'findById').mockResolvedValue(null);
      await expect(service.updateService('1', { title: 'New' })).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if new title already exists', async () => {
      jest.spyOn(repository, 'findById').mockResolvedValue(mockService as any);
      jest
        .spyOn(repository, 'findByTitle')
        .mockResolvedValue({ id: 'service-2', title: 'New Title' } as any);

      await expect(service.updateService('service-1', { title: 'New Title' })).rejects.toThrow(
        ConflictException,
      );
    });

    it('should successfully update the service', async () => {
      jest.spyOn(repository, 'findById').mockResolvedValue(mockService as any);
      jest.spyOn(repository, 'findByTitle').mockResolvedValue(null);
      jest
        .spyOn(repository, 'update')
        .mockResolvedValue({ ...mockService, title: 'Updated Haircut' } as any);

      const result = await service.updateService('service-1', { title: 'Updated Haircut' });
      expect(result.title).toBe('Updated Haircut');
    });
  });

  describe('deleteService', () => {
    it('should throw NotFoundException if service not found', async () => {
      jest.spyOn(repository, 'findById').mockResolvedValue(null);
      await expect(service.deleteService('1')).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if service has bookings', async () => {
      jest.spyOn(repository, 'findById').mockResolvedValue(mockService as any);
      jest.spyOn(repository, 'checkBookingsExist').mockResolvedValue(true);

      await expect(service.deleteService('service-1')).rejects.toThrow(ConflictException);
    });

    it('should delete service successfully if no bookings', async () => {
      jest.spyOn(repository, 'findById').mockResolvedValue(mockService as any);
      jest.spyOn(repository, 'checkBookingsExist').mockResolvedValue(false);
      jest.spyOn(repository, 'delete').mockResolvedValue(mockService as any);

      await service.deleteService('service-1');
      expect(repository.delete).toHaveBeenCalledWith('service-1');
    });
  });

  describe('getServices', () => {
    it('should return paginated list with meta', async () => {
      jest.spyOn(repository, 'findAll').mockResolvedValue({ data: [mockService as any], total: 1 });

      const result = await service.getServices({ page: 1, limit: 10 });
      expect(result.data.length).toBe(1);
      expect(result.meta.totalItems).toBe(1);
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(10);
      expect(result.meta.totalPages).toBe(1);
      expect(result.meta.hasNextPage).toBe(false);
      expect(result.meta.hasPreviousPage).toBe(false);
    });

    it('should return empty data with zero meta when no records', async () => {
      jest.spyOn(repository, 'findAll').mockResolvedValue({ data: [], total: 0 });

      const result = await service.getServices({ page: 1, limit: 10 });
      expect(result.data).toEqual([]);
      expect(result.meta.totalItems).toBe(0);
      expect(result.meta.totalPages).toBe(0);
      expect(result.meta.hasNextPage).toBe(false);
    });

    it('should return correct hasNextPage on multi-page results', async () => {
      jest
        .spyOn(repository, 'findAll')
        .mockResolvedValue({ data: [mockService as any], total: 45 });

      const result = await service.getServices({ page: 1, limit: 10 });
      expect(result.meta.totalPages).toBe(5);
      expect(result.meta.hasNextPage).toBe(true);
      expect(result.meta.hasPreviousPage).toBe(false);
    });

    it('should pass search and isActive filter through to repository', async () => {
      const findAllSpy = jest
        .spyOn(repository, 'findAll')
        .mockResolvedValue({ data: [], total: 0 });

      await service.getServices({ page: 1, limit: 10, search: 'hair', isActive: true });
      expect(findAllSpy).toHaveBeenCalledWith(
        expect.objectContaining({ search: 'hair', isActive: true }),
      );
    });

    it('should pass sortBy and order filter through to repository', async () => {
      const findAllSpy = jest
        .spyOn(repository, 'findAll')
        .mockResolvedValue({ data: [], total: 0 });

      await service.getServices({ page: 1, limit: 10, sortBy: 'price', order: 'asc' });
      expect(findAllSpy).toHaveBeenCalledWith(
        expect.objectContaining({ sortBy: 'price', order: 'asc' }),
      );
    });
  });
});
