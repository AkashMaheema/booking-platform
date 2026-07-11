import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { BookingsRepository } from './bookings.repository';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { BookingQueryDto } from './dto/booking-query.dto';
import { BookingResponseDto } from './dto/booking-response.dto';
import { BookingStatus, Prisma } from '@prisma/client';
import { ServicesService } from '../services/services.service';
import { BookingAlreadyExistsException } from '../../common/exceptions/booking-already-exists.exception';
import { InactiveServiceException } from '../../common/exceptions/inactive-service.exception';
import { BookingDateValidator } from './validators/booking-date.validator';
import { BookingStatusValidator } from './validators/booking-status.validator';
import { CompletedBookingException } from '../../common/exceptions/completed-booking.exception';
import { AuditService, AuditAction } from '../../common/logging/audit.service';

@Injectable()
export class BookingsService {
  private readonly logger = new Logger(BookingsService.name);

  constructor(
    private readonly bookingsRepository: BookingsRepository,
    private readonly servicesService: ServicesService,
    private readonly auditService: AuditService,
  ) {}

  async createBooking(dto: CreateBookingDto): Promise<BookingResponseDto> {
    // Rule 1: Booking must reference an existing service.
    // getService throws NotFoundException if not found.
    const service = await this.servicesService.getService(dto.serviceId);

    // Rule 2: Inactive services cannot be booked.
    if (!service.isActive) {
      throw new InactiveServiceException();
    }

    // Rule 3: Booking date cannot be in the past.
    const bookingDate = BookingDateValidator.validateFutureOrToday(dto.bookingDate);

    // Rule 5: Prevent duplicate bookings.
    const duplicate = await this.bookingsRepository.findDuplicateBooking(dto.serviceId, bookingDate, dto.bookingTime);
    if (duplicate) {
      throw new BookingAlreadyExistsException();
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

    this.auditService.log({
      action: AuditAction.BOOKING_CREATED,
      resource: 'Booking',
      resourceId: newBooking.id,
      details: { serviceId: dto.serviceId, date: bookingDate },
    });

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

    // Rule 6 & 7 & 8: Status transition validations
    BookingStatusValidator.validate(booking.status, dto.status);

    const updatedBooking = await this.bookingsRepository.updateStatus(id, dto.status);
    this.logger.log(`Booking ${id} status updated to ${dto.status}`);

    let auditAction = AuditAction.BOOKING_CREATED; // fallback
    if (dto.status === BookingStatus.CONFIRMED) auditAction = AuditAction.BOOKING_CONFIRMED;
    else if (dto.status === BookingStatus.COMPLETED) auditAction = AuditAction.BOOKING_COMPLETED;
    else if (dto.status === BookingStatus.CANCELLED) auditAction = AuditAction.BOOKING_CANCELLED;

    if (auditAction !== AuditAction.BOOKING_CREATED) {
      this.auditService.log({
        action: auditAction,
        resource: 'Booking',
        resourceId: updatedBooking.id,
      });
    }

    return new BookingResponseDto(updatedBooking);
  }

  async cancelBooking(id: string): Promise<BookingResponseDto> {
    const booking = await this.bookingsRepository.findById(id);
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.status === BookingStatus.COMPLETED) {
      throw new CompletedBookingException();
    }

    if (booking.status === BookingStatus.CANCELLED) {
      return new BookingResponseDto(booking); // already cancelled
    }

    const cancelledBooking = await this.bookingsRepository.cancel(id);
    this.logger.log(`Booking ${id} was cancelled`);

    this.auditService.log({
      action: AuditAction.BOOKING_CANCELLED,
      resource: 'Booking',
      resourceId: id,
    });

    return new BookingResponseDto(cancelledBooking);
  }
}
