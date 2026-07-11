import { Injectable, Logger, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { BookingsRepository } from './bookings.repository';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { BookingQueryDto } from './dto/booking-query.dto';
import { BookingResponseDto } from './dto/booking-response.dto';
import { BookingStatus, Prisma } from '@prisma/client';
import { ServicesService } from '../services/services.service';

@Injectable()
export class BookingsService {
  private readonly logger = new Logger(BookingsService.name);

  constructor(
    private readonly bookingsRepository: BookingsRepository,
    private readonly servicesService: ServicesService,
  ) {}

  async createBooking(dto: CreateBookingDto): Promise<BookingResponseDto> {
    // Rule 1: Booking must reference an existing service.
    // getService throws NotFoundException if not found.
    const service = await this.servicesService.getService(dto.serviceId);

    // Rule 2: Inactive services cannot be booked.
    if (!service.isActive) {
      throw new ConflictException('Cannot book an inactive service.');
    }

    // Rule 3: Booking date cannot be in the past.
    // Parse as YYYY-MM-DD
    const bookingDate = new Date(dto.bookingDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today

    if (bookingDate < today) {
      throw new BadRequestException('Booking date cannot be in the past.');
    }

    // Rule 5: Prevent duplicate bookings.
    const duplicate = await this.bookingsRepository.findDuplicateBooking(dto.serviceId, bookingDate, dto.bookingTime);
    if (duplicate) {
      throw new ConflictException('A booking already exists for this service at the specified date and time.');
    }

    const data: Prisma.BookingCreateInput = {
      customerName: dto.customerName,
      customerEmail: dto.customerEmail,
      customerPhone: dto.customerPhone,
      bookingDate,
      bookingTime: dto.bookingTime,
      notes: dto.notes,
      service: {
        connect: { id: dto.serviceId },
      },
    };

    const newBooking = await this.bookingsRepository.create(data);
    this.logger.log(`Created booking with id ${newBooking.id}`);
    return new BookingResponseDto(newBooking);
  }

  async getBookings(query: BookingQueryDto): Promise<{ data: BookingResponseDto[]; pagination: any }> {
    const { data, total } = await this.bookingsRepository.findAll(query);
    const page = query.page || 1;
    const limit = query.limit || 10;
    const totalPages = Math.ceil(total / limit);

    return {
      data: data.map((booking) => new BookingResponseDto(booking)),
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

  async getBooking(id: string): Promise<BookingResponseDto> {
    const booking = await this.bookingsRepository.findById(id);
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }
    return new BookingResponseDto(booking);
  }

  async updateStatus(id: string, dto: UpdateBookingStatusDto): Promise<BookingResponseDto> {
    const booking = await this.bookingsRepository.findById(id);
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    // Rule 6 & 7: Status transition validations
    const currentStatus = booking.status;
    const newStatus = dto.status;

    if (currentStatus === BookingStatus.COMPLETED) {
      throw new ConflictException('Completed bookings cannot be modified.');
    }

    if (currentStatus === BookingStatus.CANCELLED && newStatus === BookingStatus.COMPLETED) {
      throw new ConflictException('Cancelled bookings cannot become completed.');
    }

    // Explicitly validate all valid flows
    // PENDING -> CONFIRMED, PENDING -> CANCELLED, CONFIRMED -> COMPLETED, CONFIRMED -> CANCELLED
    const validTransitions: Record<BookingStatus, BookingStatus[]> = {
      [BookingStatus.PENDING]: [BookingStatus.CONFIRMED, BookingStatus.CANCELLED],
      [BookingStatus.CONFIRMED]: [BookingStatus.COMPLETED, BookingStatus.CANCELLED],
      [BookingStatus.CANCELLED]: [],
      [BookingStatus.COMPLETED]: [],
    };

    if (currentStatus !== newStatus && !validTransitions[currentStatus].includes(newStatus)) {
      throw new ConflictException(`Invalid status transition from ${currentStatus} to ${newStatus}`);
    }

    const updatedBooking = await this.bookingsRepository.updateStatus(id, newStatus);
    this.logger.log(`Booking ${id} status updated to ${newStatus}`);
    return new BookingResponseDto(updatedBooking);
  }

  async cancelBooking(id: string): Promise<BookingResponseDto> {
    const booking = await this.bookingsRepository.findById(id);
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.status === BookingStatus.COMPLETED) {
      throw new ConflictException('Completed bookings cannot be cancelled.');
    }

    if (booking.status === BookingStatus.CANCELLED) {
      return new BookingResponseDto(booking); // already cancelled
    }

    const cancelledBooking = await this.bookingsRepository.cancel(id);
    this.logger.log(`Booking ${id} was cancelled`);
    return new BookingResponseDto(cancelledBooking);
  }
}
