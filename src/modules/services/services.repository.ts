import { Injectable } from '@nestjs/common';
import { Prisma, Service } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { ServiceQueryDto } from './dto/service-query.dto';
import { calcSkip } from '../../common/utils/pagination.util';

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
    return this.prisma.service.findFirst({
      where: { title: { equals: title, mode: 'insensitive' } },
    });
  }

  async update(id: string, data: Prisma.ServiceUpdateInput): Promise<Service> {
    return this.prisma.service.update({ where: { id }, data });
  }

  async delete(id: string): Promise<Service> {
    return this.prisma.service.delete({ where: { id } });
  }

  async checkBookingsExist(serviceId: string): Promise<boolean> {
    try {
      const count = await this.prisma.booking.count({
        where: { serviceId },
      });
      return count > 0;
    } catch {
      return false;
    }
  }

  async findAll(query: ServiceQueryDto): Promise<{ data: Service[]; total: number }> {
    const { page = 1, limit = 10, search, sortBy = 'createdAt', order = 'desc', isActive } = query;

    const skip = calcSkip(page, limit);
    const take = Math.min(limit, 100);

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
      [sortBy]: order,
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.service.findMany({ where, skip, take, orderBy }),
      this.prisma.service.count({ where }),
    ]);

    return { data, total };
  }
}
