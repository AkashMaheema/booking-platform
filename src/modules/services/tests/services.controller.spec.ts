import { Test, TestingModule } from '@nestjs/testing';
import { ServicesController } from '../services.controller';
import { ServicesService } from '../services.service';
import { CreateServiceDto } from '../dto/create-service.dto';
import { UpdateServiceDto } from '../dto/update-service.dto';
import { ServiceQueryDto } from '../dto/service-query.dto';

describe('ServicesController', () => {
  let controller: ServicesController;
  let servicesService: ServicesService;

  const mockServicesService = {
    createService: jest.fn(),
    getServices: jest.fn(),
    getService: jest.fn(),
    updateService: jest.fn(),
    deleteService: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ServicesController],
      providers: [
        {
          provide: ServicesService,
          useValue: mockServicesService,
        },
      ],
    }).compile();

    controller = module.get<ServicesController>(ServicesController);
    servicesService = module.get<ServicesService>(ServicesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createService', () => {
    it('should create a new service', async () => {
      const dto: CreateServiceDto = {
        title: 'Test Service',
        description: 'Desc',
        price: 100,
        duration: 60,
      };
      const result = { id: 'uuid', ...dto };
      mockServicesService.createService.mockResolvedValue(result);

      const res = await controller.createService(dto);
      expect(servicesService.createService).toHaveBeenCalledWith(dto);
      expect(res).toEqual({
        success: true,
        message: 'Service created successfully.',
        data: result,
      });
    });
  });

  describe('getServices', () => {
    it('should return a list of services', async () => {
      const query: ServiceQueryDto = { page: 1, limit: 10 };
      const result = { data: [], meta: { page: 1, limit: 10, total: 0 } };
      mockServicesService.getServices.mockResolvedValue(result);

      const res = await controller.getServices(query);
      expect(servicesService.getServices).toHaveBeenCalledWith(query);
      expect(res).toEqual({
        success: true,
        data: [],
        meta: result.meta,
      });
    });
  });

  describe('getService', () => {
    it('should return a single service', async () => {
      const result = { id: 'uuid', title: 'Test' };
      mockServicesService.getService.mockResolvedValue(result);

      const res = await controller.getService('uuid');
      expect(servicesService.getService).toHaveBeenCalledWith('uuid');
      expect(res).toEqual({
        success: true,
        data: result,
      });
    });
  });

  describe('updateService', () => {
    it('should update a service', async () => {
      const dto: UpdateServiceDto = { price: 150 };
      const result = { id: 'uuid', price: 150 };
      mockServicesService.updateService.mockResolvedValue(result);

      const res = await controller.updateService('uuid', dto);
      expect(servicesService.updateService).toHaveBeenCalledWith('uuid', dto);
      expect(res).toEqual({
        success: true,
        message: 'Service updated successfully.',
        data: result,
      });
    });
  });

  describe('deleteService', () => {
    it('should delete a service', async () => {
      mockServicesService.deleteService.mockResolvedValue(undefined);

      const res = await controller.deleteService('uuid');
      expect(servicesService.deleteService).toHaveBeenCalledWith('uuid');
      expect(res).toEqual({
        success: true,
        message: 'Service deleted successfully.',
      });
    });
  });
});
