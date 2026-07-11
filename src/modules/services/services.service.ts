import { Injectable, Logger, NotFoundException, ConflictException } from '@nestjs/common';
import { ServicesRepository } from './services.repository';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { ServiceQueryDto } from './dto/service-query.dto';
import { ServiceResponseDto } from './dto/service-response.dto';
import { Prisma } from '@prisma/client';
import { AuditService, AuditAction } from '../../common/logging/audit.service';

@Injectable()
export class ServicesService {
  private readonly logger = new Logger(ServicesService.name);

  constructor(
    private readonly servicesRepository: ServicesRepository,
    private readonly auditService: AuditService,
  ) {}

  async createService(dto: CreateServiceDto): Promise<ServiceResponseDto> {
    const existingService = await this.servicesRepository.findByTitle(dto.title);
    if (existingService) {
      throw new ConflictException(`Service with title '${dto.title}' already exists.`);
    }

    const data: Prisma.ServiceCreateInput = {
      title: dto.title,
      description: dto.description,
      duration: dto.duration,
      price: dto.price,
      isActive: dto.isActive,
    };

    const newService = await this.servicesRepository.create(data);
    this.logger.log(`Created service with id ${newService.id}`);

    this.auditService.log({
      action: AuditAction.SERVICE_CREATED,
      resource: 'Service',
      resourceId: newService.id,
      details: { title: newService.title },
    });

    return new ServiceResponseDto(newService);
  }

  async getServices(query: ServiceQueryDto): Promise<{ data: ServiceResponseDto[]; pagination: any }> {
    const { data, total } = await this.servicesRepository.findAll(query);
    const page = query.page || 1;
    const limit = query.limit || 10;
    const totalPages = Math.ceil(total / limit);

    return {
      data: data.map((service) => new ServiceResponseDto(service)),
      pagination: {
        page,
        limit,
        totalItems: total,
        totalPages,
        hasNext: page < totalPages,
        hasPrevious: page > 1,
      },
    };
  }

  async getService(id: string): Promise<ServiceResponseDto> {
    const service = await this.servicesRepository.findById(id);
    if (!service) {
      throw new NotFoundException('Service not found');
    }
    return new ServiceResponseDto(service);
  }

  async updateService(id: string, dto: UpdateServiceDto): Promise<ServiceResponseDto> {
    const service = await this.servicesRepository.findById(id);
    if (!service) {
      throw new NotFoundException('Service not found');
    }

    if (dto.title && dto.title !== service.title) {
      const existingService = await this.servicesRepository.findByTitle(dto.title);
      if (existingService) {
        throw new ConflictException(`Service with title '${dto.title}' already exists.`);
      }
    }

    const updateData: Prisma.ServiceUpdateInput = {
      ...dto,
    };

    const updatedService = await this.servicesRepository.update(id, updateData);
    this.logger.log(`Updated service with id ${updatedService.id}`);

    this.auditService.log({
      action: AuditAction.SERVICE_UPDATED,
      resource: 'Service',
      resourceId: updatedService.id,
      details: { title: updatedService.title },
    });

    return new ServiceResponseDto(updatedService);
  }

  async deleteService(id: string): Promise<void> {
    const service = await this.servicesRepository.findById(id);
    if (!service) {
      throw new NotFoundException('Service not found');
    }

    const hasBookings = await this.servicesRepository.checkBookingsExist(id);
    if (hasBookings) {
      throw new ConflictException('Cannot delete a service that has existing bookings.');
    }

    await this.servicesRepository.delete(id);
    this.logger.log(`Deleted service with id ${id}`);

    this.auditService.log({
      action: AuditAction.SERVICE_DELETED,
      resource: 'Service',
      resourceId: id,
    });
  }
}
