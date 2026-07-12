import { Injectable } from '@nestjs/common';
import { Prisma, Booking, BookingStatus, Service } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { BookingQueryDto } from './dto/booking-query.dto';
import { calcSkip } from '../../common/utils/pagination.util';

@Injectable()
export class BookingsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    data: Prisma.BookingCreateInput,
  ): Promise<Booking & { service: Pick<Service, 'id' | 'title' | 'duration' | 'price'> }> {
    return this.prisma.$transaction(async (tx) => {
      return tx.booking.create({
        data,
        include: { service: { select: { id: true, title: true, duration: true, price: true } } },
      });
    });
  }

  async findById(
    id: string,
  ): Promise<(Booking & { service: Pick<Service, 'id' | 'title' | 'duration' | 'price'> }) | null> {
    return this.prisma.booking.findUnique({
      where: { id },
      include: { service: { select: { id: true, title: true, duration: true, price: true } } },
    });
  }

  async updateStatus(
    id: string,
    status: BookingStatus,
  ): Promise<Booking & { service: Pick<Service, 'id' | 'title' | 'duration' | 'price'> }> {
    return this.prisma.booking.update({
      where: { id },
      data: { status },
      include: { service: { select: { id: true, title: true, duration: true, price: true } } },
    });
  }

  async cancel(
    id: string,
  ): Promise<Booking & { service: Pick<Service, 'id' | 'title' | 'duration' | 'price'> }> {
    return this.updateStatus(id, BookingStatus.CANCELLED);
  }

  async findDuplicateBooking(
    serviceId: string,
    bookingDate: Date,
    bookingTime: string,
  ): Promise<Booking | null> {
    return this.prisma.booking.findFirst({
      where: {
        serviceId,
        bookingDate,
        bookingTime,
        status: { not: BookingStatus.CANCELLED },
      },
    });
  }

  async findAll(
    query: BookingQueryDto,
  ): Promise<{
    data: (Booking & { service: Pick<Service, 'id' | 'title' | 'duration' | 'price'> })[];
    total: number;
  }> {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = 'bookingDate',
      order = 'asc',
      status,
      serviceId,
      bookingDate,
    } = query;

    const skip = calcSkip(page, limit);
    const take = Math.min(limit, 100);

    const where: Prisma.BookingWhereInput = {};

    if (search) {
      where.OR = [
        { customerName: { contains: search, mode: 'insensitive' } },
        { customerEmail: { contains: search, mode: 'insensitive' } },
        { customerPhone: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (serviceId) {
      where.serviceId = serviceId;
    }

    if (bookingDate) {
      // Filter to the entire day: from midnight to end-of-day (UTC)
      const start = new Date(`${bookingDate}T00:00:00.000Z`);
      const end = new Date(`${bookingDate}T23:59:59.999Z`);
      where.bookingDate = { gte: start, lte: end };
    }

    const orderBy: Prisma.BookingOrderByWithRelationInput = {
      [sortBy]: order,
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.booking.findMany({
        where,
        skip,
        take,
        orderBy,
        include: { service: { select: { id: true, title: true, duration: true, price: true } } },
      }),
      this.prisma.booking.count({ where }),
    ]);

    return { data, total };
  }
}
