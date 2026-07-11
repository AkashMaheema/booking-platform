import { Injectable } from '@nestjs/common';
import { Prisma, Service } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { ServiceQueryDto } from './dto/service-query.dto';

@Injectable()
export class ServicesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.ServiceCreateInput): Promise<Service> {
    return this.prisma.service.create({ data });
  }

  async findById(id: string): Promise<Service | null> {
    return this.prisma.service.findUnique({ where: { id } });
  }

  async findByTitle(title: string): Promise<Service | null> {
    // using findFirst because title might not have a strict unique constraint in Prisma yet, 
    // but business rule requires it. If it is unique, findUnique is better.
    return this.prisma.service.findFirst({
      where: { title: { equals: title, mode: 'insensitive' } },
    });
  }

  async update(id: string, data: Prisma.ServiceUpdateInput): Promise<Service> {
    return this.prisma.service.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<Service> {
    return this.prisma.service.delete({ where: { id } });
  }

  async checkBookingsExist(serviceId: string): Promise<boolean> {
    // Note: Once the Booking model is implemented, this should count related bookings.
    // Assuming a relation named `bookings` will be created later.
    // For now, we simulate false or gracefully handle if the relation doesn't exist yet.
    try {
      const count = await (this.prisma as any).booking?.count({
        where: { serviceId },
      });
      return count !== undefined && count > 0;
    } catch (e) {
      // Fallback if booking model is not yet synced in Prisma
      return false;
    }
  }

  async findAll(query: ServiceQueryDto): Promise<{ data: Service[]; total: number }> {
    const { page = 1, limit = 10, search, sortBy = 'createdAt', sortOrder = 'desc', isActive } = query;
    const skip = (page - 1) * limit;
    const take = limit;

    const where: Prisma.ServiceWhereInput = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const orderBy: Prisma.ServiceOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.service.findMany({
        where,
        skip,
        take,
        orderBy,
      }),
      this.prisma.service.count({ where }),
    ]);

    return { data, total };
  }
}
