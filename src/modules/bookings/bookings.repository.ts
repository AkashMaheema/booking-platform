import { Injectable } from '@nestjs/common';
import { Prisma, Booking, BookingStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { BookingQueryDto } from './dto/booking-query.dto';

@Injectable()
export class BookingsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.BookingCreateInput): Promise<Booking> {
    // using $transaction for future-proofing as per rules
    return this.prisma.$transaction(async (tx) => {
      return tx.booking.create({
        data,
        include: { service: true },
      });
    });
  }

  async findById(id: string): Promise<(Booking & { service: any }) | null> {
    return this.prisma.booking.findUnique({
      where: { id },
      include: { service: true },
    });
  }

  async updateStatus(id: string, status: BookingStatus): Promise<Booking> {
    return this.prisma.booking.update({
      where: { id },
      data: { status },
      include: { service: true },
    });
  }

  async cancel(id: string): Promise<Booking> {
    return this.updateStatus(id, BookingStatus.CANCELLED);
  }

  async findDuplicateBooking(serviceId: string, bookingDate: Date, bookingTime: string): Promise<Booking | null> {
    return this.prisma.booking.findFirst({
      where: {
        serviceId,
        bookingDate,
        bookingTime,
        status: {
          not: BookingStatus.CANCELLED, // Cancelled bookings don't block new ones usually, but let's be strict or let the service decide. Actually, if it's unique in Prisma, it blocks it anyway. The Prisma schema has `@@unique([serviceId, bookingDate, bookingTime])`. We will just check existence.
        }
      },
    });
  }

  async findAll(query: BookingQueryDto): Promise<{ data: any[]; total: number }> {
    const { page = 1, limit = 10, search, sortBy = 'bookingDate', sortOrder = 'asc', status, serviceId, bookingDate } = query;
    const skip = (page - 1) * limit;
    const take = limit;

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
      where.bookingDate = new Date(bookingDate);
    }

    const orderBy: Prisma.BookingOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.booking.findMany({
        where,
        skip,
        take,
        orderBy,
        include: { service: true },
      }),
      this.prisma.booking.count({ where }),
    ]);

    return { data, total };
  }
}
